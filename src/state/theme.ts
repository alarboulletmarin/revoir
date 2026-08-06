// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le thème : clair, sombre, ou celui du système.
 *
 * Trois valeurs sont **choisies**, deux sont **rendues** : « système » n'est
 * pas une apparence, c'est une délégation. Le CSS ne connaît donc que les deux
 * apparences — `[data-theme='sombre']` — et c'est ici qu'on résout la
 * troisième, en écoutant `prefers-color-scheme`. Une feuille de style qui
 * devrait, elle, gérer les trois écrirait deux fois la même palette.
 *
 * Comme la langue, l'apparence résolue vit dans un module : `lib/couleurs.ts`
 * en a besoin pour dériver l'encre d'une couleur libre — un rose pâle s'écrit
 * en rose foncé sur le papier crème et en rose clair sur le papier de nuit —,
 * et ce n'est pas un composant.
 */

/** Ce que l'utilisateur choisit. */
export type Theme = 'systeme' | 'clair' | 'sombre'

/** Ce que l'écran rend. */
export type ThemeResolu = 'clair' | 'sombre'

/** Dans l'ordre où le sélecteur des réglages les propose. */
export const THEMES: Theme[] = ['systeme', 'clair', 'sombre']

export function estTheme(valeur: unknown): valeur is Theme {
  return valeur === 'systeme' || valeur === 'clair' || valeur === 'sombre'
}

/**
 * Le fond de page de chaque apparence. Ces deux valeurs **doublent**
 * `--papier` dans `tokens.css` : les couleurs libres sont ajustées en
 * JavaScript, qui ne lit pas les variables CSS. Si l'une bouge là-bas, elle
 * bouge ici.
 */
export const FOND: Record<ThemeResolu, `#${string}`> = {
  clair: '#faf9f6',
  sombre: '#1a1917',
}

/** La requête média qui porte le choix du système. */
export const REQUETE_SOMBRE = '(prefers-color-scheme: dark)'

let resolu: ThemeResolu = 'clair'

export function themeResolu(): ThemeResolu {
  return resolu
}

/** Le fond sur lequel se mesurent les contrastes, ici et maintenant. */
export function fondCourant(): `#${string}` {
  return FOND[resolu]
}

/** Idempotent, comme `definirLangueActive` : appelé à chaque rendu. */
export function definirThemeResolu(theme: ThemeResolu): void {
  resolu = theme
}

/** Ce que le système demande, ou « clair » à défaut de savoir. */
export function themeDuSysteme(): ThemeResolu {
  if (typeof window === 'undefined' || !window.matchMedia) return 'clair'
  return window.matchMedia(REQUETE_SOMBRE).matches ? 'sombre' : 'clair'
}

/** La clé de stockage, partagée avec le script d'amorçage d'`index.html`. */
export const CLE_THEME = 'revoir.theme'
export const CLE_LANGUE = 'revoir.langue'

/**
 * Pose l'apparence sur le document.
 *
 * Trois écritures, et elles ne sont pas décoratives : `data-theme` sélectionne
 * la palette, `color-scheme` fait suivre les surfaces que le navigateur peint
 * lui-même — barres de défilement, sélecteur de date, champ de couleur —, et
 * `theme-color` la barre système d'une application installée, qui resterait
 * crème au-dessus d'un écran de nuit.
 */
export function appliquerTheme(theme: ThemeResolu): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', FOND[theme])
}
