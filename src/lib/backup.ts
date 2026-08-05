// SPDX-License-Identifier: AGPL-3.0-only

import type {
  Category,
  PracticeStatus,
  Programme,
  Review,
  ScheduleId,
  Topic,
  TopicStatus,
} from '../types'
import { textes } from '../i18n'
import { RYTHME_MAX_JOURS, RYTHME_MAX_REVISIONS, isScheduleId } from './schedules'
import { cleCategorie, retenirTeinte, type Teinte } from './categories'
import {
  normaliserV3,
  type ItemLegacy,
  type ReviewLegacy,
  type TeintesLegacy,
} from './migration'

export const BACKUP_APP = 'revoir'
/**
 * v2 ajoute `teintes`, v3 les programmes personnalisés, v4 remplace les
 * éléments par trois collections — catégories, sujets, révisions.
 *
 * Les sauvegardes plus anciennes restent importables : elles passent par la
 * même normalisation que la migration de la base, dans `lib/migration.ts`. Une
 * seule conversion, deux chemins d'entrée.
 */
export const BACKUP_VERSION = 4

export interface Backup {
  app: typeof BACKUP_APP
  version: number
  exporteLe: string
  categories: Category[]
  topics: Topic[]
  reviews: Review[]
  programmes: Programme[]
}

/** Ce qu'un fichier de sauvegarde restitue une fois validé. */
export interface ContenuSauvegarde {
  categories: Category[]
  topics: Topic[]
  reviews: Review[]
  programmes: Programme[]
}

/** Erreur levée quand un fichier importé n'est pas une sauvegarde exploitable. */
export class BackupError extends Error {}

export function buildBackup(
  contenu: ContenuSauvegarde,
  exporteLe = new Date().toISOString(),
): Backup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exporteLe,
    categories: contenu.categories,
    topics: contenu.topics,
    reviews: contenu.reviews,
    programmes: contenu.programmes,
  }
}

export function serializeBackup(
  contenu: ContenuSauvegarde,
  exporteLe?: string,
): string {
  return JSON.stringify(buildBackup(contenu, exporteLe), null, 2)
}

/** Nom de fichier proposé au téléchargement : « revoir-2026-03-14.json ». */
export function backupFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `revoir-${stamp}.json`
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

const PRATIQUES: PracticeStatus[] = ['todo', 'in_progress', 'done']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Un programme personnalisé. Contrairement aux teintes, on ne peut pas
 * l'ignorer en silence : des sujets en dépendent, et leur import échouerait
 * plus bas sur un identifiant devenu introuvable.
 */
function parseProgramme(value: unknown, index: number): Programme {
  if (!isRecord(value)) {
    throw new BackupError(textes().backup.programmeInvalide(index + 1))
  }
  const { id, label, offsets } = value
  if (typeof id !== 'string' || id === '') {
    throw new BackupError(textes().backup.programmeSansId(index + 1))
  }
  if (typeof label !== 'string' || label.trim() === '') {
    throw new BackupError(textes().backup.programmeSansNom(index + 1))
  }
  if (!Array.isArray(offsets) || offsets.length === 0) {
    throw new BackupError(textes().backup.rythmeManquant(label))
  }
  const retenus = offsets.filter(
    (offset): offset is number =>
      typeof offset === 'number' &&
      Number.isInteger(offset) &&
      offset >= 1 &&
      offset <= RYTHME_MAX_JOURS,
  )
  if (retenus.length === 0) {
    throw new BackupError(textes().backup.rythmeInvalide(label))
  }
  const now = new Date().toISOString()
  return {
    id,
    label: label.trim(),
    offsets: [...new Set(retenus)].sort((a, b) => a - b).slice(0, RYTHME_MAX_REVISIONS),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
  }
}

/* ================================================= format courant (v4) ==== */

/**
 * Une teinte inconnue est ignorée plutôt que de faire échouer tout l'import :
 * la catégorie retombera sur celle que son nom lui vaut. Une couleur libre est
 * renormalisée au passage — un fichier écrit à la main ne doit pas pouvoir
 * faire entrer une couleur illisible dans l'application.
 */
function parseTeinte(value: unknown): Teinte | null {
  return typeof value === 'string' ? retenirTeinte(value) : null
}

function parseCategory(value: unknown, index: number): Category {
  if (!isRecord(value)) {
    throw new BackupError(textes().backup.categorieInvalide(index + 1))
  }
  const { id, name } = value
  if (typeof id !== 'string' || id === '') {
    throw new BackupError(textes().backup.categorieSansId(index + 1))
  }
  if (typeof name !== 'string' || name.trim() === '') {
    throw new BackupError(textes().backup.categorieSansNom(index + 1))
  }
  const now = new Date().toISOString()
  return {
    id,
    name: name.trim(),
    tint: parseTeinte(value.tint),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  }
}

