// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les états que traverse un écran avant de montrer ce qu'il a à montrer —
 * section 8.23 du design system.
 *
 * Deux seulement, parce qu'il n'y en a que deux : la lecture est en cours, ou
 * elle a échoué. Il n'y a ni réseau, ni requête à retenter en boucle, ni
 * chargement progressif : la base est locale et répond en quelques dizaines de
 * millisecondes.
 */
import type { ReactNode } from 'react'
import { useDonnees } from '../state/useDonnees'
import { useTextes } from '../state/usePreferences'
import { Bouton } from './Bouton'

/**
 * Le gabarit d'attente : la forme de l'écran, posée avant les données.
 *
 * **Pas de tourniquet.** Une lecture locale dure quelques dizaines de
 * millisecondes : un tourniquet n'aurait le temps que d'apparaître, et sa
 * rotation dirait « c'est long » là où il ne se passe rien. Le gabarit, lui,
 * réserve la place — la page ne saute pas quand les données arrivent.
 *
 * Il n'est pas animé non plus. Le pouls d'un gabarit serait une quatrième
 * animation, et la section 6 en autorise trois.
 *
 * Il est entièrement masqué aux lecteurs d'écran : ce sont des rectangles, ils
 * n'ont rien à dire. C'est la région qui l'entoure qui porte `aria-busy` et le
 * mot « Chargement ».
 */
export function Gabarit({ lignes = 3 }: { lignes?: number }) {
  const t = useTextes()

  return (
    <div className="gabarit" aria-busy="true">
      <span className="invisible">{t.commun.chargement}</span>
      <div aria-hidden="true" className="gabarit__pile">
        <span className="gabarit__bloc gabarit__bloc--surtitre" />
        <span className="gabarit__bloc gabarit__bloc--titre" />
        <span className="gabarit__bloc gabarit__bloc--regle" />
        {Array.from({ length: lignes }, (_, index) => (
          <span key={index} className="gabarit__bloc gabarit__bloc--ligne" />
        ))}
      </div>
    </div>
  )
}

/**
 * L'écran d'erreur de lecture.
 *
 * Il dit trois choses, dans cet ordre : ce qui s'est passé, que rien n'est
 * perdu, et quoi faire. La deuxième est la plus importante — les données sont
 * locales, et « impossible de lire » se lit sinon comme « tout a disparu ».
 */
export function ErreurLecture({ message }: { message: string }) {
  const { relire } = useDonnees()
  const t = useTextes()

  return (
    <div className="erreur" role="alert">
      <p className="erreur__texte">{message}</p>
      <Bouton variante="discret" onClick={() => void relire()}>
        {t.commun.reessayer}
      </Bouton>
    </div>
  )
}

/**
 * Ce qu'un écran affiche tant qu'il n'a rien à afficher : le gabarit pendant
 * la lecture, l'erreur si elle a échoué, le contenu sinon.
 *
 * Un composant plutôt qu'un couple de conditions recopié dans chaque page :
 * l'ordre compte — une erreur pendant une relecture ne doit pas repasser sous
 * le gabarit —, et un ordre qui compte ne se recopie pas.
 */
export function EtatDonnees({
  lignes,
  children,
}: {
  lignes?: number
  children: ReactNode
}) {
  const { loading, error } = useDonnees()

  if (error !== null) return <ErreurLecture message={error} />
  if (loading) return <Gabarit lignes={lignes} />
  return <>{children}</>
}
