import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useToast } from '../state/useToast'
import { useValidation } from '../state/useValidation'
import { useAujourdhui } from '../state/useAujourdhui'
import { libelleReport, useReport } from '../state/useReport'
import { useTitrePage } from '../state/useTitrePage'
import { getSchedule } from '../lib/schedules'
import { formatIsoDate, formatLong, formatRelative } from '../lib/dates'
import { estFaite, revisionsDe, topicProgress } from '../lib/sujets'
import type { ModeleSujet } from './SujetForm'
import { Frise } from '../components/Frise'
import { AnneauProgression } from '../components/AnneauProgression'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Bouton, LienBouton } from '../components/Bouton'
import { IconeArchive, IconeCoche, IconeCorbeille } from '../components/Icons'
import { ChipCategorie } from '../components/ChipCategorie'
import { SelecteurPratique } from '../components/SelecteurPratique'

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
  const { afficherToast } = useToast()
  const { validerRevision } = useValidation()
  const reporter = useReport()
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const aujourdhui = useAujourdhui()

  const topic = topics.find((candidat) => candidat.id === id)
  useTitrePage(topic?.title ?? 'Sujet')

  const revisions = useMemo(
    () => (topic ? revisionsDe(topic.id, reviews) : []),
    [topic, reviews],
  )

  if (!topic) {
    return loading ? (
      <p className="discret">Chargement…</p>
    ) : (
      <div className="etat-vide">
        <p className="discret">Ce sujet n'existe pas ou plus.</p>
        <LienBouton vers="/" variante="discret">
          Retour au tableau de bord
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
      texte: archive ? 'Sujet désarchivé' : 'Sujet archivé',
      action: {
        libelle: 'Annuler',
        onAction: () => setArchived(topic.id, archive),
      },
    })
  }

  return (
    <>
      <div className="fiche__entete">
        <h1 className="page__titre">{topic.title}</h1>
        <div className="fiche__badges">
          <ChipCategorie categorie={categorie} />
          <span className="chip chip--accent">{programme.label}</span>
          {archive && <span className="chip chip--retard">Archivé</span>}
        </div>
        {creeLe && <p className="page__intro">Créé le {creeLe}</p>}
      </div>

      {/* La frise en grand, avec ses libellés : c'est ici qu'elle se lit. */}
      <section className="fiche__bloc">
        <h2 className="section__titre">Programme</h2>
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
            label={`Progression : ${progression} %`}
          />
          <p className="discret discret--petit chiffres" aria-live="polite">
            {faites} révision{faites > 1 ? 's' : ''} effectuée{faites > 1 ? 's' : ''} ·{' '}
            {restantes} restante{restantes > 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/*
        La pratique n'a pas d'échéance : c'est un état, pas une date. Elle vit
        donc ici et dans la colonne du tableau de suivi, et nulle part dans les
        listes du jour — sans date, elle y serait toujours en retard.
      */}
      <section className="fiche__bloc">
        <h2 className="section__titre">Pratique</h2>
        <SelecteurPratique
          valeur={topic.practiceStatus}
          legende="Où en est la pratique de ce sujet"
          onChange={(statut) => definirPratique(topic.id, statut)}
        />
        {/*
          Le mot ne se devine pas. Trois exemples valent mieux qu'une
          définition, et disent au passage que le sens change avec le domaine.
        */}
        <p className="discret discret--petit">
          Des exercices pour un cours, la répétition pour un instrument, une
          série de questions pour le code de la route. La pratique est un état,
          pas une date : elle n'a donc pas d'échéance.
        </p>
      </section>

      <section className="fiche__bloc">
        <h2 className="section__titre">Échéances</h2>
        <p className="discret discret--petit">Départ le {formatLong(topic.startDate)}</p>
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
                  aria-label={`${faite ? 'Décocher' : 'Marquer comme revu'} la révision J+${review.intervalInDays}`}
                  onClick={() => basculer(review.id, faite)}
                >
                  <span className="ligne-revision__cercle">
                    {faite && <IconeCoche className="ligne-revision__coche" />}
                  </span>
                </button>

                <div className="echeance__corps">
                  <span className="echeance__titre">
                    J+{review.intervalInDays} · {formatLong(review.dueDate)}
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
                    {faite ? 'effectuée' : formatRelative(review.dueDate, aujourdhui)}
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
                    aria-label={`${libelleReport(review, aujourdhui)} : révision J+${review.intervalInDays}`}
                    onClick={() => reporter(review.id, aujourdhui)}
                  >
                    Reporter
                  </Bouton>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="fiche__bloc">
        <h2 className="section__titre">Actions</h2>
        <div className="fiche__actions">
          <LienBouton vers={`/sujet/${topic.id}/modifier`} variante="discret">
            Modifier
          </LienBouton>
          {/*
            Le chapitre suivant se prépare comme le précédent : même catégorie,
            même programme, titre à retoucher, date d'aujourd'hui. C'est le
            formulaire de création qui s'ouvre — rien n'est écrit tant qu'il
            n'est pas soumis.
          */}
          <Bouton variante="discret" onClick={dupliquer}>
            Dupliquer
          </Bouton>
          <Bouton variante="discret" onClick={archiver}>
            <IconeArchive width="18" height="18" />
            {archive ? 'Désarchiver' : 'Archiver'}
          </Bouton>
          <Bouton variante="danger" onClick={() => setConfirmerSuppression(true)}>
            <IconeCorbeille width="18" height="18" />
            Supprimer
          </Bouton>
        </div>
        <p className="discret discret--petit">
          Un sujet archivé sort du tableau de bord, du calendrier et du suivi. Il reste
          dans l'export.
        </p>
      </section>

      {/*
        La seule action qui demande une confirmation (règle métier n°3).
        Les guillemets tiennent leur titre par une espace fine insécable :
        sans elle, un titre long renvoie le guillemet fermant seul à la ligne.
      */}
      <ConfirmDialog
        open={confirmerSuppression}
        title="Supprimer ce sujet ?"
        message={`« ${topic.title} » et ses ${revisions.length} révisions seront définitivement supprimés.`}
        confirmLabel="Supprimer"
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
