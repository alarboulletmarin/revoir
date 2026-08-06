// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useValidation } from '../state/useValidation'
import { useAujourdhui } from '../state/useAujourdhui'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { textes } from '../i18n'
import { formatLong, formatRelative, type DateKey } from '../lib/dates'
import { overdueEntries, todayEntries, upcomingEntries } from '../lib/stats'
import { estFaite } from '../lib/sujets'
import type { Review, ReviewEntry, Topic } from '../types'
import { LigneRevision } from '../components/LigneRevision'

/**
 * Destination des liens « Tout voir ». Colonne simple : le bento est réservé
 * au tableau de bord (section 7.2).
 */
const FILTRES = {
  aujourdhui: {
    entrees: (topics: Topic[], reviews: Review[], jour: DateKey) =>
      todayEntries(topics, reviews, jour).filter((entree) => !estFaite(entree.review)),
  },
  retard: {
    entrees: (topics: Topic[], reviews: Review[], jour: DateKey) =>
      overdueEntries(topics, reviews, jour),
  },
  prochaines: {
    // Sans plafond : cet écran est la destination de « Tout voir ».
    entrees: (topics: Topic[], reviews: Review[], jour: DateKey) =>
      upcomingEntries(topics, reviews, null, jour),
  },
} as const

type Filtre = keyof typeof FILTRES

const estFiltre = (valeur: string | undefined): valeur is Filtre =>
  valeur !== undefined && valeur in FILTRES

export function ReviewList() {
  const { filtre } = useParams<{ filtre: string }>()
  if (!estFiltre(filtre)) return <Navigate to="/" replace />
  return <Liste filtre={filtre} />
}

function Liste({ filtre }: { filtre: Filtre }) {
  const { topics, reviews } = useDonnees()
  const { validerEntree, devaliderEntree } = useValidation()
  const aujourdhui = useAujourdhui()
  const t = useTextes()
  const config = FILTRES[filtre]
  const libelles = t.listes[filtre]

  useTitrePage(libelles.titre)

  const groupes = useMemo(
    () => grouperParJour(config.entrees(topics, reviews, aujourdhui)),
    [config, topics, reviews, aujourdhui],
  )

  return (
    <>
      <div className="page__entete">
        <h1 className="page__titre">{libelles.titre}</h1>
        <p className="page__intro" aria-live="polite">
          {compter(groupes)}
        </p>
      </div>

      {groupes.length === 0 ? (
        <p className="discret">{libelles.vide}</p>
      ) : (
        groupes.map(([jour, entrees]) => (
          <section key={jour} className="groupe-jour">
            <h2 className="groupe-jour__titre">
              {formatLong(jour)} · {formatRelative(jour, aujourdhui)}
            </h2>
            <ul className="liste-revisions">
              {entrees.map((entree) => (
                <LigneRevision
                  key={entree.review.id}
                  entry={entree}
                  aujourdhui={aujourdhui}
                  onValider={validerEntree}
                  onDevalider={devaliderEntree}
                  masquerDate
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  )
}

/** Les entrées arrivent déjà triées par date : un simple parcours suffit. */
function grouperParJour(entrees: ReviewEntry[]): [DateKey, ReviewEntry[]][] {
  const groupes: [DateKey, ReviewEntry[]][] = []
  for (const entree of entrees) {
    const dernier = groupes.at(-1)
    if (dernier && dernier[0] === entree.review.dueDate) dernier[1].push(entree)
    else groupes.push([entree.review.dueDate, [entree]])
  }
  return groupes
}

function compter(groupes: [DateKey, ReviewEntry[]][]): string {
  const total = groupes.reduce((somme, [, entrees]) => somme + entrees.length, 0)
  return textes().commun.revisions(total)
}
