import { Link, Outlet, useLocation } from 'react-router-dom'
import { NavBar } from './NavBar'
import { IconePlus } from './Icons'
import { UpdatePrompt } from './UpdatePrompt'
import { useItems } from '../state/useItems'

/** Le bouton « + » n'a pas de sens sur les écrans de saisie eux-mêmes. */
function fabVisible(pathname: string): boolean {
  return pathname !== '/nouveau' && !pathname.endsWith('/modifier')
}

export function Layout() {
  const { error } = useItems()
  const { pathname } = useLocation()

  return (
    <div className="appli">
      <a className="saut" href="#contenu">
        Aller au contenu
      </a>

      <header className="appli__entete">
        <div className="appli__barre">
          <Link to="/" className="appli__marque">
            Revoir
          </Link>
        </div>
        <NavBar />
      </header>

      <main className="page" id="contenu">
        {error && (
          <p className="banniere banniere--retard" role="status">
            {error}
          </p>
        )}
        <Outlet />
      </main>

      {fabVisible(pathname) && (
        <Link to="/nouveau" className="fab" aria-label="Ajouter un élément">
          <IconePlus width="24" height="24" strokeWidth="1.8" />
        </Link>
      )}

      <UpdatePrompt />
    </div>
  )
}
