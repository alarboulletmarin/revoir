import { NavLink } from 'react-router-dom'

/**
 * Navigation en toutes lettres. Les sept icônes autorisées (section 11) ne
 * couvrent ni « aujourd'hui » ni « suivi » : plutôt que d'en inventer deux de
 * plus, on écrit les mots.
 *
 * Trois entrées, et trois seulement : les trois vues de l'application. À 320px
 * la barre en tient trois sans troncature et pas une de quatrième — « Réglages »
 * a rejoint la barre de marque, où il est mieux à sa place : ce n'est pas une
 * vue, c'est un réglage.
 */
const LIENS = [
  { vers: '/', libelle: "Aujourd'hui" },
  { vers: '/calendrier', libelle: 'Calendrier' },
  { vers: '/suivi', libelle: 'Suivi' },
]

export function NavBar() {
  return (
    <nav className="nav" aria-label="Navigation principale">
      <ul className="nav__liste">
        {LIENS.map(({ vers, libelle }) => (
          <li key={vers} className="nav__element">
            <NavLink
              to={vers}
              end={vers === '/'}
              className={({ isActive }) =>
                isActive ? 'nav__lien nav__lien--actif' : 'nav__lien'
              }
            >
              {libelle}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
