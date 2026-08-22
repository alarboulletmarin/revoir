// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le brouillon d'un sujet en cours de création — section 8.22 du design system.
 *
 * La création se fait en trois pages, une question par écran, et **rien n'est
 * écrit en base avant la dernière**. Ce qui a été répondu doit donc vivre
 * quelque part entre les trois : c'est ce brouillon.
 *
 * Il vit dans le `sessionStorage` et non dans la mémoire d'un contexte React,
 * pour une raison qui ne se devine pas : ces pages ont des adresses, et une
 * adresse se recharge. Un onglet rafraîchi au milieu de l'étape 2 perdrait le
 * titre saisi à l'étape 1, sans que rien ne l'annonce. Le `sessionStorage`
 * meurt avec l'onglet — ce qui est exactement la durée de vie d'un brouillon,
 * et la raison pour laquelle ce n'est pas `localStorage` : un sujet abandonné
 * il y a trois semaines n'a pas à ressurgir dans un formulaire vide.
 *
 * Ce module ne fait que lire, valider et écrire. Le stockage est une **donnée
 * extérieure** : modifiable à la main, écrite par une version antérieure de
 * l'application, éventuellement illisible. On le relit comme une sauvegarde,
 * jamais sur parole.
 */
import type { ScheduleId } from '../types'
import { DEFAULT_SCHEDULE } from './schedules'
import { todayKey, type DateKey } from './dates'

export const CLE_BROUILLON = 'revoir.brouillon-sujet'

export interface BrouillonSujet {
  titre: string
  categoryId: string | null
  scheduleId: ScheduleId
  depart: DateKey
}

/** Un brouillon neuf : rien de saisi, le programme par défaut, départ au jour. */
export function brouillonVide(aujourdhui: DateKey = todayKey()): BrouillonSujet {
  return {
    titre: '',
    categoryId: null,
    scheduleId: DEFAULT_SCHEDULE,
    depart: aujourdhui,
  }
}

/**
 * Le format d'une date-clé, vérifié à la relecture.
 *
 * Une chaîne quelconque passerait sans ça jusqu'à `fromKey`, qui rendrait une
 * date invalide, et l'aperçu des échéances afficherait « Invalid Date » sans
 * que personne ne sache d'où ça vient.
 */
const EST_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Un brouillon relu, champ par champ. Ce qui manque ou détonne reprend sa
 * valeur par défaut : un brouillon à moitié valide vaut mieux qu'un formulaire
 * vide, tant que chaque champ retenu est du bon type.
 */
export function lireBrouillon(
  valeur: unknown,
  aujourdhui: DateKey = todayKey(),
): BrouillonSujet {
  const defaut = brouillonVide(aujourdhui)
  if (typeof valeur !== 'object' || valeur === null) return defaut

  const { titre, categoryId, scheduleId, depart } = valeur as Record<string, unknown>

  return {
    titre: typeof titre === 'string' ? titre : defaut.titre,
    categoryId: typeof categoryId === 'string' ? categoryId : null,
    scheduleId:
      typeof scheduleId === 'string' && scheduleId !== ''
        ? scheduleId
        : defaut.scheduleId,
    depart:
      typeof depart === 'string' && EST_DATE.test(depart) ? depart : defaut.depart,
  }
}

/**
 * Un titre est-il utilisable ? C'est la seule règle de validité de la création :
 * la catégorie est facultative, le programme a un défaut, la date aussi.
 */
export function titreValide(titre: string): boolean {
  return titre.trim() !== ''
}