function parseTopic(
  value: unknown,
  index: number,
  programmes: Set<string>,
  categories: Set<string>,
): Topic {
  if (!isRecord(value)) {
    throw new BackupError(textes().backup.sujetInvalide(index + 1))
  }
  const { id, title, categoryId, startDate, scheduleId } = value
  if (typeof id !== 'string' || id === '') {
    throw new BackupError(textes().backup.sujetSansId(index + 1))
  }
  if (typeof title !== 'string' || title.trim() === '') {
    throw new BackupError(textes().backup.sujetSansTitre(index + 1))
  }
  if (typeof startDate !== 'string' || !DATE_KEY.test(startDate)) {
    throw new BackupError(textes().backup.dateDepartInvalide(title))
  }
  // Un identifiant de programme n'est pas une union fermée : il doit se
  // résoudre contre les trois intégrés ou contre un programme du même fichier.
  if (
    typeof scheduleId !== 'string' ||
    (!isScheduleId(scheduleId) && !programmes.has(scheduleId))
  ) {
    throw new BackupError(textes().backup.programmeInconnu(title))
  }
  /*
   * L'intégrité référentielle, que le modèle plat n'avait pas à défendre : un
   * sujet qui désigne une catégorie absente du fichier est une donnée cassée,
   * pas un sujet sans catégorie. Le taire produirait un import silencieusement
   * incomplet.
   */
  if (categoryId !== null && categoryId !== undefined) {
    if (typeof categoryId !== 'string' || !categories.has(categoryId)) {
      throw new BackupError(textes().backup.categorieInconnue(title))
    }
  }

  const now = new Date().toISOString()
  const pratique = value.practiceStatus
  const statut = value.status
  return {
    id,
    categoryId: typeof categoryId === 'string' ? categoryId : null,
    title: title.trim(),
    startDate,
    scheduleId: scheduleId as ScheduleId,
    practiceStatus: PRATIQUES.includes(pratique as PracticeStatus)
      ? (pratique as PracticeStatus)
      : 'todo',
    status: statut === 'archived' ? ('archived' as TopicStatus) : 'active',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  }
}

function parseReview(value: unknown, index: number, topics: Set<string>): Review {
  if (!isRecord(value)) {
    throw new BackupError(textes().backup.revisionInvalide(index + 1))
  }
  const { id, topicId, position, intervalInDays, dueDate, completedAt } = value
  if (typeof id !== 'string' || id === '') {
    throw new BackupError(textes().backup.revisionSansId(index + 1))
  }
  if (typeof topicId !== 'string' || !topics.has(topicId)) {
    throw new BackupError(textes().backup.revisionSujetInconnu(index + 1))
  }
  if (typeof position !== 'number' || !Number.isInteger(position) || position < 1) {
    throw new BackupError(textes().backup.revisionRang(index + 1))
  }
  if (typeof intervalInDays !== 'number' || !Number.isFinite(intervalInDays)) {
    throw new BackupError(textes().backup.revisionDecalage(index + 1))
  }
  if (typeof dueDate !== 'string' || !DATE_KEY.test(dueDate)) {
    throw new BackupError(textes().backup.revisionEcheance(index + 1))
  }
  return {
    id,
    topicId,
    position,
    intervalInDays,
    dueDate,
    completedAt: typeof completedAt === 'string' ? completedAt : null,
  }
}

/* =================================================== formats anciens (≤3) == */

function parseReviewLegacy(
  value: unknown,
  index: number,
  itemLabel: string,
): ReviewLegacy {
  if (!isRecord(value)) {
    throw new BackupError(textes().backup.revisionLegacy(index + 1, itemLabel))
  }
  const { offset, date, done, doneAt } = value
  if (typeof offset !== 'number' || !Number.isFinite(offset)) {
    throw new BackupError(textes().backup.decalageLegacy(itemLabel))
  }
  if (typeof date !== 'string' || !DATE_KEY.test(date)) {
    throw new BackupError(textes().backup.dateLegacy(itemLabel))
  }
  return {
    offset,
    date,
    done: done === true,
    doneAt: typeof doneAt === 'string' ? doneAt : null,
  }
}

