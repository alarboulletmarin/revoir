// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les neuf icônes du projet, et pas une de plus (section 11) : plus,
 * calendrier, coche, chevron, archive, corbeille, réglages, jour, suivi. SVG
 * inline, aucune librairie — pour neuf symboles, une dépendance ne se
 * justifie pas.
 *
 * Les deux dernières sont arrivées avec la barre du bas, où les trois vues
 * portent leur signe au-dessus de leur mot. Elles ne remplacent aucun libellé :
 * le mot reste écrit sous chacune, et c'est lui qui dit ce que fait l'onglet.
 * Ce qui n'est toujours pas dans cette liste s'écrit en toutes lettres — la
 * fermeture d'une boîte de dialogue est un libellé, pas un pictogramme.
 */
import type { SVGProps } from 'react'

type IconeProps = SVGProps<SVGSVGElement>

function Icone({ children, ...props }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconePlus(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Icone>
  )
}

export function IconeCalendrier(props: IconeProps) {
  return (
    <Icone {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" />
    </Icone>
  )
}

export function IconeCoche(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M5 12.5 10 17.5 19 7" />
    </Icone>
  )
}

/** Un seul chevron, pivoté par le CSS selon `direction`. */
export function IconeChevron({
  direction = 'droite',
  className,
  ...props
}: IconeProps & { direction?: 'gauche' | 'droite' }) {
  return (
    <Icone
      className={[`icone-chevron--${direction}`, className].filter(Boolean).join(' ')}
      {...props}
    >
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Icone>
  )
}

export function IconeArchive(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M3.5 7.5h17V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" />
      <path d="M2.8 3.5h18.4v4H2.8zM9.5 12h5" />
    </Icone>
  )
}

/**
 * Des curseurs de réglage, pas un engrenage.
 *
 * L'engrenage est le signe générique de l'interface logicielle ; celui-ci est
 * un rail gradué que l'on fait coulisser — la forme même de la frise, qui est
 * la signature de l'app (section 2). Le registre reste celui de l'instrument
 * de mesure, jusque dans la barre d'en-tête.
 */
export function IconeReglages(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M3.5 8.5h9M17.5 8.5h3" />
      <circle cx="15" cy="8.5" r="2.4" />
      <path d="M3.5 15.5h3M11.5 15.5h9" />
      <circle cx="9" cy="15.5" r="2.4" />
    </Icone>
  )
}

/**
 * « Aujourd'hui » : le curseur sur la règle.
 *
 * La section 2 le nomme déjà — « un trait vertical, seul élément qui dépasse la
 * frise ». C'est donc le signe que l'application s'est donné pour dire
 * *maintenant*, et non un dessin inventé pour l'occasion. Deux graduations
 * l'encadrent, sans plus : ce n'est pas le logotype, qui en porte six et n'a
 * pas de curseur.
 *
 * Le rail est **sous** les graduations, et non au milieu d'elles : un rail
 * médian faisait du curseur une croix, et une croix à côté d'un bouton
 * flottant qui en est une n'est pas un signe, c'est une confusion.
 */
export function IconeJour(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M3.5 17h17" />
      <path d="M7.5 13v4M16.5 13v4" />
      <path d="M12 7.5v9.5" />
    </Icone>
  )
}

/**
 * « Suivi » : le tableau, avec sa colonne de sujets figée.
 *
 * Une grille et non un calendrier — d'où l'absence des deux attaches du haut,
 * qui sont ce qui distingue le signe du calendrier, et la présence d'un montant
 * vertical, qui est ce que le tableau a de propre : une première colonne qui
 * reste en place pendant que les étapes défilent (section 8.13).
 */
export function IconeSuivi(props: IconeProps) {
  return (
    <Icone {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10" />
    </Icone>
  )
}

export function IconeCorbeille(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M4.5 6.5h15M9.5 6.5V4.2a.7.7 0 0 1 .7-.7h3.6a.7.7 0 0 1 .7.7v2.3" />
      <path d="M6.5 6.5 7.4 20a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-13.5" />
      <path d="M10.5 10.5v6.5M13.5 10.5v6.5" />
    </Icone>
  )
}
