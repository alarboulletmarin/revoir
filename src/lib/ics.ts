// SPDX-License-Identifier: AGPL-3.0-only

/**
 * L'export calendrier (RFC 5545).
 *
 * Une seconde sortie, à côté du JSON, et pour un usage tout différent : le
 * JSON est une **sauvegarde** — il se réimporte, il porte tout, y compris les
 * sujets archivés (règle métier n°5). Le `.ics` est une **copie versée dans un
 * agenda** : on l'ouvre dans Google Agenda ou Apple Calendrier, et rien n'en
 * revient jamais. Confondre les deux serait promettre une synchronisation que
 * l'application ne fait pas et ne fera pas — il n'y a pas de serveur.
 *
 * Trois décisions, et chacune découle du projet plutôt que du format :
 *
 * 1. **Des journées entières, pas des rendez-vous.** Une révision n'a pas
 *    d'heure : elle a un jour. `DTSTART;VALUE=DATE` évite du même coup toute la
 *    question du fuseau — une échéance exportée à Paris et lue à Montréal reste
 *    le même jour, ce qu'un horodatage n'aurait pas garanti.
 * 2. **Ce qui reste à faire, et rien d'autre.** Une révision effectuée n'est
 *    plus une échéance ; la verser dans un agenda y remplirait des semaines de
 *    rappels périmés. L'application répond à « qu'est-ce que je dois revoir
 *    aujourd'hui ? », pas à « qu'ai-je révisé ».
 * 3. **Aucune alarme.** `VALARM` ferait sonner un téléphone, et l'application
 *    ne notifie pas — c'est écrit sur son premier écran. Qui veut un rappel le
 *    règle dans son agenda, où ce choix lui appartient.
 */
import type { Category, Programme, Review, Topic } from '../types'
import { textes } from '../i18n'
import { activeTopics, estFaite, revisionsParSujet } from './sujets'
import { getSchedule } from './schedules'
import type { DateKey } from './dates'

/** Ce qu'un événement du calendrier a besoin de savoir. Rien de plus. */
export interface EcheanceIcs {
  /** L'identifiant de la révision : il devient l'`UID`, donc il doit être stable. */
  id: string
  date: DateKey
  titre: string
  /** Le « 2 » de « Révision 2 sur 5 ». */
  rang: number
  total: number
  programme: string
  /** Le nom de la catégorie, ou null pour un sujet qui n'en a pas. */
  categorie: string | null
}

/**
 * Le domaine des `UID`. Il n'a pas besoin d'exister — la RFC demande une chaîne
 * globalement unique, et la partie droite sert seulement à ne pas entrer en
 * collision avec les identifiants d'un autre logiciel dans le même agenda.
 */
const DOMAINE = 'revoir.app'

/**
 * Les échéances à exporter.
 *
 * Sans `topicId`, celles de tous les sujets **actifs** : un sujet archivé est
 * sorti du tableau de bord, du calendrier et du suivi, il n'a pas à reparaître
 * dans un agenda. Avec `topicId`, celles de ce sujet-là, archivé ou non — on
 * l'a demandé explicitement depuis sa fiche, et refuser en silence serait une
 * énigme.
 */
export function echeancesIcs(
  topics: Topic[],
  reviews: Review[],
  categories: Category[],
  programmes: Programme[],
  topicId?: string,
): EcheanceIcs[] {
  const parSujet = revisionsParSujet(reviews)
  const parCategorie = new Map(categories.map((categorie) => [categorie.id, categorie]))
  const retenus =
    topicId === undefined
      ? activeTopics(topics)
      : topics.filter((topic) => topic.id === topicId)

  const echeances: EcheanceIcs[] = []
  for (const topic of retenus) {
    const revisions = parSujet.get(topic.id) ?? []
    const categorie =
      topic.categoryId === null ? null : (parCategorie.get(topic.categoryId) ?? null)
    for (const review of revisions) {
      if (estFaite(review)) continue
      echeances.push({
        id: review.id,
        date: review.dueDate,
        titre: topic.title,
        rang: review.position,
        total: revisions.length,
        programme: getSchedule(topic.scheduleId, programmes).label,
        categorie: categorie?.name ?? null,
      })
    }
  }
  return echeances.sort(comparerEcheances)
}

/** Par date, puis par titre : l'ordre dans lequel un agenda les relira. */
function comparerEcheances(a: EcheanceIcs, b: EcheanceIcs): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return a.titre < b.titre ? -1 : a.titre > b.titre ? 1 : 0
}

/**
 * Le texte du fichier.
 *
 * `horodatage` est injectable pour les tests : `DTSTAMP` est obligatoire et
 * change à chaque seconde, ce qui ne se compare pas.
 */
