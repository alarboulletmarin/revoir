// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le retour en arrière.
 *
 * L'application est installable, et une application installée n'a pas de
 * bouton « précédent » : ni la barre du navigateur, ni — sur iOS — le moindre
 * geste système en mode autonome. Un formulaire ouvert depuis une fiche s'y
 * terminait donc en impasse, avec pour seule sortie la barre du bas, qui
 * ramène à une vue et non d'où l'on vient.
 *
 * Deux chemins, dans cet ordre :
 *
 * 1. **L'historique**, quand il y a quelque chose derrière. C'est le seul
 *    retour qui soit exact — il rend la position dans une longue liste, ce
 *    qu'aucune adresse ne saurait faire.
 * 2. **Le parent**, sinon. Une fiche ouverte depuis un lien partagé ou un
 *    raccourci d'écran d'accueil n'a rien derrière elle : `navigate(-1)` y
 *    sortirait de l'application, ce qui n'est pas un retour, c'est un départ.
 */
import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Les trois vues. Elles n'ont pas de retour : c'est la barre du bas qui les
 * relie, et un retour y pointerait sur l'une d'elles au hasard.
 */
const RACINES = new Set(['/', '/calendrier', '/suivi'])

export function estRacine(pathname: string): boolean {
  return RACINES.has(pathname)
}

/**
 * L'écran d'où celui-ci a logiquement été ouvert.
 *
 * Une hiérarchie, pas un journal : la modification d'un sujet remonte à sa
 * fiche, la fiche au tableau de bord, un programme aux réglages qui les
 * listent. C'est le repli de la première règle, jamais son remplacement.
 */
export function parentDe(pathname: string): string {
  const modifie = /^\/sujet\/([^/]+)\/modifier$/.exec(pathname)
  if (modifie) return `/sujet/${modifie[1]}`
  if (pathname.startsWith('/categories/')) return '/categories'
  if (pathname === '/categories') return '/reglages'
  if (pathname.startsWith('/programmes')) return '/reglages'
  return '/'
}

/**
 * Revenir. Sert au bouton de l'en-tête comme au « Annuler » des formulaires :
 * les deux font la même chose, et un formulaire abandonné doit reposer où le
 * retour aurait reposé.
 */
export function useRetour(): () => void {
  const navigate = useNavigate()
  const { pathname, key } = useLocation()

  return useCallback(() => {
    /*
     * `key` vaut « default » sur la toute première entrée de l'historique du
     * routeur : la page a été ouverte directement, il n'y a rien derrière elle
     * qui nous appartienne.
     */
    if (key === 'default') navigate(parentDe(pathname), { replace: true })
    else navigate(-1)
  }, [navigate, pathname, key])
}