function parseItemLegacy(
  value: unknown,
  index: number,
  programmes: Set<string>,
): ItemLegacy {
  if (!isRecord(value)) {
    throw new BackupError(textes().backup.elementInvalide(index + 1))
  }
  const { id, title, category, startDate, schedule, reviews, archived } = value
  if (typeof id !== 'string' || id === '') {
    throw new BackupError(textes().backup.elementSansId(index + 1))
  }
  if (typeof title !== 'string' || title.trim() === '') {
    throw new BackupError(textes().backup.elementSansTitre(index + 1))
  }
  if (typeof startDate !== 'string' || !DATE_KEY.test(startDate)) {
    throw new BackupError(textes().backup.dateDepartInvalide(title))
  }
  if (
    typeof schedule !== 'string' ||
    (!isScheduleId(schedule) && !programmes.has(schedule))
  ) {
    throw new BackupError(textes().backup.programmeInconnu(title))
  }
  if (!Array.isArray(reviews)) {
    throw new BackupError(textes().backup.revisionsManquantes(title))
  }
  const now = new Date().toISOString()
  return {
    id,
    title: title.trim(),
    category: typeof category === 'string' ? category.trim() : '',
    startDate,
    schedule,
    reviews: reviews.map((review, position) =>
      parseReviewLegacy(review, position, title),
    ),
    archived: archived === true,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  }
}

function parseTeintesLegacy(value: unknown): TeintesLegacy {
  if (!isRecord(value)) return {}
  const teintes: TeintesLegacy = {}
  for (const [cle, valeur] of Object.entries(value)) {
    if (cle.trim() === '') continue
    const teinte = parseTeinte(valeur)
    if (teinte) teintes[cleCategorie(cle)] = teinte
  }
  return teintes
}

/* ===================================================== point d'entrée ====== */

/**
 * Valide et normalise un fichier de sauvegarde. C'est le seul point d'entrée
 * de données extérieures à l'application : tout y est vérifié champ par champ.
 *
 * Le format se reconnaît à sa forme, pas à son numéro de version : un fichier
 * portant `items` est un ancien, un fichier portant `topics` est un courant.
 * Un numéro de version peut être faux — la présence d'une collection, non.
 */
export function parseBackup(raw: string): ContenuSauvegarde {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new BackupError(textes().backup.jsonInvalide)
  }
  if (!isRecord(parsed)) {
    throw new BackupError(textes().backup.pasUneSauvegarde)
  }
  if (parsed.app !== BACKUP_APP) {
    throw new BackupError(textes().backup.autreApplication)
  }

  /*
   * Les programmes d'abord : ce sont eux qui rendent résolubles les
   * identifiants portés par les sujets. `programmes` est absent des
   * sauvegardes v1 et v2, qui n'en connaissaient que trois, dans le code.
   */
  const programmes = Array.isArray(parsed.programmes)
    ? parsed.programmes.map((programme, index) => parseProgramme(programme, index))
    : []
  const idsProgrammes = new Set(programmes.map((programme) => programme.id))
  if (idsProgrammes.size !== programmes.length) {
    throw new BackupError(textes().backup.programmesDoublons)
  }

  if (Array.isArray(parsed.topics)) {
    return parseContenu(parsed, idsProgrammes, programmes)
  }
  if (Array.isArray(parsed.items)) {
    return parseContenuLegacy(parsed, idsProgrammes, programmes)
  }
  throw new BackupError(textes().backup.aucuneListe)
}

function parseContenu(
  parsed: Record<string, unknown>,
  idsProgrammes: Set<string>,
  programmes: Programme[],
): ContenuSauvegarde {
  const categories = Array.isArray(parsed.categories)
    ? parsed.categories.map((categorie, index) => parseCategory(categorie, index))
    : []
  const idsCategories = new Set(categories.map((categorie) => categorie.id))
  if (idsCategories.size !== categories.length) {
    throw new BackupError(textes().backup.categoriesDoublons)
  }

  const topics = (parsed.topics as unknown[]).map((topic, index) =>
    parseTopic(topic, index, idsProgrammes, idsCategories),
  )
  const idsTopics = new Set(topics.map((topic) => topic.id))
  if (idsTopics.size !== topics.length) {
    throw new BackupError(textes().backup.sujetsDoublons)
  }

  const reviews = Array.isArray(parsed.reviews)
    ? parsed.reviews.map((review, index) => parseReview(review, index, idsTopics))
    : []
  if (new Set(reviews.map((review) => review.id)).size !== reviews.length) {
    throw new BackupError(textes().backup.revisionsDoublons)
  }

  return { categories, topics, reviews, programmes }
}

/**
 * Une sauvegarde d'avant la v4 : validée dans son format d'origine, puis
 * convertie par la fonction qui sert aussi à la migration de la base.
 */
function parseContenuLegacy(
  parsed: Record<string, unknown>,
  idsProgrammes: Set<string>,
  programmes: Programme[],
): ContenuSauvegarde {
  const items = (parsed.items as unknown[]).map((item, index) =>
    parseItemLegacy(item, index, idsProgrammes),
  )
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new BackupError(textes().backup.elementsDoublons)
  }

  // `teintes` est absent des sauvegardes v1 : elles valent alors {}.
  const normalise = normaliserV3(items, parseTeintesLegacy(parsed.teintes))
  return { ...normalise, programmes }
}