export function serialiserIcs(
  echeances: EcheanceIcs[],
  nomCalendrier: string,
  horodatage: Date = new Date(),
): string {
  const stamp = versHorodatage(horodatage)
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Revoir//Revoir//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    // Hors norme, mais c'est le seul champ que les agendas lisent pour nommer
    // un calendrier importé. Sans lui, le fichier arrive sous son nom de
    // fichier, ou sans nom du tout.
    `X-WR-CALNAME:${echapper(nomCalendrier)}`,
    ...echeances.flatMap((echeance) => evenement(echeance, stamp)),
    'END:VCALENDAR',
  ]
  // CRLF, et une ligne vide finale : la RFC 5545 ne connaît pas d'autre
  // terminaison, et quelques lecteurs stricts refusent un fichier en LF.
  return lignes.flatMap(plier).join('\r\n') + '\r\n'
}

function evenement(echeance: EcheanceIcs, stamp: string): string[] {
  const t = textes().ics
  const description = [
    t.description(echeance.rang, echeance.total, echeance.programme),
    echeance.categorie === null ? null : t.descriptionCategorie(echeance.categorie),
  ]
    .filter((partie): partie is string => partie !== null)
    .join('\n')

  const lignes = [
    'BEGIN:VEVENT',
    `UID:${echeance.id}@${DOMAINE}`,
    `DTSTAMP:${stamp}`,
    // La fin d'un événement en journée entière est **exclusive** : le
    // lendemain, sans quoi l'agenda l'étale sur deux jours.
    `DTSTART;VALUE=DATE:${versDate(echeance.date)}`,
    `DTEND;VALUE=DATE:${versDate(lendemain(echeance.date))}`,
    `SUMMARY:${echapper(t.evenement(echeance.titre))}`,
    `DESCRIPTION:${echapper(description)}`,
    'TRANSP:TRANSPARENT',
  ]
  if (echeance.categorie !== null) {
    lignes.push(`CATEGORIES:${echapper(echeance.categorie)}`)
  }
  lignes.push('END:VEVENT')
  return lignes
}

/** « 2026-03-14 » → « 20260314 ». */
function versDate(cle: DateKey): string {
  return cle.replaceAll('-', '')
}

/**
 * Le lendemain, calculé sur la chaîne plutôt que par `addDaysToKey`.
 *
 * `fromKey` interprète la clé en heure locale ; ici on ne veut aucune notion
 * d'heure, juste le jour suivant dans le calendrier grégorien. `Date.UTC`
 * donne exactement ça, sans qu'un fuseau puisse s'y glisser.
 */
function lendemain(cle: DateKey): DateKey {
  const [annee, mois, jour] = cle.split('-').map(Number)
  const suivant = new Date(Date.UTC(annee, mois - 1, jour + 1))
  return suivant.toISOString().slice(0, 10)
}

/** « 20260314T083000Z » — l'instant de l'export, en UTC comme la RFC l'exige. */
function versHorodatage(date: Date): string {
  return `${date.toISOString().replaceAll(/[-:]/g, '').slice(0, 15)}Z`
}

/**
 * Les quatre caractères que la RFC réserve dans une valeur de texte. L'ordre
 * compte : la contre-oblique d'abord, sinon on échapperait les échappements
 * que l'on vient d'écrire.
 */
function echapper(valeur: string): string {
  return valeur
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll(/\r?\n/g, '\\n')
}

/**
 * Le pliage de ligne.
 *
 * La RFC borne une ligne à 75 **octets**, pas à 75 caractères : « révision »
 * en compte neuf et pèse dix. On mesure donc en UTF-8, et on ne coupe jamais au
 * milieu d'un caractère — un « é » scindé en deux lignes ne se recolle pas.
 * Les lignes suivantes commencent par une espace, qui est la marque du pli.
 */
function plier(ligne: string): string[] {
  const encodeur = new TextEncoder()
  if (encodeur.encode(ligne).length <= 75) return [ligne]

  const morceaux: string[] = []
  let courant = ''
  let octets = 0
  // 75 pour la première ligne, 74 pour les suivantes : l'espace du pli compte.
  let plafond = 75

  for (const caractere of ligne) {
    const poids = encodeur.encode(caractere).length
    if (octets + poids > plafond) {
      morceaux.push(courant)
      courant = ''
      octets = 0
      plafond = 74
    }
    courant += caractere
    octets += poids
  }
  if (courant !== '') morceaux.push(courant)

  return morceaux.map((morceau, index) => (index === 0 ? morceau : ` ${morceau}`))
}

/**
 * Le nom du fichier proposé au téléchargement : « revoir-2026-03-14.ics », ou
 * « revoir-les-derivees-2026-03-14.ics » pour un sujet seul.
 *
 * Le titre est translittéré : un accent ou une apostrophe dans un nom de
 * fichier survit mal au passage d'un système à l'autre, et ce nom-là n'est plus
 * une donnée, c'est une étiquette.
 */
export function nomFichierIcs(sujet?: string, date = new Date()): string {
  const pad = (valeur: number) => String(valeur).padStart(2, '0')
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const morceau = sujet === undefined ? '' : `-${translitterer(sujet)}`
  return `revoir${morceau === '-' ? '' : morceau}-${stamp}.ics`
}

function translitterer(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 40)
    .replaceAll(/-+$/g, '')
}
