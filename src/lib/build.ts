// SPDX-License-Identifier: AGPL-3.0-only

/**
 * D'où vient ce build, et où en trouver la source.
 *
 * Revoir est sous AGPL-3.0. L'article 13 demande que les personnes qui
 * accèdent au logiciel par le réseau puissent obtenir la « Corresponding
 * Source » — les sources telles qu'elles ont produit le code servi, pas une
 * version approchante. Or ce qui est servi est un bundle minifié : un lien
 * vers la branche par défaut ne suffit pas, puisqu'elle a bougé depuis. D'où
 * le commit épinglé.
 *
 * `__APP_VERSION__` et `__APP_COMMIT__` sont injectés par `define` dans
 * `vite.config.ts` et déclarés dans `src/build-info.d.ts`.
 */

/** Le dépôt : seule adresse extérieure de toute l'application. */
export const DEPOT = 'https://github.com/alarboulletmarin/revoir'

/** La version publiée, telle que déclarée dans `package.json`. */
export const VERSION = __APP_VERSION__

/** Le commit court du build. Vide si le build n'a pas eu accès au dépôt git. */
export const COMMIT = __APP_COMMIT__

/**
 * L'adresse de la source correspondant à ce build précis.
 *
 * Sans commit connu — build depuis une archive —, on retombe sur le dépôt :
 * un lien approximatif vaut mieux qu'un lien mort vers `/tree/`.
 */
export const SOURCE = COMMIT ? `${DEPOT}/tree/${COMMIT}` : DEPOT

/**
 * Ce qu'on affiche à côté du lien : « 1.0.0 · a1b2c3d », ou la seule version
 * quand le commit est inconnu.
 */
export const REFERENCE = COMMIT ? `${VERSION} · ${COMMIT}` : VERSION
