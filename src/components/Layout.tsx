import { useLayoutEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { NavBar } from './NavBar'
import { IconePlus, IconeReglages } from './Icons'
import { Marque } from './Marque'
import { UpdatePrompt } from './UpdatePrompt'
import { useDonnees } from '../state/useDonnees'

/** Le bouton « + » n'a pas de sens sur les écrans de saisie eux-mêmes. */
function fabVisible(pathname: string): boolean {
  return !pathname.endsWith('/nouveau') && !pathname.endsWith('/modifier')
}

/**
 * Une page qui s'ouvre s'ouvre en haut.
 *
 * Le bouton « Créer le sujet » est en bas d'un formulaire long : sans ça, la
 * fiche qui s'ouvre derrière hérite du défilement du formulaire et démarre au
 * milieu de nulle part. Vaut pour toute navigation, pas seulement celle-là.
 *
 * `useLayoutEffect` et non `useEffect` : la remontée doit avoir lieu avant que
 * le navigateur ne peigne la nouvelle page, sinon elle se voit.
 *
 * Un retour arrière est épargné — le navigateur y restaure la position, et la
 * lui reprendre serait perdre sa place dans une longue liste.
 */
function useRemonterEnHaut(pathname: string) {
  const navigation = useNavigationType()
  useLayoutEffect(() => {
    if (navigation === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, navigation])
}

export function Layout() {
  const { error } = useDonnees()
  const { pathname } = useLocation()

  useRemonterEnHaut(pathname)

  return (
    <div className="appli">
      <a className="saut" href="#contenu">
        Aller au contenu
      </a>

      <header className="appli__entete">
        <div className="appli__barre">
          <Link to="/" className="appli__marque">
            <Marque className="appli__signe" />
            Revoir
          </Link>
        </div>
        <NavBar />
        {/*
          Les réglages ne sont pas dans la navigation : celle-ci porte les trois
          vues, et à 320px un quatrième libellé la ferait déborder. Ils se
          tiennent au bout de l'en-tête, à l'opposé du logotype — accolés à lui,
          ils passeraient pour une seconde moitié du signe.

          Seul lien de l'app réduit à son icône. Le mot reste lu par les
          lecteurs d'écran et s'affiche au survol : une icône sans nom n'est pas
          une icône, c'est une devinette.
        */}
        <NavLink
          to="/reglages"
          aria-label="Réglages"
          title="Réglages"
          className={({ isActive }) =>
            isActive ? 'appli__reglages appli__reglages--actif' : 'appli__reglages'
          }
        >
          <IconeReglages width="20" height="20" />
        </NavLink>
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
        <Link to="/nouveau" className="fab" aria-label="Ajouter un sujet">
          <IconePlus width="24" height="24" strokeWidth="1.8" />
        </Link>
      )}

      <UpdatePrompt />
    </div>
  )
}
