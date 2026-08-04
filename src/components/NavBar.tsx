import { NavLink } from 'react-router-dom'
import { IconCalendar, IconSettings, IconToday } from './Icons'

const LINKS = [
  { to: '/', label: 'Aujourd’hui', Icon: IconToday },
  { to: '/calendrier', label: 'Calendrier', Icon: IconCalendar },
  { to: '/reglages', label: 'Réglages', Icon: IconSettings },
]

export function NavBar() {
  return (
    <nav className="nav" aria-label="Navigation principale">
      <ul className="nav__list">
        {LINKS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                isActive ? 'nav__link nav__link--active' : 'nav__link'
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
