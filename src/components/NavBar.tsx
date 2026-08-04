import { NavLink } from 'react-router-dom'

/**
 * Navigation en toutes lettres. Les six icônes autorisées (section 11) ne
 * couvrent ni « aujourd'hui » ni « réglages » : plutôt que d'en inventer
 * deux de plus, on écrit les mots.
 */
const LIENS = [
  { vers: '/', libelle: "Aujourd'hui" },
  { vers: '/calendrier', libelle: 'Calendrier' },
  { vers: '/reglages', libelle: 'Réglages' },
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
