// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import type { Category, Programme, Review, Topic } from '../types'
import { compteur } from './ids'
import { buildReviews } from './schedules'
import { echeancesIcs, nomFichierIcs, serialiserIcs, type EcheanceIcs } from './ics'

const MAINTENANT = '2026-03-01T09:00:00.000Z'
const HORODATAGE = new Date('2026-03-14T08:30:00.000Z')

const CATEGORIE: Category = {
  id: 'cat-etudes',
  name: 'Études',
  tint: 'bleu',
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
}

function sujet(
  id: string,
  title: string,
  options: {
    startDate?: string
    doneOffsets?: number[]
    categoryId?: string | null
    archived?: boolean
  } = {},
): { topic: Topic; reviews: Review[] } {
  const startDate = options.startDate ?? '2026-03-10'
  const done = new Set(options.doneOffsets ?? [])
  return {
    topic: {
      id,
      categoryId: options.categoryId === undefined ? CATEGORIE.id : options.categoryId,
      title,
      startDate,
      scheduleId: 'simple',
      practiceStatus: 'todo',
      status: options.archived ? 'archived' : 'active',
      createdAt: MAINTENANT,
      updatedAt: MAINTENANT,
    },
    reviews: buildReviews(id, startDate, 'simple', [], compteur(`${id}-r`)).map(
      (review) =>
        done.has(review.intervalInDays)
          ? { ...review, completedAt: MAINTENANT }
          : review,
    ),
  }
}

const PROGRAMMES: Programme[] = []

/** Une échéance minimale, pour éprouver la sérialisation seule. */
function echeance(partiel: Partial<EcheanceIcs> = {}): EcheanceIcs {
  return {
    id: 'rev-1',
    date: '2026-03-11',
    titre: 'Les dérivées',
    rang: 1,
    total: 5,
    programme: 'Simple',
    categorie: 'Études',
    ...partiel,
  }
}

/** Les lignes dépliées : le pliage est testé à part, il gêne partout ailleurs. */
function lignes(ics: string): string[] {
  return ics
    .replaceAll('\r\n ', '')
    .split('\r\n')
    .filter((ligne) => ligne !== '')
}

describe('echeancesIcs', () => {
  it('ne retient que ce qui reste à faire', () => {
    const derivees = sujet('t-1', 'Les dérivées', { doneOffsets: [1, 3] })
    const echeances = echeancesIcs(
      [derivees.topic],
      derivees.reviews,
      [CATEGORIE],
      PROGRAMMES,
    )
    // Simple compte cinq échéances ; deux sont faites.
    expect(echeances).toHaveLength(3)
    expect(echeances.map((item) => item.date)).toEqual([
      '2026-03-17',
      '2026-03-24',
      '2026-04-09',
    ])
  })

  it('écarte les sujets archivés de l’export global', () => {
    const actif = sujet('t-1', 'Actif')
    const range = sujet('t-2', 'Rangé', { archived: true })
    const echeances = echeancesIcs(
      [actif.topic, range.topic],
      [...actif.reviews, ...range.reviews],
      [CATEGORIE],
      PROGRAMMES,
    )
    expect(new Set(echeances.map((item) => item.titre))).toEqual(new Set(['Actif']))
  })

  /*
   * Exporter depuis la fiche d'un sujet archivé est un geste explicite : le
   * refuser en silence laisserait un bouton qui ne fait rien.
   */
  it('exporte un sujet archivé quand il est demandé nommément', () => {
    const range = sujet('t-2', 'Rangé', { archived: true })
    const echeances = echeancesIcs(
      [range.topic],
      range.reviews,
      [CATEGORIE],
      PROGRAMMES,
      't-2',
    )
    expect(echeances).toHaveLength(5)
  })

  it('trie par date, puis par titre', () => {
    const a = sujet('t-1', 'Zèbre')
    const b = sujet('t-2', 'Abeille')
    const echeances = echeancesIcs(
      [a.topic, b.topic],
      [...a.reviews, ...b.reviews],
      [CATEGORIE],
      PROGRAMMES,
    )
    expect(echeances.slice(0, 2).map((item) => item.titre)).toEqual([
      'Abeille',
      'Zèbre',
    ])
  })

  it('porte le rang, le total, le programme et la catégorie', () => {
    const derivees = sujet('t-1', 'Les dérivées')
    const [premiere] = echeancesIcs(
      [derivees.topic],
      derivees.reviews,
      [CATEGORIE],
      PROGRAMMES,
    )
    expect(premiere).toMatchObject({
      rang: 1,
      total: 5,
      programme: 'Simple',
      categorie: 'Études',
    })
  })

  it('laisse la catégorie à null pour un sujet qui n’en a pas', () => {
    const orphelin = sujet('t-1', 'Orphelin', { categoryId: null })
    const [premiere] = echeancesIcs(
      [orphelin.topic],
      orphelin.reviews,
      [CATEGORIE],
      PROGRAMMES,
    )
    expect(premiere.categorie).toBeNull()
  })
})

