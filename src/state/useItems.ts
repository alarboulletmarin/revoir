import { useContext } from 'react'
import { ItemsContext, type ItemsContextValue } from './ItemsContext'

export function useItems(): ItemsContextValue {
  const context = useContext(ItemsContext)
  if (!context) {
    throw new Error('useItems doit être utilisé à l’intérieur de <ItemsProvider>.')
  }
  return context
}
