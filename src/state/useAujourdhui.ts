import { useEffect, useState } from 'react'
import { msAvantMinuit, todayKey, type DateKey } from '../lib/dates'

/**
 * Le jour courant — celui qui change à minuit.
 *
 * Lire `todayKey()` au rendu suffit tant qu'une page se recharge. Ce n'est pas
 * le cas ici : l'application est installable, et elle passe la nuit ouverte sur
 * un téléphone. Au réveil, la page annonçait encore la date de la veille, la
 * liste du jour montrait celle d'hier, et les échéances du jour se comptaient
 * en retard sans que rien n'ait été manqué.
 *
 * Trois réveils, parce qu'aucun ne suffit seul : un minuteur calé sur minuit
 * pour l'appareil resté allumé, `visibilitychange` pour l'onglet ou l'app
 * revenus au premier plan, `focus` pour la fenêtre reprise sans changement de
 * visibilité. Reposer la même clé ne coûte rien — React ne rend pas à nouveau
 * pour une valeur identique.
 */
export function useAujourdhui(): DateKey {
  const [jour, setJour] = useState(todayKey)

  useEffect(() => {
    let minuteur: number | undefined

    const caler = () => {
      setJour(todayKey())
      window.clearTimeout(minuteur)
      minuteur = window.setTimeout(caler, msAvantMinuit())
    }

    const auRetour = () => {
      if (document.visibilityState === 'visible') caler()
    }

    caler()
    document.addEventListener('visibilitychange', auRetour)
    window.addEventListener('focus', auRetour)

    return () => {
      window.clearTimeout(minuteur)
      document.removeEventListener('visibilitychange', auRetour)
      window.removeEventListener('focus', auRetour)
    }
  }, [])

  return jour
}
