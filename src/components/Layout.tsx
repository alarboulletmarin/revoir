import { Link, Outlet, useLocation } from 'react-router-dom'
import { NavBar } from './NavBar'
import { IconPlus } from './Icons'
import { UpdatePrompt } from './UpdatePrompt'
import { useItems } from '../state/useItems'

/** Le bouton « + » n'a pas de sens sur le formulaire de création lui-même. */
const HIDDEN_ON = ['/nouveau']

export function Layout() {
  const { error } = useItems()
  const { pathname } = useLocation()
  const showAdd = !HIDDEN_ON.includes(pathname) && !pathname.endsWith('/modifier')

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__brand">
          Revoir
        </Link>
        <p className="layout__tagline">Qu’est-ce que je dois revoir aujourd’hui&nbsp;?</p>
      </header>

      <NavBar />

      <main className="layout__main">
        {error && (
          <p className="banner banner--warn" role="status">
            {error}
          </p>
        )}
        <Outlet />
      </main>

      {showAdd && (
        <Link to="/nouveau" className="add-button" aria-label="Ajouter un élément">
          <IconPlus width="26" height="26" strokeWidth="1.8" />
        </Link>
      )}

      <UpdatePrompt />
    </div>
  )
}
