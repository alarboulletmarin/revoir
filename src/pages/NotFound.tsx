import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="stack">
      <h1 className="page-title">Page introuvable</h1>
      <p className="muted">Cette adresse ne correspond à aucune page de Revoir.</p>
      <Link to="/" className="button">
        Retour au tableau de bord
      </Link>
    </div>
  )
}
