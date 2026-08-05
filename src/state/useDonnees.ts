import { useContext } from 'react'
import { DonneesContext, type DonneesContextValue } from './DonneesContext'

export function useDonnees(): DonneesContextValue {
  const context = useContext(DonneesContext)
  if (!context) {
    throw new Error('useDonnees doit être utilisé à l’intérieur de <DonneesProvider>.')
  }
  return context
}
