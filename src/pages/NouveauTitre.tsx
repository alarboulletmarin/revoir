// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { useBrouillonSujet } from '../state/useBrouillonSujet'
import { titreValide } from '../lib/brouillon'
import { Champ } from '../components/Champ'
import { EtapeCreation } from '../components/EtapeCreation'

/**
 * Première question : qu'est-ce que vous voulez revoir ?
 *
 * Une question par écran, et celle-ci d'abord parce que c'est la seule dont la
 * réponse soit obligatoire. Les deux suivantes ont toutes les deux une sortie.
 */
export function NouveauTitre() {
  const t = useTextes()
  useTitrePage(t.creation.titre.question)
  const navigate = useNavigate()
  const { brouillon, majBrouillon } = useBrouillonSujet()

  /*
   * L'erreur n'apparaît qu'après une tentative. Ouvrir un champ vide en le
   * disant fautif reproche à quelqu'un de n'avoir pas encore écrit.
   */
  const [tente, setTente] = useState(false)
  const valide = titreValide(brouillon.titre)

  const continuer = () => {
    setTente(true)
    if (valide) navigate('/nouveau/categorie')
  }

  return (
    <EtapeCreation
      rang={1}
      question={t.creation.titre.question}
      intro={t.creation.titre.intro}
      sortie={{ libelle: t.creation.plusTard, onClick: () => navigate('/') }}
      action={{
        libelle: t.creation.continuer,
        onClick: continuer,
        desactivee: tente && !valide,
      }}
    >
      <Champ
        label={t.creation.titre.champ}
        type="text"
        value={brouillon.titre}
        placeholder={t.creation.titre.exemple}
        maxLength={120}
        autoComplete="off"
        autoFocus
        onChange={(event) => majBrouillon({ titre: event.target.value })}
        erreur={tente && !valide ? t.creation.titre.erreur : null}
      />

      {/*
        Des exemples touchables plutôt qu'une phrase d'aide. « Sujet » est un
        mot large, et la première création se fait à froid : personne ne sait
        s'il faut y écrire « Mathématiques » ou « les dérivées ». Quatre
        domaines, pour que l'application ne passe pas pour un outil scolaire.
      */}
      <div className="exemples">
        <p className="surtitre">{t.creation.titre.exemplesIntitule}</p>
        <ul className="exemples__liste">
          {t.creation.titre.exemples.map((exemple) => (
            <li key={exemple}>
              <button
                type="button"
                className="pilule"
                onClick={() => {
                  majBrouillon({ titre: exemple })
                  setTente(false)
                }}
              >
                {exemple}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="discret discret--petit">{t.creation.titre.rassurance}</p>
    </EtapeCreation>
  )
}
