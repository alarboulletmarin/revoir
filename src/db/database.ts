import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type StoreNames,
} from 'idb'
import type { Category, Programme, Review, Topic } from '../types'
import { categoriesProposees, type Teinte } from '../lib/categories'
import {
  normaliserV3,
  type ItemLegacy,
  type TeintesLegacy,
} from '../lib/migration'

const DB_NAME = 'revoir'
const DB_VERSION = 4

const CATEGORIES = 'categories'
const TOPICS = 'topics'
const REVIEWS = 'reviews'
const PROGRAMMES = 'programmes'

/** Stores d'avant la v4. Ils ne sont lus qu'une fois, par la migration. */
const ITEMS_V3 = 'items'
const TEINTES_V3 = 'teintes'

/** Une teinte choisie par l'utilisateur, telle qu'elle était stockée en v3. */
interface TeinteEnregistreeV3 {
  cle: string
  teinte: Teinte
}

interface RevoirDB extends DBSchema {
  // Le volume de données reste petit (quelques dizaines de sujets) : on lit
  // tout en mémoire et on filtre en JS. D'où un seul index dans toute la base.
  categories: {
    key: string
    value: Category
  }
  topics: {
    key: string
    value: Topic
  }
  reviews: {
    key: string
    value: Review
    /**
     * Le seul index de la base, et il n'est pas là pour la lecture : supprimer
     * un sujet doit retrouver ses révisions sans balayer le store entier.
     */
    indexes: { topicId: string }
  }
  programmes: {
    key: string
    value: Programme
  }
  items: {
    key: string
    value: ItemLegacy
  }
  teintes: {
    key: string
    value: TeinteEnregistreeV3
  }
}

type Transaction = IDBPTransaction<
  RevoirDB,
  ArrayLike<StoreNames<RevoirDB>>,
  'versionchange'
>

let dbPromise: Promise<IDBPDatabase<RevoirDB>> | null = null

