// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le signe de l'application : la frise réduite à un logotype.
 *
 * Ce n'est pas une dixième icône (section 11) — c'est l'identité de l'app,
 * la même forme que celle installée sur l'écran d'accueil, et elle n'a donc
 * pas sa place dans Icons.tsx.
 *
 * Ce n'est pas non plus une frise porteuse de données (section 2) : aucune
 * date ne s'y lit, les graduations sont figées sur le programme Simple. La
 * signature reste réservée aux trois écrans qui la font parler.
 *
 * Le carré plein `--accent` de l'icône ne la suit pas dans l'en-tête : ce
 * serait une seconde surface pleine `--accent` sur un écran qui en compte
 * déjà une (section 3). Le signe se pose à même le papier, comme la règle
 * graduée dont il vient.
 *
 * Géométrie identique à `public/favicon.svg` et à `scripts/generate-icons.mjs` :
 * l'écart des graduations suit √jours pour J+1, J+3, J+7, J+14, J+30.
 */
import type { SVGProps } from 'react'

/** Abscisses des six graduations, dans le repère de la vue (44 de large). */
const GRADUATIONS = [0, 4, 9.6, 17.6, 28.1, 42.4]

export function Marque(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 44 12"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Le rail ne fait que relier les graduations (section 2). */}
      <rect x="0" y="5.4" width="44" height="1.2" />
      {GRADUATIONS.map((x) => (
        <rect key={x} x={x} y="0" width="1.6" height="12" />
      ))}
    </svg>
  )
}
