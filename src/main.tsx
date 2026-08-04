import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/reset.css'
import './styles/theme.css'
import './styles/app.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Élément racine introuvable.')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
