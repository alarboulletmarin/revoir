import { describe, expect, it } from 'vitest'
import type { Category, Programme, Review, Topic } from '../types'
import { compteur } from './ids'
import { buildReviews } from './schedules'
import {
  BackupError,
  backupFileName,
  parseBackup,
  serializeBackup,
  type ContenuSauvegarde,
} from './backup'

const CATEGORIE: Category = {
  id: 'c1',
  name: 'Développement',
  tint: 'bleu',
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-01T09:00:00.000Z',
}

const TOPIC: Topic = {
  id: 'a1',
  categoryId: 'c1',
  title: 'Hooks React',
  startDate: '2026-03-01',
  scheduleId: 'simple',
  practiceStatus: 'in_progress',
  status: 'active',
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-02T09:00:00.000Z',
}

const REVIEWS: Review[] = buildReviews(
  'a1',
  '2026-03-01',
  'simple',
  [],
  compteur('r'),
).map((review, index) =>
  index === 0 ? { ...review, completedAt: '2026-03-02T09:00:00.000Z' } : review,
)

const CONTENU: ContenuSauvegarde = {
  categories: [CATEGORIE],
  topics: [TOPIC],
  reviews: REVIEWS,
  programmes: [],
}

const VIDE: ContenuSauvegarde = {
  categories: [],
  topics: [],
  reviews: [],
  programmes: [],
}

/** Une sauvegarde d'avant la v4, telle que l'application l'écrivait. */
const ITEM_V3 = {
  id: 'a1',
  title: 'Hooks React',
  category: 'Développement',
  startDate: '2026-03-01',
  schedule: 'simple',
  reviews: [
    { offset: 1, date: '2026-03-02', done: true, doneAt: '2026-03-02T09:00:00.000Z' },
    { offset: 3, date: '2026-03-04', done: false, doneAt: null },
  ],
  archived: false,
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-02T09:00:00.000Z',
}

describe('aller-retour export / import', () => {
  it('restitue les trois collections à l’identique', () => {
    expect(parseBackup(serializeBackup(CONTENU))).toEqual(CONTENU)
  })

  it('accepte une sauvegarde vide', () => {
    expect(parseBackup(serializeBackup(VIDE))).toEqual(VIDE)
  })

  it('conserve le statut de pratique', () => {
    expect(parseBackup(serializeBackup(CONTENU)).topics[0].practiceStatus).toBe(
      'in_progress',
    )
  })

  it('conserve un sujet sans catégorie', () => {
    const sansCategorie: ContenuSauvegarde = {
      ...VIDE,
      topics: [{ ...TOPIC, categoryId: null }],
    }
    expect(parseBackup(serializeBackup(sansCategorie)).topics[0].categoryId).toBeNull()
  })

  it('nomme le fichier avec la date du jour', () => {
    expect(backupFileName(new Date(2026, 2, 14))).toBe('revoir-2026-03-14.json')
  })
})

describe('teintes de catégorie', () => {
  it('font l’aller-retour sur la catégorie', () => {
    expect(parseBackup(serializeBackup(CONTENU)).categories[0].tint).toBe('bleu')
  })

  it('garde une couleur libre telle quelle', () => {
    const contenu = { ...CONTENU, categories: [{ ...CATEGORIE, tint: '#8a5048' as const }] }
    expect(parseBackup(serializeBackup(contenu)).categories[0].tint).toBe('#8a5048')
  })

  it('descend une couleur qui serait invisible', () => {
    // Un fichier écrit à la main pourrait faire entrer un blanc : la pastille
    // disparaîtrait dans le papier.
    const raw = JSON.stringify({
      app: 'revoir',
      topics: [],
      categories: [{ ...CATEGORIE, tint: '#ffffff' }],
    })
    expect(parseBackup(raw).categories[0].tint).not.toBe('#ffffff')
  })

  it('ignore une teinte inconnue sans faire échouer l’import', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      topics: [],
      categories: [{ ...CATEGORIE, tint: 'fuchsia' }],
    })
    expect(parseBackup(raw).categories[0].tint).toBeNull()
  })
})

