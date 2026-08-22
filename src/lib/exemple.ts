// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le jeu d'exemple — section 8.24 du design system.
 *
 * Un tableau de bord vide ne montre rien de ce que l'application sait faire :
 * pas de règle peuplée, pas de retard, pas de recalage, pas de tableau de
 * suivi lisible. Créer quatre sujets à la main pour voir à quoi ça ressemble
 * est un prix que personne ne paie avant d'avoir décidé.
 *
 * Ce n'est **pas** une démonstration à part, dans un mode à part : ce sont des
 * sujets ordinaires, écrits dans la base ordinaire, qui se cochent, se
 * modifient et se suppriment comme les autres. La seule chose qui les
 * distingue est un drapeau d'appareil, qui permet de tout retirer d'un geste.
 *
 * Ce module ne construit que des objets. L'écriture vit dans le contexte de
 * données, comme pour toute création.
 */
import type { Category, Review, Topic } from '../types'
import { addDaysToKey, todayKey, type DateKey } from './dates'
import { buildReviews } from './schedules'
import { newId, type NouvelId } from './ids'
import { teinteProposee } from './categories'
import { textes } from '../i18n'

/**
 * Quatre sujets, et pas un de plus.
 *
 * Ils sont choisis pour couvrir les quatre états qu'on ne peut pas voir sur un
 * écran vide, un par sujet : une révision en retard, une révision du jour, un
 * programme bien entamé, un sujet qui vient de commencer. Quatre domaines
 * différents aussi — l'application n'est pas un outil scolaire.
 *
 * `depart` est un décalage en jours par rapport à aujourd'hui : c'est ce qui
 * place les échéances aux bons endroits quel que soit le jour où l'on charge
 * le jeu. `faites` est le nombre de révisions déjà cochées, dans l'ordre du
 * programme.
 */
const SUJETS = [
  { cle: 'derivees', categorie: 'etudes', programme: 'simple', depart: -31, faites: 3 },
  { cle: 'accords', categorie: 'personnel', programme: 'simple', depart: -7, faites: 2 },
  { cle: 'vocabulaire', categorie: 'langues', programme: 'pousse', depart: -14, faites: 3 },
  { cle: 'priorite', categorie: 'developpement', programme: 'simple', depart: -1, faites: 1 },
] as const

export interface JeuExemple {
  topics: Topic[]
  reviews: Review[]
}

/**
 * Le jeu d'exemple, construit sur les catégories qui existent déjà.
 *
 * Il n'en crée aucune : les six livrées sont là depuis la première ouverture,
 * et en ajouter quatre autres ferait payer l'exemple bien après l'avoir
 * effacé. Un sujet dont la catégorie a été supprimée part sans catégorie —
 * état parfaitement normal du modèle.
 *
 * @param categories les catégories existantes, pour y rattacher les sujets.
 * @param aujourdhui injectable : rien ici ne lit l'horloge en dehors du défaut.
 */
export function construireJeuExemple(
  categories: Category[],
  aujourdhui: DateKey = todayKey(),
  maintenant: string = new Date().toISOString(),
  nouvelId: NouvelId = newId,
): JeuExemple {
  const t = textes()
  const topics: Topic[] = []
  const reviews: Review[] = []

  for (const modele of SUJETS) {
    /*
     * On retrouve la catégorie par sa teinte, pas par son nom.
     *
     * Le nom d'une catégorie livrée suit la langue du jour où elle a été
     * créée, et il a pu être renommé depuis : chercher « Études » dans une
     * base semée en anglais ne trouve rien, et les quatre sujets d'exemple
     * arriveraient tous sans catégorie. La teinte, elle, est fixe. Le nom
     * reste en repli, pour une base où deux catégories partageraient une
     * teinte — ce qu'une couleur libre permet.
     */
    const teinte = teinteProposee(modele.categorie)
    const nomCategorie = t.categoriesProposees[modele.categorie]
    const categorie =
      categories.find((candidate) => candidate.tint === teinte) ??
      categories.find((candidate) => candidate.name === nomCategorie)
    const startDate = addDaysToKey(aujourdhui, modele.depart)
    const id = nouvelId()

    topics.push({
      id,
      categoryId: categorie?.id ?? null,
      title: t.exemple.sujets[modele.cle],
      startDate,
      scheduleId: modele.programme,
      practiceStatus: 'in_progress',
      status: 'active',
      createdAt: maintenant,
      updatedAt: maintenant,
    })

    /*
     * Les premières révisions sont cochées à leur date d'échéance et non à
     * aujourd'hui : un jeu d'exemple où tout aurait été validé le même jour
     * dessinerait une frise que le produit ne produit jamais.
     */
    const revisions = buildReviews(id, startDate, modele.programme, [], nouvelId)
    revisions.forEach((review, rang) => {
      reviews.push(
        rang < modele.faites
          ? { ...review, completedAt: `${review.dueDate}T09:00:00.000Z` }
          : review,
      )
    })
  }

  return { topics, reviews }
}

/**
 * Ce que le drapeau d'appareil retient d'un jeu chargé : les identifiants des
 * sujets créés.
 *
 * Les identifiants et non les titres. Un sujet d'exemple est un sujet
 * ordinaire : il se renomme, et « Tout effacer » doit retrouver celui qu'on a
 * rebaptisé — comme il doit ne pas emporter un sujet à soi qui porterait par
 * hasard le même nom.
 */
export function estListeIdentifiants(valeur: unknown): valeur is string[] {
  return (
    Array.isArray(valeur) && valeur.every((element) => typeof element === 'string')
  )
}
