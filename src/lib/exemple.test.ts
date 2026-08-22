// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import type { Category } from '../types'
import { compteur } from './ids'
import { daysBetween } from './dates'
import { estFaite } from './sujets'
import { construireJeuExemple, estListeIdentifiants } from './exemple'
import { categoriesProposees } from './categories'

const AUJOURDHUI = '2026-03-15'
const MAINTENANT = '2026-03-15T08:00:00.000Z'

const categorie = (name: string, tint: Category['tint'] = null): Category => ({
  id: `cat-${name}`,
  name,
  tint,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
})

/** Les six catégories livrées, telles que l'application les crée. */
const livrees = (): Category[] =>
  categoriesProposees(MAINTENANT, compteur('cat'))

const jeu = (categories = livrees()) =>
  construireJeuExemple(categories, AUJOURDHUI, MAINTENANT, compteur('e'))

describe('construireJeuExemple', () => {
  it('crée quatre sujets actifs', () => {
    const { topics } = jeu()
    expect(topics).toHaveLength(4)
    expect(topics.every((topic) => topic.status === 'active')).toBe(true)
  })

  it('donne à chaque sujet ses révisions', () => {
    const { topics, reviews } = jeu()
    for (const topic of topics) {
      const siennes = reviews.filter((review) => review.topicId === topic.id)
      expect(siennes.length).toBeGreaterThan(0)
    }
    expect(reviews).toHaveLength(
      topics.reduce(
        (total, topic) =>
          total + reviews.filter((review) => review.topicId === topic.id).length,
        0,
      ),
    )
  })

  /*
   * La raison d'être du jeu : montrer ce qu'un écran vide ne montre pas. S'il
   * ne produisait ni retard, ni révision du jour, il n'apprendrait rien.
   */
  it('produit au moins une révision en retard', () => {
    const { reviews } = jeu()
    const retard = reviews.filter(
      (review) => !estFaite(review) && review.dueDate < AUJOURDHUI,
    )
    expect(retard.length).toBeGreaterThan(0)
  })

  it('produit des révisions déjà faites et des révisions à venir', () => {
    const { reviews } = jeu()
    expect(reviews.some(estFaite)).toBe(true)
    expect(reviews.some((review) => !estFaite(review) && review.dueDate > AUJOURDHUI)).toBe(
      true,
    )
  })

  /*
   * Une validation est datée du jour de son échéance, pas d'aujourd'hui : un
   * jeu où tout aurait été coché le même jour dessinerait une frise que le
   * produit ne produit jamais.
   */
  it('date chaque validation du jour de son échéance', () => {
    const { reviews } = jeu()
    for (const review of reviews.filter(estFaite)) {
      expect(review.completedAt?.slice(0, 10)).toBe(review.dueDate)
    }
  })

  it('rattache les sujets aux catégories livrées', () => {
    const { topics } = jeu()
    expect(topics.every((topic) => topic.categoryId !== null)).toBe(true)
  })

  /*
   * Les catégories peuvent avoir été renommées ou supprimées : le jeu n'en
   * crée aucune, et un sujet sans catégorie est un état normal du modèle.
   */
  it('accepte l’absence de catégories, sans en créer', () => {
    const { topics } = jeu([])
    expect(topics).toHaveLength(4)
    expect(topics.every((topic) => topic.categoryId === null)).toBe(true)
  })

  it('place les départs dans le passé, pour que le programme soit entamé', () => {
    const { topics } = jeu()
    for (const topic of topics) {
      expect(daysBetween(topic.startDate, AUJOURDHUI)).toBeGreaterThan(0)
    }
  })

  it('donne des identifiants distincts à tout ce qu’il crée', () => {
    const { topics, reviews } = jeu()
    const ids = [...topics.map((t) => t.id), ...reviews.map((r) => r.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ne dépend pas de l’horloge : deux appels au même jour donnent le même jeu', () => {
    expect(jeu()).toEqual(jeu())
  })
})

describe('estListeIdentifiants', () => {
  it('accepte une liste de chaînes, vide comprise', () => {
    expect(estListeIdentifiants([])).toBe(true)
    expect(estListeIdentifiants(['a', 'b'])).toBe(true)
  })

  it('refuse tout le reste', () => {
    for (const valeur of [null, undefined, 'a', 42, {}, ['a', 2], [null]]) {
      expect(estListeIdentifiants(valeur)).toBe(false)
    }
  })
})

describe('construireJeuExemple — retrouver les catégories', () => {
  /*
   * Le cas qui a motivé la recherche par teinte : la base a été semée dans une
   * langue, l'interface a changé de langue depuis. Chercher « Études » dans une
   * base semée en anglais ne trouve rien, et les quatre sujets arriveraient
   * tous sans catégorie.
   */
  it('retrouve une catégorie livrée renommée', () => {
    const renommees = livrees().map((cat) => ({ ...cat, name: `${cat.name} (2026)` }))
    const { topics } = construireJeuExemple(
      renommees,
      AUJOURDHUI,
      MAINTENANT,
      compteur('e'),
    )
    expect(topics.every((topic) => topic.categoryId !== null)).toBe(true)
  })

  /* Repli sur le nom quand la teinte a été changée à la main. */
  it('retrouve une catégorie dont la teinte a changé, par son nom', () => {
    const deteintes = livrees().map((cat) => ({ ...cat, tint: null }))
    const { topics } = construireJeuExemple(
      deteintes,
      AUJOURDHUI,
      MAINTENANT,
      compteur('e'),
    )
    expect(topics.every((topic) => topic.categoryId !== null)).toBe(true)
  })

  it('laisse un sujet sans catégorie quand la sienne a été supprimée', () => {
    const { topics } = construireJeuExemple(
      [categorie('Divers')],
      AUJOURDHUI,
      MAINTENANT,
      compteur('e'),
    )
    expect(topics.every((topic) => topic.categoryId === null)).toBe(true)
  })
})
