// SPDX-License-Identifier: AGPL-3.0-only

import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { LienBouton } from '../components/Bouton'

export function NotFound() {
  const t = useTextes()
  useTitrePage(t.erreurs.introuvable)

  return (
    <div className="etat-vide">
      <h1 className="page__titre">{t.erreurs.introuvable}</h1>
      <p className="discret">{t.erreurs.adresseInconnue}</p>
      <LienBouton vers="/" variante="primaire">
        {t.sujet.retourTableau}
      </LienBouton>
    </div>
  )
}
