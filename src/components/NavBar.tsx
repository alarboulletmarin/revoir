// SPDX-License-Identifier: AGPL-3.0-only

import { Link, NavLink } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'
import { IconeCalendrier, IconeJour, IconeSuivi } from './Icons'
import { Marque } from './Marque'
import { useTextes } from '../state/usePreferences'

/**
 * La barre du bas : les trois vues de l'application, et elles seules.
 *
 * En bas parce que c'est là que le pouce arrive. L'application s'installe et se
 * tient d'une main ; une navigation en haut d'un grand téléphone demande de
 * changer de prise à chaque changement de vue, et le geste central de l'app —
 * cocher — se fait justement du pouce.
 *
 * L'icône **et** le mot, jamais l'icône seule. Aucun des trois signes ne se
 * devine : « Aujourd'hui » et « Suivi » n'ont pas de pictogramme convenu, et
 * même le calendrier, seul, ne dirait pas s'il ouvre une vue ou un sélecteur de
 * date. Le mot dit la destination, le signe la rend reconnaissable au coup
 * d'œil suivant.
 *
 * Trois entrées, et trois seulement. Aide et réglages ne sont pas des vues :
 * ils vivent au bout de l'en-tête, et une quatrième part ferait tomber chaque
 * libellé sous 72px à 320px.
 */
const LIENS: {
  vers: string
  cle: 'aujourdhui' | 'calendrier' | 'suivi'
  Signe: ComponentType<SVGProps<SVGSVGElement>>
}[] = [
  { vers: '/', cle: 'aujourdhui', Signe: IconeJour },
  { vers: '/calendrier', cle: 'calendrier', Signe: IconeCalendrier },
  { vers: '/suivi', cle: 'suivi', Signe: IconeSuivi },
]

/**
 * @param marque affiche le logotype en tête du rail. Vrai au bureau seulement,
 *   où la navigation passe à gauche (section 7.5) : la marque y reprend la
 *   place qu'elle occupe en haut de l'en-tête sur un téléphone. Elle n'est
 *   jamais rendue deux fois — c'est le Layout qui décide, pas le CSS.
 */
export function NavBar({ marque = false }: { marque?: boolean }) {
  const t = useTextes()

  return (
    <nav className="nav" aria-label={t.coque.navigationPrincipale}>
      {marque && (
        <Link to="/" className="appli__marque nav__marque">
          <Marque className="appli__signe" />
          Revoir
        </Link>
      )}
      <ul className="nav__liste">
        {LIENS.map(({ vers, cle, Signe }) => (
          <li key={vers} className="nav__element">
            <NavLink
              to={vers}
              end={vers === '/'}
              className={({ isActive }) =>
                isActive ? 'nav__lien nav__lien--actif' : 'nav__lien'
              }
            >
              <Signe className="nav__signe" width="22" height="22" />
              <span className="nav__mot">{t.nav[cle]}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