function getDB(): Promise<IDBPDatabase<RevoirDB>> {
  dbPromise ??= openDB<RevoirDB>(DB_NAME, DB_VERSION, {
    /*
     * Les migrations sont cumulatives : une base en v1 doit arriver en v4 sans
     * perdre ses données. Elle passe donc par la case v3 — ses stores sont
     * créés au besoin, puis lus, puis abandonnés.
     */
    upgrade(db, oldVersion, _nouvelleVersion, tx) {
      if (!db.objectStoreNames.contains(CATEGORIES)) {
        db.createObjectStore(CATEGORIES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(TOPICS)) {
        db.createObjectStore(TOPICS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(REVIEWS)) {
        const reviews = db.createObjectStore(REVIEWS, { keyPath: 'id' })
        reviews.createIndex('topicId', 'topicId')
      }
      if (!db.objectStoreNames.contains(PROGRAMMES)) {
        db.createObjectStore(PROGRAMMES, { keyPath: 'id' })
      }

      // `oldVersion === 0` : base neuve, il n'y a rien à reprendre.
      if (oldVersion > 0 && db.objectStoreNames.contains(ITEMS_V3)) {
        void migrerVersV4(db, tx)
      }

      /*
       * Le semis, et le seul moment où l'application a le droit d'écrire des
       * catégories que personne ne lui a demandées : une base neuve.
       *
       * Une base qui existait déjà — v1 à v4 — a `oldVersion > 0` et n'est
       * jamais semée : ses catégories sont celles de son propriétaire, et lui
       * en ajouter six serait s'inviter dans ses données. L'écran des
       * catégories les lui propose, il ne les lui impose pas.
       *
       * C'est aussi pourquoi `DB_VERSION` ne bouge pas. `upgrade` tourne déjà
       * pour une base neuve, quel que soit le numéro visé ; l'incrémenter
       * n'ajouterait qu'une transaction `versionchange` sur toutes les bases
       * existantes, qui reste bloquée tant qu'un autre onglet tient la sienne
       * ouverte. Un semis qui ne concerne que les bases neuves n'a pas à faire
       * attendre celles des autres.
       */
      if (oldVersion === 0) {
        void semerCategories(tx)
      }
    },
  })
  return dbPromise
}

/** Les six catégories livrées, écrites dans la transaction de création. */
function semerCategories(tx: Transaction) {
  const maintenant = new Date().toISOString()
  const categories = tx.objectStore(CATEGORIES)
  return Promise.all(
    categoriesProposees(maintenant).map((categorie) => categories.put(categorie)),
  )
}

/**
 * Reprise des données de la v3.
 *
 * Tout se passe dans la transaction de mise à jour : si quoi que ce soit lève,
 * elle est annulée et la base reste dans son état d'avant, intacte. C'est
 * `openDB` qui rejette alors, et l'application le dit — elle ne fait pas
 * semblant d'avoir démarré sur une base vide.
 *
 * `normaliserV3` ne lève jamais (voir son en-tête) : la seule cause d'échec
 * réaliste est le stockage lui-même.
 */
async function migrerVersV4(db: IDBPDatabase<RevoirDB>, tx: Transaction) {
  const items = await tx.objectStore(ITEMS_V3).getAll()

  // Une base v1 n'a pas de store de teintes : l'absence vaut « aucun choix ».
  const teintes: TeintesLegacy = {}
  if (db.objectStoreNames.contains(TEINTES_V3)) {
    for (const { cle, teinte } of await tx.objectStore(TEINTES_V3).getAll()) {
      teintes[cle] = teinte
    }
  }

  const normalise = normaliserV3(items, teintes)

  const categories = tx.objectStore(CATEGORIES)
  const topics = tx.objectStore(TOPICS)
  const reviews = tx.objectStore(REVIEWS)
  await Promise.all([
    ...normalise.categories.map((categorie) => categories.put(categorie)),
    ...normalise.topics.map((topic) => topics.put(topic)),
    ...normalise.reviews.map((review) => reviews.put(review)),
  ])

  // Les anciens stores partent une fois tout relu : un store que plus personne
  // n'ouvre est un piège pour la prochaine migration.
  db.deleteObjectStore(ITEMS_V3)
  if (db.objectStoreNames.contains(TEINTES_V3)) db.deleteObjectStore(TEINTES_V3)
}

/* ------------------------------------------------------------ catégories -- */

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB()
  return db.getAll(CATEGORIES)
}

export async function putCategory(categorie: Category): Promise<void> {
  const db = await getDB()
  await db.put(CATEGORIES, categorie)
}

/**
 * Supprime une catégorie et détache ses sujets, dans une seule transaction.
 *
 * Séparées, les deux opérations laisseraient à la moindre panne des sujets
 * désignant une catégorie disparue — précisément l'intégrité référentielle que
 * le modèle normalisé est là pour défendre, et que l'import refuse déjà de
 * franchir (« catégorie inconnue »).
 *
 * `detaches` vient de `detacherCategorie` : la décision se prend dans `lib/`,
 * où elle se teste ; ici, on ne fait plus qu'écrire.
 */
export async function deleteCategoryDetachingTopics(
  categoryId: string,
  detaches: Topic[],
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([CATEGORIES, TOPICS], 'readwrite')
  const topics = tx.objectStore(TOPICS)
  await Promise.all([
    ...detaches.map((topic) => topics.put(topic)),
    tx.objectStore(CATEGORIES).delete(categoryId),
  ])
  await tx.done
}

/* ---------------------------------------------------------------- sujets -- */

export async function getAllTopics(): Promise<Topic[]> {
  const db = await getDB()
  return db.getAll(TOPICS)
}

export async function putTopic(topic: Topic): Promise<void> {
  const db = await getDB()
  await db.put(TOPICS, topic)
}

/* ------------------------------------------------------------- révisions -- */

export async function getAllReviews(): Promise<Review[]> {
  const db = await getDB()
  return db.getAll(REVIEWS)
}

export async function putReview(review: Review): Promise<void> {
  const db = await getDB()
  await db.put(REVIEWS, review)
}

/**
 * Réécrit toutes les révisions d'un sujet d'un seul bloc.
 *
 * C'est l'écriture du recalage et celle d'« Annuler » : les deux déplacent
 * plusieurs échéances à la fois, et un état intermédiaire visible — la moitié
 * des dates recalées — n'aurait aucun sens.
 */
export async function replaceReviewsOfTopic(
  topicId: string,
  reviews: Review[],
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(REVIEWS, 'readwrite')
  const index = tx.store.index('topicId')
  for (const cle of await index.getAllKeys(topicId)) {
    await tx.store.delete(cle)
  }
  await Promise.all(reviews.map((review) => tx.store.put(review)))
  await tx.done
}

/**
 * Supprime un sujet et ses révisions dans une seule transaction. Séparées,
 * les deux opérations laisseraient à la moindre panne des révisions orphelines
 * — invisibles à l'écran, mais comptées dans toutes les statistiques.
 */
export async function deleteTopicWithReviews(topicId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([TOPICS, REVIEWS], 'readwrite')
  const reviews = tx.objectStore(REVIEWS)
  const index = reviews.index('topicId')
  for (const cle of await index.getAllKeys(topicId)) {
    await reviews.delete(cle)
  }
  await tx.objectStore(TOPICS).delete(topicId)
  await tx.done
}

/* ----------------------------------------------------------- programmes -- */

export async function getAllProgrammes(): Promise<Programme[]> {
  const db = await getDB()
  const programmes = await db.getAll(PROGRAMMES)
  // L'ordre de création est celui de l'affichage : IndexedDB rend les clés
  // triées, qui ne veulent rien dire ici.
  return programmes.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function putProgramme(programme: Programme): Promise<void> {
  const db = await getDB()
  await db.put(PROGRAMMES, programme)
}

export async function deleteProgramme(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(PROGRAMMES, id)
}

/* --------------------------------------------------------------- import -- */

export interface ContenuBase {
  categories: Category[]
  topics: Topic[]
  reviews: Review[]
  programmes: Programme[]
}

/**
 * Remplace intégralement le contenu de la base — c'est ce que fait l'import
 * d'une sauvegarde. Une seule transaction sur les quatre stores : un import
 * interrompu ne doit pas laisser des sujets sans leurs révisions.
 */
export async function replaceAll(contenu: ContenuBase): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([CATEGORIES, TOPICS, REVIEWS, PROGRAMMES], 'readwrite')
  await Promise.all([
    tx.objectStore(CATEGORIES).clear(),
    tx.objectStore(TOPICS).clear(),
    tx.objectStore(REVIEWS).clear(),
    tx.objectStore(PROGRAMMES).clear(),
  ])
  await Promise.all([
    ...contenu.categories.map((valeur) => tx.objectStore(CATEGORIES).put(valeur)),
    ...contenu.topics.map((valeur) => tx.objectStore(TOPICS).put(valeur)),
    ...contenu.reviews.map((valeur) => tx.objectStore(REVIEWS).put(valeur)),
    ...contenu.programmes.map((valeur) => tx.objectStore(PROGRAMMES).put(valeur)),
  ])
  await tx.done
}
