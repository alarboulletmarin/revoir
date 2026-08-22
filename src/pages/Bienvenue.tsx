// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { useAujourdhui } from '../state/useAujourdhui'
import { useJeuExemple, useOnboardingVu } from '../state/useJeuExemple'
import { buildReviews, DEFAULT_SCHEDULE } from '../lib/schedules'
import { Frise } from '../components/Frise'
import { Bouton } from '../components/Bouton'

/** Trois écrans, dix secondes. C'est la promesse du pied de page. */
const ECRANS = 3

/**
 * La présentation en trois écrans — section 8.25 du design system.
 *
 * Elle explique ce que l'application ne peut pas montrer sur un écran vide :
 * la question à laquelle elle répond, pourquoi les écarts grandissent, et ce
 * qui se passe quand on coche en retard.
 *
 * **Elle est sautable, et la sortie est aussi lisible que l'entrée.** « Passer »
 * est écrit en 15 px souligné, en `--encre`, à droite de l'en-tête — pas en
 * gris pâle dans un coin. Une présentation dont on ne trouve pas la sortie
 * n'est plus une présentation, c'est un péage.
 */
export function Bienvenue() {
  const t = useTextes()
  useTitrePage(t.bienvenue.titrePage)
  const navigate = useNavigate()
  const aujourdhui = useAujourdhui()
  const { programmes } = useDonnees()
  const { charger, charge } = useJeuExemple()
  const [, marquerVu] = useOnboardingVu()

  const [rang, setRang] = useState(1)

  /** Sortir, par « Passer » ou par la fin : dans les deux cas, on l'a vue. */
  const sortir = (vers = '/') => {
    marquerVu(true)
    navigate(vers, { replace: true })
  }

  const explorer = async () => {
    await charger()
    sortir()
  }

  const ecran = t.bienvenue.ecrans[rang - 1]
  const fin = rang === ECRANS

  return (
    <div className="bienvenue">
      <div className="bienvenue__entete">
        {/*
          Trois graduations, pas une barre : c'est la même façon de compter que
          sur les trois pages de création (section 8.22), et le même objet que
          la règle — un trait par étape franchie.
        */}
        <div className="bienvenue__avancement">
          <ol
            className="bienvenue__graduations"
            aria-label={t.bienvenue.intitule(rang, ECRANS)}
          >
            {Array.from({ length: ECRANS }, (_, index) => (
              <li
                key={index}
                className={
                  index + 1 === rang
                    ? 'bienvenue__graduation bienvenue__graduation--active'
                    : 'bienvenue__graduation'
                }
                aria-current={index + 1 === rang ? 'step' : undefined}
              />
            ))}
          </ol>
          <span className="bienvenue__compte chiffres">
            {t.bienvenue.compte(rang, ECRANS)}
          </span>
        </div>

        <button type="button" className="lien bienvenue__passer" onClick={() => sortir()}>
          {t.bienvenue.passer}
        </button>
      </div>

      <div className="bienvenue__corps">
        <div className="bienvenue__texte">
          <p className="surtitre surtitre--accent">{ecran.surtitre}</p>
          <h1 className="titre-page">{ecran.titre}</h1>
          <p className="bienvenue__detail">{ecran.detail}</p>
        </div>

        {/*
          La frise se trace sur le deuxième écran, et seulement là : c'est celui
          qui a quelque chose à démontrer. La remontrer sur les deux autres
          ferait d'une démonstration une décoration.
        */}
        {'legende' in ecran && (
          <div className="bienvenue__demonstration">
            <Frise
              key={rang}
              origine={aujourdhui}
              reviews={buildReviews('apercu', aujourdhui, DEFAULT_SCHEDULE, programmes)}
              aujourdhui={aujourdhui}
              libelles="decalage"
              tracee
              intitule={t.bienvenue.ecrans[1].titre}
            />
            <p className="bienvenue__legende">{ecran.legende}</p>
          </div>
        )}

        {fin && (
          <div className="bienvenue__fin">
            <Bouton variante="primaire" onClick={() => sortir('/nouveau/titre')}>
              {t.bienvenue.creer}
            </Bouton>
            {/*
              Le jeu d'exemple n'est proposé qu'à qui n'en a pas déjà un : le
              charger deux fois donnerait huit sujets d'exemple et un « Tout
              effacer » qui n'en retirerait que quatre.
            */}
            {!charge && (
              <Bouton variante="discret" onClick={() => void explorer()}>
                {t.exemple.charger}
              </Bouton>
            )}
          </div>
        )}
      </div>

      <div className="bienvenue__pied">
        {!fin && (
          <Bouton variante="primaire" onClick={() => setRang(rang + 1)}>
            {t.bienvenue.continuer}
          </Bouton>
        )}
        <p className="discret discret--petit">{t.bienvenue.pied}</p>
      </div>
    </div>
  )
}
