// SPDX-License-Identifier: AGPL-3.0-only

import { useTitrePage } from '../state/useTitrePage'
import { LienBouton } from '../components/Bouton'

export function NotFound() {
  useTitrePage('Page introuvable')

  return (
    <div className="etat-vide">
      <h1 className="page__titre">Page introuvable</h1>
      <p className="discret">Cette adresse ne correspond à aucune page de Revoir.</p>
      <LienBouton vers="/" variante="primaire">
        Retour au tableau de bord
      </LienBouton>
    </div>
  )
}
