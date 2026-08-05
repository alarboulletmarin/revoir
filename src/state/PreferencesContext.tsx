// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les deux préférences d'appareil : le thème et la langue.
 *
 * Ni l'une ni l'autre n'appartient aux données. Elles ne s'exportent pas, ne
 * s'importent pas et ne se synchronisent pas — un fichier de sauvegarde décrit
 * des révisions, pas l'écran sur lequel on les lit. D'où `localStorage`, comme
 * le mode de colonnes du tableau, et d'où le fait qu'une écriture qui échoue ne
 * soit pas une erreur : en navigation privée l'application marche, elle oublie
 * simplement le choix d'une visite à l'autre.
 *
 * Le fournisseur est le **seul** endroit qui écrive la langue et l'apparence
 * actives. Tout le reste les lit : les composants par `useTextes()`, les
 * modules `lib/` par `textes()` et `fondCourant()`.
 */
import {
  createContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from 'react'
import {
  definirLangueActive,
  estLangue,
  langueDuNavigateur,
  textes,
  type Dictionnaire,
  type Langue,
} from '../i18n'
import {
  CLE_LANGUE,
  CLE_THEME,
  REQUETE_SOMBRE,
  appliquerTheme,
  definirThemeResolu,
  estTheme,
  type Theme,
  type ThemeResolu,
} from './theme'
import { usePreference } from './usePreference'
import { useMediaQuery } from './useMediaQuery'

/**
 * Calculée une fois : `navigator.languages` ne bouge pas en cours de session,
 * et ce n'est de toute façon qu'un défaut — dès que l'utilisateur choisit,
 * c'est son choix qui vaut.
 */
const LANGUE_DEFAUT = langueDuNavigateur()

export interface PreferencesContextValue {
  theme: Theme
  definirTheme: (theme: Theme) => void
  /** L'apparence effectivement rendue : « système » y est déjà tranché. */
  themeRendu: ThemeResolu
  langue: Langue
  definirLangue: (langue: Langue) => void
  /** Le dictionnaire de la langue active. */
  t: Dictionnaire
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, definirTheme] = usePreference<Theme>(CLE_THEME, 'systeme', estTheme)
  const [langue, definirLangue] = usePreference<Langue>(
    CLE_LANGUE,
    LANGUE_DEFAUT,
    estLangue,
  )

  /*
   * `prefers-color-scheme` est la seule requête média du projet qui ne soit pas
   * une `min-width` (section 7.1) : ce n'est pas une largeur, c'est une
   * préférence, et elle change sans que la fenêtre bouge.
   */
  const systemeSombre = useMediaQuery(REQUETE_SOMBRE)
  const themeRendu: ThemeResolu =
    theme === 'systeme' ? (systemeSombre ? 'sombre' : 'clair') : theme

  /*
   * Pendant le rendu, pas dans un effet.
   *
   * Les enfants lisent `textes()` et `fondCourant()` dans leur propre rendu,
   * qui a lieu avant le moindre effet : les poser plus tard afficherait une
   * première fois la langue précédente. Les deux fonctions n'écrivent qu'une
   * variable de module et ne touchent pas au DOM — le DOM, lui, attend l'effet
   * de disposition ci-dessous.
   */
  definirLangueActive(langue)
  definirThemeResolu(themeRendu)

  // Avant peinture : `useEffect` laisserait passer un éclair de thème clair.
  useLayoutEffect(() => {
    appliquerTheme(themeRendu)
  }, [themeRendu])

  useEffect(() => {
    document.documentElement.lang = langue
  }, [langue])

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      definirTheme,
      themeRendu,
      langue,
      definirLangue,
      t: textes(),
    }),
    [theme, definirTheme, themeRendu, langue, definirLangue],
  )

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  )
}
