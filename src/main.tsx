import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
// tokens.css d'abord : tout le reste s'y réfère.
import './styles/tokens.css'
import './styles/reset.css'
import './styles/base.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Élément racine introuvable.')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
