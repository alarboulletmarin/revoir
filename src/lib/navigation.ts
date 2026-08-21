// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Ce qu'un écran de création reçoit de celui qui l'a ouvert — section 8.26.
 *
 * Créer une catégorie ou composer un rythme au milieu de la création d'un
 * sujet ne doit pas interrompre cette création. L'écran ouvert reçoit donc
 * deux choses par l'état d'historique : où revenir, et sous quel nom rendre ce
 * qu'il vient de créer.
 *
 * **L'état d'historique est une donnée extérieure.** Il survit au rechargement,
 * vit dans le `sessionStorage` du navigateur et s'écrit à la main. On le relit
 * comme on relit une sauvegarde, jamais sur parole — d'où ce module, et d'où
 * ses tests.
 */

/**
 * Un chemin de retour, s'il est interne à l'application.
 *
 * Une adresse absolue commençant par une seule barre, et rien d'autre :
 * `//exemple.com` et `https://exemple.com` sont des adresses valides pour un
 * routeur qui ne regarderait que le premier caractère, et feraient sortir
 * l'application d'elle-même après une création.
 */
export function cheminInterne(valeur: unknown): string | null {
  if (typeof valeur !== 'object' || valeur === null) return null
  const { retour } = valeur as { retour?: unknown }
  if (typeof retour !== 'string') return null
  // La racine seule est un retour valide ; `/` suivi d'une barre ou d'une
  // contre-barre ne l'est pas.
  return /^\/([^/\\]|$)/.test(retour) ? retour : null
}

/**
 * L'identifiant de ce qui vient d'être créé, rendu par l'écran de création.
 *
 * L'identifiant et non le nom : c'est ce que le brouillon retient, et deux
 * catégories peuvent porter des noms proches. Sans lui, il faudrait redésigner
 * dans une liste ce qu'on vient de nommer.
 */
export function identifiantCree(valeur: unknown, cle: string): string | null {
  if (typeof valeur !== 'object' || valeur === null) return null
  const trouve = (valeur as Record<string, unknown>)[cle]
  return typeof trouve === 'string' && trouve !== '' ? trouve : null
}
