import type { Item, Review, ScheduleId } from '../types'
import { isScheduleId } from './schedules'
import { cleCategorie, estTeinte, type Teintes } from './categories'

export const BACKUP_APP = 'revoir'
/** v2 ajoute `teintes`. Les sauvegardes v1 restent importables telles quelles. */
export const BACKUP_VERSION = 2

export interface Backup {
  app: typeof BACKUP_APP
  version: number
  exporteLe: string
  items: Item[]
  teintes: Teintes
}

/** Ce qu'un fichier de sauvegarde restitue une fois validé. */
export interface ContenuSauvegarde {
  items: Item[]
  teintes: Teintes
}

/** Erreur levée quand un fichier importé n'est pas une sauvegarde exploitable. */
export class BackupError extends Error {}

export function buildBackup(
  items: Item[],
  teintes: Teintes = {},
  exporteLe = new Date().toISOString(),
): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exporteLe, items, teintes }
}

export function serializeBackup(
  items: Item[],
  teintes: Teintes = {},
  exporteLe?: string,
): string {
  return JSON.stringify(buildBackup(items, teintes, exporteLe), null, 2)
}

/** Nom de fichier proposé au téléchargement : « revoir-2026-03-14.json ». */
export function backupFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `revoir-${stamp}.json`
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseReview(value: unknown, index: number, itemLabel: string): Review {
  if (!isRecord(value)) {
    throw new BackupError(`Révision ${index + 1} invalide dans « ${itemLabel} ».`)
  }
  const { offset, date, done, doneAt } = value
  if (typeof offset !== 'number' || !Number.isFinite(offset)) {
    throw new BackupError(`Décalage invalide dans « ${itemLabel} ».`)
  }
  if (typeof date !== 'string' || !DATE_KEY.test(date)) {
    throw new BackupError(`Date de révision invalide dans « ${itemLabel} ».`)
  }
  return {
    offset,
    date,
    done: done === true,
    doneAt: typeof doneAt === 'string' ? doneAt : null,
  }
}

function parseItem(value: unknown, index: number): Item {
  if (!isRecord(value)) {
    throw new BackupError(`Élément ${index + 1} invalide.`)
  }
  const { id, title, category, startDate, schedule, reviews, archived } = value
  if (typeof id !== 'string' || id === '') {
    throw new BackupError(`Élément ${index + 1} : identifiant manquant.`)
  }
  if (typeof title !== 'string' || title.trim() === '') {
    throw new BackupError(`Élément ${index + 1} : titre manquant.`)
  }
  if (typeof startDate !== 'string' || !DATE_KEY.test(startDate)) {
    throw new BackupError(`« ${title} » : date de départ invalide.`)
  }
  if (!isScheduleId(schedule)) {
    throw new BackupError(`« ${title} » : configuration inconnue.`)
  }
  if (!Array.isArray(reviews)) {
    throw new BackupError(`« ${title} » : liste de révisions manquante.`)
  }
  const now = new Date().toISOString()
  return {
    id,
    title: title.trim(),
    category: typeof category === 'string' ? category.trim() : '',
    startDate,
    schedule: schedule as ScheduleId,
    reviews: reviews.map((review, position) => parseReview(review, position, title)),
    archived: archived === true,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  }
}

/**
 * Les teintes sont un confort, pas une donnée : une valeur inconnue est
 * ignorée plutôt que de faire échouer tout l'import. La matière retombera
 * sur sa teinte dérivée du nom.
 */
function parseTeintes(value: unknown): Teintes {
  if (!isRecord(value)) return {}
  const teintes: Teintes = {}
  for (const [cle, teinte] of Object.entries(value)) {
    if (typeof cle === 'string' && cle.trim() !== '' && estTeinte(teinte)) {
      teintes[cleCategorie(cle)] = teinte
    }
  }
  return teintes
}

/**
 * Valide et normalise un fichier de sauvegarde. C'est le seul point d'entrée
 * de données extérieures à l'application : tout y est vérifié champ par champ.
 */
export function parseBackup(raw: string): ContenuSauvegarde {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new BackupError("Ce fichier n’est pas un JSON valide.")
  }
  if (!isRecord(parsed)) {
    throw new BackupError('Le fichier ne contient pas une sauvegarde Revoir.')
  }
  if (parsed.app !== BACKUP_APP) {
    throw new BackupError('Le fichier ne provient pas de Revoir.')
  }
  if (!Array.isArray(parsed.items)) {
    throw new BackupError('Le fichier ne contient aucune liste d’éléments.')
  }
  const items = parsed.items.map((item, index) => parseItem(item, index))
  const ids = new Set(items.map((item) => item.id))
  if (ids.size !== items.length) {
    throw new BackupError('Le fichier contient des éléments en double.')
  }
  // `teintes` est absent des sauvegardes v1 : parseTeintes rend alors {}.
  return { items, teintes: parseTeintes(parsed.teintes) }
}
