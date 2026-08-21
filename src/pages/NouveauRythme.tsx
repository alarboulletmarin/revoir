// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { useAujourdhui } from '../state/useAujourdhui'
import { useBrouillonSujet, effacerBrouillon } from '../state/useBrouillonSujet'
import { buildReviews, getSchedule, listerDecalages, previewDates } from '../lib/schedules'
import { chargeParDate } from '../lib/stats'
import { titreValide } from '../lib/brouillon'
import { formatJourLong, formatShort } from '../lib/dates'
import { Frise } from '../components/Frise'
import { EtapeCreation } from '../components/EtapeCreation'

/**
 * Troisième question : à quel rythme ?
 *
 * C'est la dernière, et c'est donc ici — et nulle part avant — que le sujet
 * est écrit en base. Les deux pages précédentes n'ont rien enregistré, et
 * c'est ce que leur pied de page promet.
 *
 * L'aperçu ne montre pas seulement les dates générées : il montre **la charge
 * déjà prévue sur chacune** (règle métier n°4). C'est ce qui distingue
 * l'application d'un générateur de dates — avant de créer, on voit que le
 * 4 septembre porte déjà trois révisions.
 */
export function NouveauRythme() {
  const t = useTextes()
  useTitrePage(t.creation.rythme.question)
  const navigate = useNavigate()
  const aujourdhui = useAujourdhui()
  const { topics, reviews, programmes, programmesDisponibles, createTopic } = useDonnees()
  const { brouillon, majBrouillon } = useBrouillonSujet()
  const [enregistrement, setEnregistrement] = useState(false)

  const depart = brouillon.depart || aujourdhui

  const apercu = useMemo(() => {
    const { offsets } = getSchedule(brouillon.scheduleId, programmes)
    const dates = previewDates(depart, brouillon.scheduleId, programmes)
    const charge = chargeParDate(topics, reviews, dates)
    return dates.map((date, index) => ({
      offset: offsets[index],
      date,
      charge: charge.get(date) ?? 0,
    }))
  }, [depart, brouillon.scheduleId, programmes, topics, reviews])

  const creer = async () => {
    if (enregistrement) return
    setEnregistrement(true)
    try {
      const cree = await createTopic({
        title: brouillon.titre.trim(),
        categoryId: brouillon.categoryId,
        startDate: depart,
        scheduleId: brouillon.scheduleId,
      })
      // Le brouillon a fini son office : le laisser ferait rouvrir la création
      // suivante sur le sujet qu'on vient de créer.
      effacerBrouillon()
      navigate(`/sujet/${cree.id}`, { replace: true })
    } finally {
      setEnregistrement(false)
    }
  }

  /*
   * Ces trois pages ont des adresses, et une adresse s'ouvre directement — un
   * favori, un retour arrière, un onglet restauré. Sans titre, il n'y a rien à
   * créer ici : on renvoie à la question qui manque plutôt que d'offrir un
   * bouton qui échouerait.
   */
  if (!titreValide(brouillon.titre)) {
    return <Navigate to="/nouveau/titre" replace />
  }

  return (
    <EtapeCreation
      rang={3}
      question={t.creation.rythme.question}
      intro={t.creation.rythme.depart(formatJourLong(depart))}
      action={{
        libelle: t.creation.creer,
        onClick: creer,
        desactivee: enregistrement,
      }}
    >
      {/*
        On choisit un rythme, pas un mot (section 8.7) : chaque option déplie
        sa frise, où l'écart entre deux graduations vaut l'écart réel entre
        deux dates.
      */}
      <ul className="choix">
        {programmesDisponibles.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className={
                brouillon.scheduleId === option.id
                  ? 'choix__rythme choix__rythme--actif'
                  : 'choix__rythme'
              }
              aria-pressed={brouillon.scheduleId === option.id}
              onClick={() => majBrouillon({ scheduleId: option.id })}
            >
              <span className="choix__entete">
                <span className="choix__nom">{option.label}</span>
                <span className="choix__compte chiffres">
                  {t.sujetForm.resumeProgramme(option.offsets.length, option.description)}
                </span>
              </span>

              {brouillon.scheduleId === option.id && (
                <>
                  <Frise
                    origine={depart}
                    reviews={buildReviews('apercu', depart, option.id, programmes)}
                    aujourdhui={depart}
                    variante="mini"
                    intitule={t.reglages.programmes.intitule(option.label)}
                  />
                  <span className="choix__jours chiffres">
                    {listerDecalages(option.offsets)}
                  </span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      <p className="etape__lien">
        <Link to="/programmes/nouveau" className="lien">
          {t.creation.rythme.composer}
        </Link>{' '}
        <span className="discret discret--petit">{t.creation.rythme.composerAide}</span>
      </p>

      <section className="apercu">
        <h2 className="surtitre">{t.creation.rythme.apercu}</h2>
        <ul className="apercu__dates">
          {apercu.map((ligne) => (
            <li key={ligne.offset} className="apercu__ligne">
              <span className="apercu__decalage chiffres">
                {t.programmes.decalage(ligne.offset)}
              </span>
              <time className="apercu__date" dateTime={ligne.date}>
                {formatShort(ligne.date)}
              </time>
              {/*
                Au-delà de deux révisions déjà prévues, la mention passe en
                --retard-texte : ce n'est pas une erreur, c'est une journée
                qu'on peut encore décider d'éviter.
              */}
              <span
                className={
                  ligne.charge > 2 ? 'apercu__charge apercu__charge--dense' : 'apercu__charge'
                }
              >
                {ligne.charge === 0
                  ? t.sujetForm.rienDePrevu
                  : t.sujetForm.dejaPrevu(ligne.charge)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </EtapeCreation>
  )
}
