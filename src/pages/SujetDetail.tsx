// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useToast } from '../state/useToast'
import { useValidation } from '../state/useValidation'
import { useAujourdhui } from '../state/useAujourdhui'
import { libelleReport, useReport } from '../state/useReport'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { getSchedule } from '../lib/schedules'
import { echeancesIcs, nomFichierIcs, serialiserIcs } from '../lib/ics'
import { TYPE_ICS, telecharger } from '../lib/telechargement'
import { formatIsoDate, formatLong, formatRelative } from '../lib/dates'
import { estFaite, revisionsDe, topicProgress } from '../lib/sujets'
import type { ModeleSujet } from './SujetForm'
import { Frise } from '../components/Frise'
import { AnneauProgression } from '../components/AnneauProgression'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Bouton, LienBouton } from '../components/Bouton'
import {
  IconeArchive,
  IconeCalendrier,
  IconeCoche,
  IconeCorbeille,
} from '../components/Icons'
import { ChipCategorie } from '../components/ChipCategorie'
import { SelecteurPratique } from '../components/SelecteurPratique'
import { Gabarit } from '../components/Etats'

export function SujetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    topics,
    reviews,
    categories,
    loading,
    devalider,
    setArchived,
    definirPratique,
    removeTopic,
    programmes,
  } = useDonnees()
  const t = useTextes()
  const { afficherToast } = useToast()
  const { validerRevision } = useValidation()
  const reporter = useReport()
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const aujourdhui = useAujourdhui()

  const topic = topics.find((candidat) => candidat.id === id)
  useTitrePage(topic?.title ?? t.sujet.titreDefaut)

  const revisions = useMemo(
    () => (topic ? revisionsDe(topic.id, reviews) : []),
    [topic, reviews],
  )

  if (!topic) {
    return loading ? (
      <Gabarit lignes={4} />
    ) : (
      <div className="etat-vide">
        <p className="discret">{t.sujet.introuvable}</p>
        <LienBouton vers="/" variante="discret">
          {t.sujet.retourTableau}
        </LienBouton>
      </div>
    )
  }

  const categorie = categories.find((candidat) => candidat.id === topic.categoryId) ?? null
  const programme = getSchedule(topic.scheduleId, programmes)
  const faites = revisions.filter(estFaite).length
  const restantes = revisions.length - faites
  const progression = topicProgress(revisions)
  const creeLe = formatIsoDate(topic.createdAt)
  const archive = topic.status === 'archived'

  const basculer = (reviewId: string, faite: boolean) => {
    if (faite) devalider(reviewId)
    else validerRevision(reviewId)
  }

  const dupliquer = () => {
    const modele: ModeleSujet = {
      titre: topic.title,
      categoryId: topic.categoryId,
      scheduleId: topic.scheduleId,
      depuis: topic.title,
    }
    navigate('/nouveau', { state: { modele } })
  }

  const archiver = () => {
    setArchived(topic.id, !archive)
    afficherToast({
      texte: archive ? t.sujet.toastDesarchive : t.sujet.toastArchive,
      action: {
        libelle: t.commun.annuler,
        onAction: () => setArchived(topic.id, archive),
      },
    })
  }

  /*
   * L'export d'un seul sujet. Un sujet dont toutes les révisions sont faites
   * n'a rien à verser dans un agenda : plutôt qu'un fichier vide — que
   * l'agenda importerait sans rien dire —, on le dit.
   */
  const exporterIcs = () => {
    const echeances = echeancesIcs(topics, reviews, categories, programmes, topic.id)
    if (echeances.length === 0) {
      afficherToast({ texte: t.ics.aucuneSujet })
      return
    }
    telecharger(
      serialiserIcs(echeances, t.ics.nomCalendrierSujet(topic.title)),
      nomFichierIcs(topic.title),
      TYPE_ICS,
    )
    afficherToast({ texte: t.ics.exportees(echeances.length) })
  }

  return (
    <>
      <div className="fiche__entete">
        <h1 className="page__titre">{topic.title}</h1>
        <div className="fiche__badges">
          <ChipCategorie categorie={categorie} />
          <span className="chip chip--accent">{programme.label}</span>
          {archive && <span className="chip chip--retard">{t.sujet.archive}</span>}
        </div>
        {creeLe && <p className="page__intro">{t.sujet.creeLe(creeLe)}</p>}
      </div>

      {/* La frise en grand, avec ses libellés : c'est ici qu'elle se lit. */}
      <section className="fiche__bloc">
        <h2 className="section__titre">{t.sujet.programme}</h2>
        <Frise
          origine={topic.startDate}
          reviews={revisions}
          aujourdhui={aujourdhui}
          libelles="decalage"
          intitule={topic.title}
        />
        <div className="restantes">
          <AnneauProgression
            part={progression / 100}
            label={t.sujet.progression(progression)}
          />
          <p className="discret discret--petit chiffres" aria-live="polite">
            {t.sujet.compte(faites, restantes)}
          </p>
        </div>
      </section>

      {/*
        La pratique n'a pas d'échéance : c'est un état, pas une date. Elle vit
        donc ici et dans la colonne du tableau de suivi, et nulle part dans les
        listes du jour — sans date, elle y serait toujours en retard.
      */}
      <section className="fiche__bloc">
        <h2 className="section__titre">{t.pratique.legende}</h2>
        <SelecteurPratique
          valeur={topic.practiceStatus}
          legende={t.pratique.legendeSujet}
          onChange={(statut) => definirPratique(topic.id, statut)}
        />
        {/*
          Le mot ne se devine pas. Trois exemples valent mieux qu'une
          définition, et disent au passage que le sens change avec le domaine.
        */}
        <p className="discret discret--petit">{t.sujet.pratiqueDetail}</p>
      </section>

      <section className="fiche__bloc">
        <h2 className="section__titre">{t.sujet.echeances}</h2>
        <p className="discret discret--petit">
          {t.sujet.depart(formatLong(topic.startDate))}
        </p>
        <ul className="liste-revisions">
          {revisions.map((review) => {
            const faite = estFaite(review)
            const enRetard = !faite && review.dueDate < aujourdhui
            const classes = ['echeance', faite ? 'echeance--faite' : null]
              .filter(Boolean)
              .join(' ')

            return (
              <li key={review.id} className={classes}>
                <button
                  type="button"
                  className="ligne-revision__case"
                  role="checkbox"
                  aria-checked={faite}
                  aria-label={t.sujet.basculer(
                    faite,
                    t.programmes.decalage(review.intervalInDays),
                  )}
                  onClick={() => basculer(review.id, faite)}
                >
                  <span className="ligne-revision__cercle">
                    {faite && <IconeCoche className="ligne-revision__coche" />}
                  </span>
                </button>

                <div className="echeance__corps">
                  <span className="echeance__titre">
                    {t.programmes.decalage(review.intervalInDays)} ·{' '}
                    {formatLong(review.dueDate)}
                  </span>
                  <span
                    className={
                      faite
                        ? 'echeance__etat echeance__etat--fait'
                        : enRetard
                          ? 'echeance__etat echeance__etat--retard'
                          : 'echeance__etat'
                    }
                  >
                    {faite
                      ? t.sujet.effectuee
                      : formatRelative(review.dueDate, aujourdhui)}
                  </span>
                </div>

                {/*
                  « Pas aujourd'hui » : une échéance recule d'un jour sans que
                  les suivantes bougent. Rien à reporter sur une révision faite,
                  d'où l'absence du bouton plutôt qu'un bouton inerte.
                */}
                {!faite && (
                  <Bouton
                    variante="texte"
                    className="echeance__report"
                    aria-label={t.sujet.reporterCible(
                      libelleReport(review, aujourdhui),
                      t.programmes.decalage(review.intervalInDays),
                    )}
                    onClick={() => reporter(review.id, aujourdhui)}
                  >
                    {t.sujet.reporter}
                  </Bouton>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="fiche__bloc">
        <h2 className="section__titre">{t.sujet.actions}</h2>
        <div className="fiche__actions">
          <LienBouton vers={`/sujet/${topic.id}/modifier`} variante="discret">
            {t.commun.modifier}
          </LienBouton>
          {/*
            Le chapitre suivant se prépare comme le précédent : même catégorie,
            même programme, titre à retoucher, date d'aujourd'hui. C'est le
            formulaire de création qui s'ouvre — rien n'est écrit tant qu'il
            n'est pas soumis.
          */}
          <Bouton variante="discret" onClick={dupliquer}>
            {t.sujet.dupliquer}
          </Bouton>
          {/*
            L'export calendrier du sujet, là où vivent déjà ses autres actions.
            Le signe du calendrier plutôt qu'un dessin de plus : c'est bien un
            agenda que le fichier va remplir, et le mot est écrit à côté.
          */}
          <Bouton
            variante="discret"
            title={t.sujet.exporterIcsIntitule(topic.title)}
            onClick={exporterIcs}
          >
            <IconeCalendrier width="18" height="18" />
            {t.sujet.exporterIcs}
          </Bouton>
          <Bouton variante="discret" onClick={archiver}>
            <IconeArchive width="18" height="18" />
            {archive ? t.sujet.desarchiver : t.sujet.archiver}
          </Bouton>
          <Bouton variante="danger" onClick={() => setConfirmerSuppression(true)}>
            <IconeCorbeille width="18" height="18" />
            {t.commun.supprimer}
          </Bouton>
        </div>
        <p className="discret discret--petit">{t.sujet.noteArchive}</p>
      </section>

      {/*
        La seule action qui demande une confirmation (règle métier n°3).
        Les guillemets tiennent leur titre par une espace fine insécable :
        sans elle, un titre long renvoie le guillemet fermant seul à la ligne.
      */}
      <ConfirmDialog
        open={confirmerSuppression}
        title={t.sujet.confirmerSuppression}
        message={t.sujet.detailSuppression(topic.title, revisions.length)}
        confirmLabel={t.commun.supprimer}
        danger
        onCancel={() => setConfirmerSuppression(false)}
        onConfirm={() => {
          setConfirmerSuppression(false)
          void removeTopic(topic.id).then(() => navigate('/', { replace: true }))
        }}
      />
    </>
  )
}
