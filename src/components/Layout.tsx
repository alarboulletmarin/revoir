// SPDX-License-Identifier: AGPL-3.0-only

import { useLayoutEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { NavBar } from './NavBar'
import { IconeChevron, IconePlus, IconeReglages } from './Icons'
import { Marque } from './Marque'
import { UpdatePrompt } from './UpdatePrompt'
import { useDonnees } from '../state/useDonnees'
import { useTextes } from '../state/usePreferences'
import { estRacine, useRetour } from '../state/useRetour'

/**
 * Le bouton « + » n'a pas de sens sur les écrans de saisie eux-mêmes.
 *
 * « nouvelle » au féminin pour la catégorie : le mot suit son objet, et une
 * seule des deux formes laisserait le bouton flotter sur un formulaire.
 */
function fabVisible(pathname: string): boolean {
  return !/\/(nouveau|nouvelle|modifier)$/.test(pathname)
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
  const t = useTextes()
  const revenir = useRetour()

  useRemonterEnHaut(pathname)

  const racine = estRacine(pathname)

  return (
    <div className="appli">
      <a className="saut" href="#contenu">
        {t.coque.sautContenu}
      </a>

      <header className="appli__entete">
        {/*
          Une seule chose à gauche : la marque sur une vue, le retour partout
          ailleurs. Les deux mènent en arrière, l'un vers la racine et l'autre
          vers l'écran précédent ; les afficher ensemble donnerait deux
          réponses à la même question, et prendrait au retour la place de son
          mot à 320px. La barre du bas, elle, reste là dans les deux cas.
        */}
        <div className="appli__barre">
          {racine ? (
            <Link to="/" className="appli__marque">
              <Marque className="appli__signe" />
              Revoir
            </Link>
          ) : (
            <button type="button" className="appli__retour" onClick={revenir}>
              <IconeChevron
                direction="gauche"
                className="appli__retour-signe"
                width="20"
                height="20"
              />
              {t.commun.retour}
            </button>
          )}
        </div>

        {/*
          Aide et réglages ne sont pas dans la navigation : celle-ci porte les
          trois vues, et une quatrième part ferait tomber chaque libellé sous
          72px à 320px. Ils se tiennent au bout de l'en-tête, à l'opposé du
          logotype — accolés à lui, ils passeraient pour une seconde moitié du
          signe.

          Les deux seuls liens de l'app réduits à un signe. Le mot reste lu par
          les lecteurs d'écran et s'affiche au survol : un signe sans nom n'est
          pas un signe, c'est une devinette.
        */}
        <div className="appli__outils">
          {/*
            Un point d'interrogation composé, pas une dixième icône : la
            section 11 arrête la liste des signes dessinés, et un « ? » est une
            lettre. Il dit déjà ce qu'aucun dessin ne dirait mieux.
          */}
          <NavLink
            to="/aide"
            aria-label={t.coque.aide}
            title={t.coque.aide}
            className={({ isActive }) =>
              isActive ? 'appli__outil appli__outil--actif' : 'appli__outil'
            }
          >
            <span className="appli__aide" aria-hidden="true">
              ?
            </span>
          </NavLink>

          <NavLink
            to="/reglages"
            aria-label={t.coque.reglages}
            title={t.coque.reglages}
            className={({ isActive }) =>
              isActive ? 'appli__outil appli__outil--actif' : 'appli__outil'
            }
          >
            <IconeReglages width="20" height="20" />
          </NavLink>
        </div>
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
        <Link to="/nouveau" className="fab" aria-label={t.coque.ajouterSujet}>
          <IconePlus width="24" height="24" strokeWidth="1.8" />
        </Link>
      )}

      <NavBar />

      <UpdatePrompt />
    </div>
  )
}
