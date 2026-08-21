// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useValidation } from '../state/useValidation'
import { useGesteGroupe } from '../state/useGesteGroupe'
import { useAujourdhui } from '../state/useAujourdhui'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { addDaysToKey, formatJourLong, type DateKey } from '../lib/dates'
import { entriesForDate } from '../lib/stats'
import { estFaite } from '../lib/sujets'
import { LigneRevision } from '../components/LigneRevision'
import { Gabarit } from '../components/Etats'
import { Bouton } from '../components/Bouton'
import { IconeChevron } from '../components/Icons'

/** Une date-clé, vérifiée : elle vient de l'adresse, donc de l'extérieur. */
const EST_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Le jour — section 8.11 du design system.
 *
 * C'était une feuille glissante ; c'est une page. Elle a une adresse, donc un
 * lien qu'on peut poser sur un écran d'accueil et un retour arrière qui
 * fonctionne ; elle a un retour écrit, donc une sortie qui ne dépend plus d'un
 * geste ; et le pouce ne la referme plus par accident au milieu d'une liste.
 *
 * Les deux chevrons passent au jour voisin. Sur une feuille, changer de jour
 * demandait de la refermer, de viser une autre case et de la rouvrir.
 */
export function JourPage() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const t = useTextes()
  const aujourdhui = useAujourdhui()
  const { topics, reviews, loading } = useDonnees()
  const { validerEntree, devaliderEntree } = useValidation()
  const { marquerToutes, reporterToutes } = useGesteGroupe()

  const valide = date !== undefined && EST_DATE.test(date)
  const jour = (valide ? date : aujourdhui) as DateKey

  useTitrePage(formatJourLong(jour))

  const entrees = useMemo(
    () => entriesForDate(topics, reviews, jour),
    [topics, reviews, jour],
  )

  // Une adresse peut être tapée, ou héritée d'une version antérieure : une
  // date illisible renvoie au jour courant plutôt qu'à un écran cassé.
  if (!valide) return <Navigate to={`/jour/${aujourdhui}`} replace />

  const restantes = entrees.filter((entree) => !estFaite(entree.review))
  const faites = entrees.length - restantes.length

  const identifiants = restantes.map((entree) => entree.review.id)

  return (
    <div className="page-jour">
      <div className="page-jour__entete">
        <div className="page-jour__titres">
          {jour === aujourdhui && (
            <p className="surtitre">{t.dates.relatif.aujourdhui}</p>
          )}
          <h1 className="titre-page">{formatJourLong(jour)}</h1>
          <p className="page-jour__compte chiffres">
            {t.jour.compte(entrees.length, faites)}
          </p>
        </div>

        {/*
          Les deux chevrons vivent avec le titre et non dans l'en-tête de
          l'application : celui-ci porte le retour, et lui ajouter deux signes
          donnerait trois flèches sur une même rangée, dont une seule sort de
          la page.
        */}
        <div className="page-jour__navigation">
          <button
            type="button"
            className="page-jour__chevron"
            aria-label={t.jour.precedent}
            onClick={() => navigate(`/jour/${addDaysToKey(jour, -1)}`, { replace: true })}
          >
            <IconeChevron direction="gauche" width="18" height="18" />
          </button>
          <button
            type="button"
            className="page-jour__chevron"
            aria-label={t.jour.suivant}
            onClick={() => navigate(`/jour/${addDaysToKey(jour, 1)}`, { replace: true })}
          >
            <IconeChevron direction="droite" width="18" height="18" />
          </button>
        </div>
      </div>

      {loading ? (
        <Gabarit lignes={2} />
      ) : entrees.length === 0 ? (
        <p className="discret discret--petit">{t.calendrier.aucuneCeJour}</p>
      ) : (
        <>
          <ul className="liste-reglee">
            {entrees.map((entree) => (
              <LigneRevision
                key={entree.review.id}
                entry={entree}
                aujourdhui={aujourdhui}
                onValider={validerEntree}
                onDevalider={devaliderEntree}
                masquerDate
                detail="passage"
              />
            ))}
          </ul>

          {/*
            Les deux gestes du jour, une fois la liste lue. Ils ne s'affichent
            qu'avec quelque chose à faire : « Tout marquer comme revu » sur une
            journée soldée serait un bouton qui ne fait rien.
          */}
          {restantes.length > 0 && (
            <div className="page-jour__actions">
              <Bouton variante="primaire" onClick={() => marquerToutes(identifiants)}>
                {t.jour.toutMarquer}
              </Bouton>
              <Bouton variante="discret" onClick={() => reporterToutes(identifiants)}>
                {t.jour.toutReporter}
              </Bouton>
            </div>
          )}
        </>
      )}
    </div>
  )
}
