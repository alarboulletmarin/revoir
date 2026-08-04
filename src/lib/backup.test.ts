import { describe, expect, it } from 'vitest'
import type { Item } from '../types'
import { buildReviews } from './schedules'
import { BackupError, backupFileName, parseBackup, serializeBackup } from './backup'

const ITEM: Item = {
  id: 'a1',
  title: 'Hooks React',
  category: 'Développement',
  startDate: '2026-03-01',
  schedule: 'simple',
  reviews: buildReviews('2026-03-01', 'simple').map((review, index) =>
    index === 0 ? { ...review, done: true, doneAt: '2026-03-02T09:00:00.000Z' } : review,
  ),
  archived: false,
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-02T09:00:00.000Z',
}

describe('aller-retour export / import', () => {
  it('restitue les éléments à l’identique', () => {
    expect(parseBackup(serializeBackup([ITEM]))).toEqual([ITEM])
  })

  it('accepte une sauvegarde vide', () => {
    expect(parseBackup(serializeBackup([]))).toEqual([])
  })

  it('nomme le fichier avec la date du jour', () => {
    expect(backupFileName(new Date(2026, 2, 14))).toBe('revoir-2026-03-14.json')
  })
})

describe('validation du fichier importé', () => {
  const rejects = (raw: string, fragment: string) => {
    expect(() => parseBackup(raw)).toThrow(BackupError)
    expect(() => parseBackup(raw)).toThrow(new RegExp(fragment, 'i'))
  }

  it('refuse un JSON malforme', () => {
    rejects('{ pas du json', 'json valide')
  })

  it('refuse une valeur qui n’est pas un objet', () => {
    rejects('[]', 'sauvegarde revoir')
    rejects('"revoir"', 'sauvegarde revoir')
  })

  it('refuse un fichier venant d’une autre application', () => {
    rejects(JSON.stringify({ app: 'autre', items: [] }), 'ne provient pas')
  })

  it('refuse une sauvegarde sans liste d’éléments', () => {
    rejects(JSON.stringify({ app: 'revoir', version: 1 }), 'aucune liste')
  })

  it('refuse un élément sans titre ou sans identifiant', () => {
    rejects(
      JSON.stringify({ app: 'revoir', items: [{ ...ITEM, title: '   ' }] }),
      'titre manquant',
    )
    rejects(
      JSON.stringify({ app: 'revoir', items: [{ ...ITEM, id: '' }] }),
      'identifiant manquant',
    )
  })

  it('refuse une date de départ mal formée', () => {
    rejects(
      JSON.stringify({ app: 'revoir', items: [{ ...ITEM, startDate: '01/03/2026' }] }),
      'date de départ invalide',
    )
  })

  it('refuse une configuration inconnue', () => {
    rejects(
      JSON.stringify({ app: 'revoir', items: [{ ...ITEM, schedule: 'express' }] }),
      'configuration inconnue',
    )
  })

  it('refuse une révision mal formée', () => {
    rejects(
      JSON.stringify({
        app: 'revoir',
        items: [{ ...ITEM, reviews: [{ offset: 1, date: 'bientot' }] }],
      }),
      'date de révision invalide',
    )
    rejects(
      JSON.stringify({ app: 'revoir', items: [{ ...ITEM, reviews: 'aucune' }] }),
      'liste de révisions manquante',
    )
  })

  it('refuse deux éléments portant le même identifiant', () => {
    rejects(
      JSON.stringify({ app: 'revoir', items: [ITEM, { ...ITEM, title: 'Doublon' }] }),
      'double',
    )
  })
})

describe('normalisation', () => {
  it('complete les champs optionnels absents', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      items: [
        {
          id: 'b2',
          title: '  Chapitre 5  ',
          startDate: '2026-04-01',
          schedule: 'pousse',
          reviews: [{ offset: 1, date: '2026-04-02' }],
        },
      ],
    })
    const [item] = parseBackup(raw)

    expect(item.title).toBe('Chapitre 5')
    expect(item.category).toBe('')
    expect(item.archived).toBe(false)
    expect(item.reviews[0]).toEqual({
      offset: 1,
      date: '2026-04-02',
      done: false,
      doneAt: null,
    })
    expect(item.createdAt).not.toBe('')
    expect(Number.isNaN(new Date(item.updatedAt).getTime())).toBe(false)
  })
})
