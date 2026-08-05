import { useCallback, useState } from 'react'

/**
 * Une préférence d'affichage retenue sur cet appareil.
 *
 * Le mode de colonnes du tableau et les catégories dépliées n'appartiennent
 * pas aux données : elles ne s'exportent pas, ne se synchronisent pas, et ne
 * valent que pour l'écran d'où elles ont été choisies. D'où localStorage
 * plutôt que la base — et d'où, aussi, le fait qu'une écriture qui échoue ne
 * soit pas une erreur : en navigation privée l'app fonctionne, elle oublie
 * simplement le pli d'une visite à l'autre.
 *
 * `estValide` garde la valeur relue : le stockage local est modifiable à la
 * main, et une préférence lue sans vérification est une donnée extérieure.
 */
export function usePreference<T>(
  cle: string,
  defaut: T,
  estValide: (valeur: unknown) => valeur is T,
): [T, (valeur: T) => void] {
  const [valeur, setValeur] = useState<T>(() => lire(cle, estValide) ?? defaut)

  const definir = useCallback(
    (suivante: T) => {
      setValeur(suivante)
      ecrire(cle, suivante)
    },
    [cle],
  )

  return [valeur, definir]
}

export function lire<T>(
  cle: string,
  estValide: (valeur: unknown) => valeur is T,
): T | null {
  try {
    const brut = localStorage.getItem(cle)
    if (brut === null) return null
    const parse: unknown = JSON.parse(brut)
    return estValide(parse) ? parse : null
  } catch {
    // Stockage indisponible ou contenu illisible : on repart du défaut.
    return null
  }
}

export function ecrire(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur))
  } catch {
    // Sans persistance, la préférence ne survit pas à la navigation : ce n'est
    // pas une raison de casser l'affichage.
  }
}

export const estListeDeChaines = (valeur: unknown): valeur is string[] =>
  Array.isArray(valeur) && valeur.every((entree) => typeof entree === 'string')
