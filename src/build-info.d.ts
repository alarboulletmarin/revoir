// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Constantes injectées au build par `define` dans `vite.config.ts`.
 * Voir `src/lib/build.ts` pour l'accès typé et le repli.
 */

/** La version déclarée dans `package.json`. */
declare const __APP_VERSION__: string

/** Le commit court du build, ou une chaîne vide hors dépôt git. */
declare const __APP_COMMIT__: string