describe('serialiserIcs', () => {
  it('produit un calendrier bien formé', () => {
    const contenu = lignes(serialiserIcs([echeance()], 'Revoir', HORODATAGE))
    expect(contenu[0]).toBe('BEGIN:VCALENDAR')
    expect(contenu.at(-1)).toBe('END:VCALENDAR')
    expect(contenu).toContain('VERSION:2.0')
    expect(contenu).toContain('X-WR-CALNAME:Revoir')
    expect(contenu.filter((ligne) => ligne === 'BEGIN:VEVENT')).toHaveLength(1)
  })

  it('termine chaque ligne par CRLF, y compris la dernière', () => {
    const ics = serialiserIcs([echeance()], 'Revoir', HORODATAGE)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.includes('\n\r')).toBe(false)
    // Aucun saut de ligne seul : tout LF est précédé d'un CR.
    expect(/[^\r]\n/.test(ics)).toBe(false)
  })

  /*
   * Une journée entière, et sa fin est exclusive : sans le lendemain en DTEND,
   * les agendas étalent l'échéance sur deux jours — ou la refusent.
   */
  it('écrit une journée entière qui finit le lendemain', () => {
    const contenu = lignes(serialiserIcs([echeance()], 'Revoir', HORODATAGE))
    expect(contenu).toContain('DTSTART;VALUE=DATE:20260311')
    expect(contenu).toContain('DTEND;VALUE=DATE:20260312')
  })

  it('franchit un changement de mois et une année bissextile', () => {
    const finMois = lignes(
      serialiserIcs([echeance({ date: '2026-03-31' })], 'Revoir', HORODATAGE),
    )
    expect(finMois).toContain('DTEND;VALUE=DATE:20260401')

    const bissextile = lignes(
      serialiserIcs([echeance({ date: '2028-02-28' })], 'Revoir', HORODATAGE),
    )
    expect(bissextile).toContain('DTEND;VALUE=DATE:20280229')
  })

  it('donne un UID stable, dérivé de la révision', () => {
    const contenu = lignes(
      serialiserIcs([echeance({ id: 'rev-42' })], 'Revoir', HORODATAGE),
    )
    expect(contenu).toContain('UID:rev-42@revoir.app')
  })

  it('horodate en UTC, au format de la RFC', () => {
    const contenu = lignes(serialiserIcs([echeance()], 'Revoir', HORODATAGE))
    expect(contenu).toContain('DTSTAMP:20260314T083000Z')
  })

  /*
   * Le point-virgule et la virgule séparent les paramètres et les valeurs d'un
   * champ : non échappés, un titre les emporte et le fichier devient illisible.
   */
  it('échappe les caractères réservés d’un titre', () => {
    const contenu = lignes(
      serialiserIcs(
        [echeance({ titre: 'Droit ; civil, tome 1\\2' })],
        'Revoir',
        HORODATAGE,
      ),
    )
    const resume = contenu.find((ligne) => ligne.startsWith('SUMMARY:'))
    expect(resume).toBe('SUMMARY:Revoir : Droit \\; civil\\, tome 1\\\\2')
  })

  it('replie les lignes trop longues, sans couper un caractère en deux', () => {
    const titre = 'é'.repeat(120)
    const ics = serialiserIcs([echeance({ titre })], 'Revoir', HORODATAGE)
    const encodeur = new TextEncoder()
    for (const ligne of ics.split('\r\n')) {
      expect(encodeur.encode(ligne).length).toBeLessThanOrEqual(75)
    }
    // Déplié, le titre est intact : aucun « é » n'a été scindé.
    expect(lignes(ics).join('\n')).toContain(titre)
  })

  it('omet CATEGORIES quand le sujet n’a pas de catégorie', () => {
    const avec = lignes(serialiserIcs([echeance()], 'Revoir', HORODATAGE))
    const sans = lignes(
      serialiserIcs([echeance({ categorie: null })], 'Revoir', HORODATAGE),
    )
    expect(avec).toContain('CATEGORIES:Études')
    expect(sans.some((ligne) => ligne.startsWith('CATEGORIES:'))).toBe(false)
  })

  it('reste un calendrier valide sans aucune échéance', () => {
    const contenu = lignes(serialiserIcs([], 'Revoir', HORODATAGE))
    expect(contenu).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Revoir//Revoir//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Revoir',
      'END:VCALENDAR',
    ])
  })
})

describe('nomFichierIcs', () => {
  const jour = new Date(2026, 2, 14)

  it('date l’export global', () => {
    expect(nomFichierIcs(undefined, jour)).toBe('revoir-2026-03-14.ics')
  })

  it('translittère le titre d’un sujet', () => {
    expect(nomFichierIcs('Les dérivées', jour)).toBe('revoir-les-derivees-2026-03-14.ics')
  })

  it('retombe sur le nom global quand le titre ne laisse rien', () => {
    expect(nomFichierIcs('… ??? …', jour)).toBe('revoir-2026-03-14.ics')
  })
})
