// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Une rangée qui mène ailleurs — section 8.26 du design system.
 *
 * C'est ce qui remplace les cartes empilées des réglages. Une carte annonce
 * un contenu ; une rangée annonce une destination, et c'est ce qu'on vient
 * chercher sur un écran de réglages — un réglage précis, pas un tour du
 * propriétaire.
 *
 * Le compte à droite n'est pas décoratif : il dit s'il y a lieu d'y aller.
 * « Sujets archivés · aucun » évite une visite pour rien.
 */
import { Link } from 'react-router-dom'
import { IconeChevron } from './Icons'

interface RangeeNavigationProps {
  vers: string
  libelle: string
  /** Ce qu'on y trouvera : un compte, un résumé. Jamais une action. */
  valeur?: string
}

export function RangeeNavigation({ vers, libelle, valeur }: RangeeNavigationProps) {
  return (
    <li className="rangee-nav">
      <Link to={vers} className="rangee-nav__lien">
        <span className="rangee-nav__libelle">{libelle}</span>
        {valeur !== undefined && (
          <span className="rangee-nav__valeur chiffres">{valeur}</span>
        )}
        <IconeChevron
          direction="droite"
          className="rangee-nav__chevron"
          width="18"
          height="18"
        />
      </Link>
    </li>
  )
}
