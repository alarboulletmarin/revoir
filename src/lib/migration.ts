/**
 * Passage du modèle plat au modèle normalisé.
 *
 * Jusqu'à la version 3, un « élément » portait sa catégorie sous forme de
 * chaîne libre et ses révisions dans un tableau embarqué ; la couleur d'une
 * matière vivait à part, indexée par le nom en minuscules. Le modèle actuel a
 * trois entités liées par identifiant.
 *
 * Cette transformation a **deux appelants** : la migration IndexedDB, au
 * premier chargement après mise à jour, et l'import d'un fichier de sauvegarde
 * ancien. Elle vit donc ici, pure et testable, plutôt qu'à moitié dans
 * `db/database.ts` et à moitié dans `lib/backup.ts` — deux implémentations
 * d'une même conversion finiraient par diverger sur un cas limite, et le cas
 * limite d'une migration, c'est la donnée de quelqu'un.
 *
 * Règle de conduite : elle ne lève jamais. Une donnée douteuse est nettoyée ou
 * ignorée. Une exception ici annulerait la transaction de mise à jour et
 * laisserait l'application inutilisable sur une base pourtant intacte.
 */
import type { Category, Review, Topic } from '../types'
import type { Teinte } from './categories'
import { cleCategorie } from './categories'
import { newId, type NouvelId } from './ids'

/** Une révision, telle qu'elle était stockée jusqu'en version 3. */
export interface ReviewLegacy {
  offset: number
  date: string
  done: boolean
  doneAt: string | null
}

/** Un élément, tel qu'il était stocké jusqu'en version 3. */
export interface ItemLegacy {
  id: string
  title: string
  category: string
  startDate: string
  schedule: string
  reviews: ReviewLegacy[]
  archived: boolean
  createdAt: string
  updatedAt: string
}

/** Les choix de teinte, indexés par nom de matière en minuscules. */
export type TeintesLegacy = Record<string, Teinte>

export interface Normalise {
  categories: Category[]
  topics: Topic[]
  reviews: Review[]
}

/**
 * Midi plutôt que minuit.
 *
 * Une révision peut avoir été cochée sans horodatage — les sauvegardes le
 * tolèrent depuis toujours. Il faut alors en inventer un, et `T00:00:00Z`
 * serait la veille au soir pour tout l'ouest de Greenwich : la frise placerait
 * la graduation un jour trop tôt. Midi UTC tombe le bon jour de Hawaï à
 * Auckland.
 */
function midiDe(jour: string): string {
  return `${jour}T12:00:00.000Z`
}

/**
 * Le moment de validation d'une révision ancienne.
 *
 * `done` fait foi, pas `doneAt` : un horodatage sur une révision non cochée est
 * un résidu, pas une validation oubliée.
 */
export function completionLegacy(review: ReviewLegacy): string | null {
  if (!review.done) return null
  return review.doneAt ?? midiDe(review.date)
}

/**
 * Les trois collections, à partir des éléments et des teintes d'avant.
 *
 * Les identifiants des éléments deviennent ceux des sujets : les anciennes
 * adresses `/element/:id` redirigent alors vers le sujet qu'elles désignaient,
 * et un raccourci posé sur un écran d'accueil continue de tomber juste.
 *
 * Une teinte dont plus aucun élément ne porte la matière est abandonnée : son
 * seul reste est un nom en minuscules, et une catégorie vide au libellé
 * approximatif vaut moins que pas de catégorie du tout.
 */
export function normaliserV3(
  items: ItemLegacy[],
  teintes: TeintesLegacy = {},
  nouvelId: NouvelId = newId,
): Normalise {
  const categories = new Map<string, Category>()
  const topics: Topic[] = []
  const reviews: Review[] = []

  for (const item of items) {
    const nom = item.category.trim()
    const cle = cleCategorie(nom)

    // La première graphie rencontrée l'emporte : « Maths » et « maths » sont
    // la même catégorie, et il faut bien en afficher une des deux.
    if (cle !== '' && !categories.has(cle)) {
      categories.set(cle, {
        id: nouvelId(),
        name: nom,
        tint: teintes[cle] ?? null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })
    }

    topics.push({
      id: item.id,
      categoryId: cle === '' ? null : (categories.get(cle)?.id ?? null),
      title: item.title,
      startDate: item.startDate,
      scheduleId: item.schedule,
      // La pratique n'existait pas : personne n'en a encore commencé une.
      practiceStatus: 'todo',
      status: item.archived ? 'archived' : 'active',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })

    // Le rang vient de l'ordre du tableau, pas du décalage : deux révisions au
    // même décalage — une donnée que rien n'interdisait — restent deux lignes
    // distinctes plutôt que de se fondre en une.
    item.reviews.forEach((review, index) => {
      reviews.push({
        id: nouvelId(),
        topicId: item.id,
        position: index + 1,
        intervalInDays: review.offset,
        dueDate: review.date,
        completedAt: completionLegacy(review),
      })
    })
  }

  return { categories: [...categories.values()], topics, reviews }
}
