import { describe, expect, it } from 'vitest'
import type { Item, Programme } from '../types'
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
    expect(parseBackup(serializeBackup([ITEM])).items).toEqual([ITEM])
  })

  it('accepte une sauvegarde vide', () => {
    expect(parseBackup(serializeBackup([])).items).toEqual([])
  })

  it('nomme le fichier avec la date du jour', () => {
    expect(backupFileName(new Date(2026, 2, 14))).toBe('revoir-2026-03-14.json')
  })
})

describe('teintes de matière', () => {
  it('fait l’aller-retour avec les éléments', () => {
    const teintes = { développement: 'bleu', langues: 'ocre' } as const
    expect(parseBackup(serializeBackup([ITEM], teintes)).teintes).toEqual(teintes)
  })

  it('importe une sauvegarde v1, qui n’a pas de teintes', () => {
    // Les anciens fichiers restent lisibles : les matières retomberont sur
    // leur teinte dérivée du nom.
    const v1 = JSON.stringify({ app: 'revoir', version: 1, items: [ITEM] })
    expect(parseBackup(v1).teintes).toEqual({})
    expect(parseBackup(v1).items).toHaveLength(1)
  })

  it('normalise la casse des noms de matière', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      items: [],
      teintes: { 'Développement': 'bleu' },
    })
    expect(parseBackup(raw).teintes).toEqual({ développement: 'bleu' })
  })

  it('ignore une teinte inconnue sans faire échouer l’import', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      items: [ITEM],
      teintes: { maths: 'fuchsia', langues: 'olive' },
    })
    const contenu = parseBackup(raw)
    expect(contenu.teintes).toEqual({ langues: 'olive' })
    expect(contenu.items).toHaveLength(1)
  })

  it('tolère un champ teintes qui n’est pas un objet', () => {
    const raw = JSON.stringify({ app: 'revoir', items: [], teintes: 'bleu' })
    expect(parseBackup(raw).teintes).toEqual({})
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
    const [item] = parseBackup(raw).items

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

describe('couleurs de matière personnalisées', () => {
  it('fait l’aller-retour comme les huit teintes nommées', () => {
    const teintes = { physique: '#8a5048', langues: 'ocre' } as const
    expect(parseBackup(serializeBackup([], teintes)).teintes).toEqual(teintes)
  })

  it('renormalise une couleur venue d’ailleurs', () => {
    // Un fichier écrit à la main pourrait faire entrer une couleur illisible :
    // elle est ramenée dans le registre, pas refusée.
    const raw = JSON.stringify({ app: 'revoir', items: [], teintes: { maths: '#ff0000' } })
    expect(parseBackup(raw).teintes.maths).toBe('#8a5048')
  })

  it('ignore une valeur qui n’est ni une teinte ni une couleur', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      items: [],
      teintes: { maths: '#abc', langues: 'olive' },
    })
    expect(parseBackup(raw).teintes).toEqual({ langues: 'olive' })
  })
})

describe('programmes personnalisés', () => {
  const PROGRAMME: Programme = {
    id: 'p-1',
    label: 'Examen blanc',
    offsets: [2, 5, 9, 20],
    createdAt: '2026-08-05T10:00:00.000Z',
  }

  const ITEM_PERSO: Item = { ...ITEM, id: 'b2', schedule: 'p-1' }

  it('fait l’aller-retour avec les éléments qui s’en servent', () => {
    const contenu = parseBackup(serializeBackup([ITEM_PERSO], {}, [PROGRAMME]))
    expect(contenu.programmes).toEqual([PROGRAMME])
    expect(contenu.items[0].schedule).toBe('p-1')
  })

  it('vaut liste vide dans une sauvegarde v1 ou v2', () => {
    const v2 = JSON.stringify({ app: 'revoir', version: 2, items: [ITEM], teintes: {} })
    expect(parseBackup(v2).programmes).toEqual([])
  })

  it('refuse un élément dont le programme n’est pas dans le fichier', () => {
    // Le garde-fou qui compte : sans son programme, un élément importé
    // n’aurait plus de rythme à nommer.
    const raw = JSON.stringify({ app: 'revoir', items: [ITEM_PERSO], programmes: [] })
    expect(() => parseBackup(raw)).toThrow(BackupError)
  })

  it('nettoie un rythme mal formé plutôt que de le prendre tel quel', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      items: [],
      programmes: [{ id: 'p-2', label: ' Révisions ', offsets: [9, 2, 2, 0, 99999, 5] }],
    })
    expect(parseBackup(raw).programmes[0]).toMatchObject({
      label: 'Révisions',
      offsets: [2, 5, 9],
    })
  })

  it('refuse un programme sans nom ou sans rythme exploitable', () => {
    const sansNom = JSON.stringify({
      app: 'revoir',
      items: [],
      programmes: [{ id: 'p-3', label: '  ', offsets: [1] }],
    })
    expect(() => parseBackup(sansNom)).toThrow(BackupError)

    const sansRythme = JSON.stringify({
      app: 'revoir',
      items: [],
      programmes: [{ id: 'p-4', label: 'Vide', offsets: [0, -3] }],
    })
    expect(() => parseBackup(sansRythme)).toThrow(BackupError)
  })

  it('refuse deux programmes de même identifiant', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      items: [],
      programmes: [PROGRAMME, { ...PROGRAMME, label: 'Autre' }],
    })
    expect(() => parseBackup(raw)).toThrow(BackupError)
  })
})
