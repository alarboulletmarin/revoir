/**
 * Le modèle du tableau de suivi.
 *
 * Le tableau ne stocke rien : c'est une projection des sujets et de leurs
 * révisions. Tout ce qui suit est du calcul pur — les colonnes d'une
 * catégorie, l'état de chaque cellule, les trois chiffres de son en-tête. Le
 * rendu, lui, vit dans `pages/Suivi.tsx`.
 *
 * Deux sujets d'une même catégorie peuvent suivre des programmes différents.
 * Plutôt que de donner à chaque ligne son propre tableau — ce qui interdirait
 * la comparaison verticale, tout l'intérêt de la vue —, les colonnes sont
 * l'union de ce que la catégorie contient, et une étape absente d'un programme
 * s'y lit « hors programme ».
 */
import type { Review, Topic } from '../types'
import type { DateKey } from './dates'
import { nommerEcart } from './schedules'
import { estFaite, revisionsParSujet } from './sujets'

/**
 * `intervalles` nomme les colonnes par leur écart — J+1, J+3, J+7. Plus
 * informatif, mais une catégorie mêlant Simple et Ultime en compte jusqu'à
 * dix-sept.
 *
 * `compact` les nomme par leur rang — R1, R2, R3. Moins disert, mais un
 * en-tête tient dans 44px, ce qui est la condition pour que le tableau reste
 * un tableau sur un téléphone.
 */
export type ModeColonnes = 'compact' | 'intervalles'

export type EtatCellule =
  | 'faite'
  | 'aujourdhui'
  | 'retard'
  | 'avenir'
  | 'hors-programme'

export interface ColonneSuivi {
  /** Clé de rendu, stable pour un mode et une catégorie donnés. */
  cle: string
  /** Ce qui s'écrit dans l'en-tête : « J+7 » ou « R3 ». */
  libelle: string
  /** L'en-tête en toutes lettres, pour les lecteurs d'écran. */
  description: string
  /** En mode intervalles : l'écart de la colonne. Sinon null. */
  intervalInDays: number | null
  /** En mode compact : le rang de la colonne. Sinon null. */
  position: number | null
}

export interface CelluleSuivi {
  etat: EtatCellule
  /** La révision de cette case, ou null si l'étape n'est pas au programme. */
  review: Review | null
}

export interface LigneSuivi {
  topic: Topic
  cellules: CelluleSuivi[]
  /** Les révisions du sujet, pour le panneau d'une cellule. */
  revisions: Review[]
}

export interface StatsCategorie {
  sujets: number
  enRetard: number
  /** Part des révisions effectuées, de 0 à 100 (arrondie). */
  progression: number
}

/**
 * Les colonnes d'une catégorie.
 *
 * En mode intervalles, l'union des écarts présents, triée. En mode compact,
 * les rangs de 1 au plus long programme de la catégorie.
 */
export function colonnesCategorie(
  topics: Topic[],
  reviews: Review[],
  mode: ModeColonnes,
): ColonneSuivi[] {
  const parSujet = revisionsParSujet(reviews)
  const revisionsUtiles = topics.flatMap((topic) => parSujet.get(topic.id) ?? [])

  if (mode === 'compact') {
    const plusLong = revisionsUtiles.reduce(
      (maximum, review) => Math.max(maximum, review.position),
      0,
    )
    return Array.from({ length: plusLong }, (_, index) => {
      const position = index + 1
      return {
        cle: `p-${position}`,
        libelle: `R${position}`,
        description: `Révision ${position}`,
        intervalInDays: null,
        position,
      }
    })
  }

  const ecarts = [
    ...new Set(revisionsUtiles.map((review) => review.intervalInDays)),
  ].sort((a, b) => a - b)

  return ecarts.map((intervalInDays) => ({
    cle: `i-${intervalInDays}`,
    libelle: `J+${intervalInDays}`,
    description: `Révision à ${nommerEcart(intervalInDays)}`,
    intervalInDays,
    position: null,
  }))
}

/**
 * L'état d'une révision au regard du jour courant.
 *
 * L'ordre des tests compte : une révision faite le reste, même si sa date est
 * passée. Le retard ne s'applique qu'à ce qui reste à faire.
 */
export function etatRevision(review: Review, aujourdhui: DateKey): EtatCellule {
  if (estFaite(review)) return 'faite'
  if (review.dueDate === aujourdhui) return 'aujourdhui'
  if (review.dueDate < aujourdhui) return 'retard'
  return 'avenir'
}

/** Une ligne par sujet, une cellule par colonne — jamais de trou. */
export function lignesCategorie(
  topics: Topic[],
  reviews: Review[],
  colonnes: ColonneSuivi[],
  aujourdhui: DateKey,
): LigneSuivi[] {
  const parSujet = revisionsParSujet(reviews)

  return topics.map((topic) => {
    const revisions = parSujet.get(topic.id) ?? []
    const parIntervalle = new Map(
      revisions.map((review) => [review.intervalInDays, review]),
    )
    const parPosition = new Map(revisions.map((review) => [review.position, review]))

    return {
      topic,
      revisions,
      cellules: colonnes.map((colonne) => {
        const review =
          colonne.position === null
            ? (parIntervalle.get(colonne.intervalInDays!) ?? null)
            : (parPosition.get(colonne.position) ?? null)
        return review === null
          ? { etat: 'hors-programme' as const, review: null }
          : { etat: etatRevision(review, aujourdhui), review }
      }),
    }
  })
}

/**
 * Les trois chiffres de l'en-tête d'une catégorie : « 8 sujets · 3 révisions
 * en retard · 62 % terminé ». Limités et directement utiles — pas de score, pas
 * de moyenne, aucune comparaison entre catégories.
 */
export function statsCategorie(
  topics: Topic[],
  reviews: Review[],
  aujourdhui: DateKey,
): StatsCategorie {
  const ids = new Set(topics.map((topic) => topic.id))
  let faites = 0
  let total = 0
  let enRetard = 0

  for (const review of reviews) {
    if (!ids.has(review.topicId)) continue
    total += 1
    if (estFaite(review)) faites += 1
    else if (review.dueDate < aujourdhui) enRetard += 1
  }

  return {
    sujets: topics.length,
    enRetard,
    progression: total === 0 ? 0 : Math.round((faites / total) * 100),
  }
}

/** « 8 sujets · 3 révisions en retard · 62 % terminé », sans le zéro inutile. */
export function resumeCategorie(stats: StatsCategorie): string {
  const parties = [`${stats.sujets} sujet${stats.sujets > 1 ? 's' : ''}`]
  // Le retard n'accuse pas : à zéro il ne s'écrit pas, plutôt que d'annoncer
  // fièrement « 0 en retard » à qui n'en a jamais eu.
  if (stats.enRetard > 0) {
    parties.push(
      `${stats.enRetard} révision${stats.enRetard > 1 ? 's' : ''} en retard`,
    )
  }
  parties.push(`${stats.progression} % terminé`)
  return parties.join(' · ')
}