describe('validation du fichier importé', () => {
  const rejects = (raw: string, fragment: string) => {
    expect(() => parseBackup(raw)).toThrow(BackupError)
    expect(() => parseBackup(raw)).toThrow(new RegExp(fragment, 'i'))
  }

  it('refuse un JSON malformé', () => {
    rejects('{ pas du json', 'json valide')
  })

  it('refuse une valeur qui n’est pas un objet', () => {
    rejects('[]', 'sauvegarde revoir')
    rejects('"revoir"', 'sauvegarde revoir')
  })

  it('refuse un fichier venant d’une autre application', () => {
    rejects(JSON.stringify({ app: 'autre', topics: [] }), 'ne provient pas')
  })

  it('refuse une sauvegarde sans liste de sujets', () => {
    rejects(JSON.stringify({ app: 'revoir', version: 4 }), 'aucune liste')
  })

  it('refuse un sujet sans titre ou sans identifiant', () => {
    rejects(
      JSON.stringify({ app: 'revoir', topics: [{ ...TOPIC, categoryId: null, title: '  ' }] }),
      'titre manquant',
    )
    rejects(
      JSON.stringify({ app: 'revoir', topics: [{ ...TOPIC, categoryId: null, id: '' }] }),
      'identifiant manquant',
    )
  })

  it('refuse une date de départ mal formée', () => {
    rejects(
      JSON.stringify({
        app: 'revoir',
        topics: [{ ...TOPIC, categoryId: null, startDate: '01/03/2026' }],
      }),
      'date de départ invalide',
    )
  })

  it('refuse une configuration inconnue', () => {
    rejects(
      JSON.stringify({
        app: 'revoir',
        topics: [{ ...TOPIC, categoryId: null, scheduleId: 'express' }],
      }),
      'configuration inconnue',
    )
  })

  it('refuse deux sujets portant le même identifiant', () => {
    rejects(
      JSON.stringify({
        app: 'revoir',
        categories: [CATEGORIE],
        topics: [TOPIC, { ...TOPIC, title: 'Doublon' }],
      }),
      'double',
    )
  })
})

describe('intégrité référentielle', () => {
  it('refuse un sujet qui désigne une catégorie absente du fichier', () => {
    // Ce que le modèle plat n'avait pas à défendre : taire la référence
    // produirait un import silencieusement incomplet.
    const raw = JSON.stringify({ app: 'revoir', categories: [], topics: [TOPIC] })
    expect(() => parseBackup(raw)).toThrow(/catégorie inconnue/i)
  })

  it('refuse une révision qui désigne un sujet absent du fichier', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      categories: [CATEGORIE],
      topics: [TOPIC],
      reviews: [{ ...REVIEWS[0], topicId: 'disparu' }],
    })
    expect(() => parseBackup(raw)).toThrow(/sujet inconnu/i)
  })

  it('refuse une révision au rang absurde', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      categories: [CATEGORIE],
      topics: [TOPIC],
      reviews: [{ ...REVIEWS[0], position: 0 }],
    })
    expect(() => parseBackup(raw)).toThrow(/rang invalide/i)
  })

  it('refuse deux révisions portant le même identifiant', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      categories: [CATEGORIE],
      topics: [TOPIC],
      reviews: [REVIEWS[0], { ...REVIEWS[1], id: REVIEWS[0].id }],
    })
    expect(() => parseBackup(raw)).toThrow(/double/i)
  })
})

describe('normalisation', () => {
  it('complète les champs optionnels absents', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      topics: [
        {
          id: 'b2',
          title: '  Chapitre 5  ',
          startDate: '2026-04-01',
          scheduleId: 'pousse',
        },
      ],
    })
    const [topic] = parseBackup(raw).topics

    expect(topic.title).toBe('Chapitre 5')
    expect(topic.categoryId).toBeNull()
    expect(topic.status).toBe('active')
    expect(topic.practiceStatus).toBe('todo')
    expect(Number.isNaN(new Date(topic.updatedAt).getTime())).toBe(false)
  })

  it('ramène un statut de pratique inconnu à « à faire »', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      topics: [{ ...TOPIC, categoryId: null, practiceStatus: 'presque' }],
    })
    expect(parseBackup(raw).topics[0].practiceStatus).toBe('todo')
  })
})

describe('sauvegardes d’avant la v4', () => {
  it('convertit un fichier v3 en catégories, sujets et révisions', () => {
    const v3 = JSON.stringify({
      app: 'revoir',
      version: 3,
      exporteLe: '2026-03-14T10:00:00.000Z',
      items: [ITEM_V3],
      teintes: { développement: 'bleu' },
      programmes: [],
    })
    const contenu = parseBackup(v3)

    expect(contenu.categories).toHaveLength(1)
    expect(contenu.categories[0]).toMatchObject({ name: 'Développement', tint: 'bleu' })
    expect(contenu.topics).toHaveLength(1)
    expect(contenu.topics[0]).toMatchObject({
      id: 'a1',
      title: 'Hooks React',
      categoryId: contenu.categories[0].id,
      practiceStatus: 'todo',
      status: 'active',
    })
    expect(contenu.reviews).toHaveLength(2)
    expect(contenu.reviews[0]).toMatchObject({
      topicId: 'a1',
      position: 1,
      intervalInDays: 1,
      dueDate: '2026-03-02',
      completedAt: '2026-03-02T09:00:00.000Z',
    })
    expect(contenu.reviews[1].completedAt).toBeNull()
  })

  it('importe un fichier v1, sans teintes ni programmes', () => {
    const v1 = JSON.stringify({ app: 'revoir', version: 1, items: [ITEM_V3] })
    const contenu = parseBackup(v1)

    expect(contenu.categories[0].tint).toBeNull()
    expect(contenu.programmes).toEqual([])
    expect(contenu.topics).toHaveLength(1)
  })

  it('normalise la casse des noms de matière pour retrouver leur teinte', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      items: [ITEM_V3],
      teintes: { Développement: 'olive' },
    })
    expect(parseBackup(raw).categories[0].tint).toBe('olive')
  })

  it('laisse sans catégorie un élément dont la matière était vide', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      items: [{ ...ITEM_V3, category: '  ' }],
    })
    const contenu = parseBackup(raw)
    expect(contenu.categories).toEqual([])
    expect(contenu.topics[0].categoryId).toBeNull()
  })

  it('valide encore les anciens champs avant de convertir', () => {
    expect(() =>
      parseBackup(
        JSON.stringify({ app: 'revoir', items: [{ ...ITEM_V3, reviews: 'aucune' }] }),
      ),
    ).toThrow(/liste de révisions manquante/i)
    expect(() =>
      parseBackup(
        JSON.stringify({
          app: 'revoir',
          items: [{ ...ITEM_V3, reviews: [{ offset: 1, date: 'bientot' }] }],
        }),
      ),
    ).toThrow(/date de révision invalide/i)
    expect(() =>
      parseBackup(
        JSON.stringify({ app: 'revoir', items: [ITEM_V3, { ...ITEM_V3, title: 'Bis' }] }),
      ),
    ).toThrow(/double/i)
  })
})

describe('programmes personnalisés', () => {
  const PROGRAMME: Programme = {
    id: 'p-1',
    label: 'Examen blanc',
    offsets: [2, 5, 9, 20],
    createdAt: '2026-08-05T10:00:00.000Z',
  }

  const CONTENU_PERSO: ContenuSauvegarde = {
    categories: [],
    topics: [{ ...TOPIC, categoryId: null, scheduleId: 'p-1' }],
    reviews: [],
    programmes: [PROGRAMME],
  }

  it('font l’aller-retour avec les sujets qui s’en servent', () => {
    const contenu = parseBackup(serializeBackup(CONTENU_PERSO))
    expect(contenu.programmes).toEqual([PROGRAMME])
    expect(contenu.topics[0].scheduleId).toBe('p-1')
  })

  it('valent liste vide dans une sauvegarde v1 ou v2', () => {
    const v2 = JSON.stringify({ app: 'revoir', version: 2, items: [ITEM_V3], teintes: {} })
    expect(parseBackup(v2).programmes).toEqual([])
  })

  it('refuse un sujet dont le programme n’est pas dans le fichier', () => {
    // Le garde-fou qui compte : sans son programme, un sujet importé n'aurait
    // plus de rythme à nommer.
    const raw = JSON.stringify({
      app: 'revoir',
      topics: CONTENU_PERSO.topics,
      programmes: [],
    })
    expect(() => parseBackup(raw)).toThrow(BackupError)
  })

  it('nettoie un rythme mal formé plutôt que de le prendre tel quel', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      topics: [],
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
      topics: [],
      programmes: [{ id: 'p-3', label: '  ', offsets: [1] }],
    })
    expect(() => parseBackup(sansNom)).toThrow(BackupError)

    const sansRythme = JSON.stringify({
      app: 'revoir',
      topics: [],
      programmes: [{ id: 'p-4', label: 'Vide', offsets: [0, -3] }],
    })
    expect(() => parseBackup(sansRythme)).toThrow(BackupError)
  })

  it('refuse deux programmes de même identifiant', () => {
    const raw = JSON.stringify({
      app: 'revoir',
      topics: [],
      programmes: [PROGRAMME, { ...PROGRAMME, label: 'Autre' }],
    })
    expect(() => parseBackup(raw)).toThrow(BackupError)
  })
})
