/**
 * Les champs d'une catégorie : un nom, une couleur, et l'aperçu de ce que ça
 * donnera.
 *
 * Deux écrans les rendent — la page `/categories/nouvelle` et la feuille de
 * création rapide du formulaire d'un sujet. Écrits deux fois, ils finiraient
 * par diverger sur un détail : la longueur maximale, l'ordre, ou la couleur
 * proposée pendant la frappe. Ils sont donc écrits une fois.
 *
 * Contrôlé de bout en bout : le parent tient `{ nom, teinte }` et l'erreur,
 * parce que c'est lui qui sait quand soumettre et quoi en faire.
 */
import type { Teinte } from '../lib/categories'
import { teinteParDefaut } from '../lib/categories'
import { Champ } from './Champ'
import { ChipCategorie } from './ChipCategorie'
import { SelecteurTeinte } from './SelecteurTeinte'
import type { Ref } from 'react'

export interface BrouillonCategorie {
  nom: string
  /** `null` : aucun choix — la teinte suit alors le nom. Sémantique de `tint`. */
  teinte: Teinte | null
}

interface ChampsCategorieProps {
  valeur: BrouillonCategorie
  onChange: (valeur: BrouillonCategorie) => void
  erreur?: string | null
  /** Distingue deux groupes de radios présents sur le même écran. */
  groupeTeinte: string
  /** Le champ que la feuille vise à l'ouverture. */
  refNom?: Ref<HTMLInputElement>
}

export function ChampsCategorie({
  valeur,
  onChange,
  erreur,
  groupeTeinte,
  refNom,
}: ChampsCategorieProps) {
  const propre = valeur.nom.trim()

  /*
   * Tant qu'aucune couleur n'est choisie, celle que le nom vaut à la catégorie.
   * C'est déjà la règle du modèle — `tint` à null veut dire « aucun choix »,
   * pas « aucune couleur » — simplement rendue visible : la pastille change au
   * fil de la frappe, puis se fige dès qu'on touche au sélecteur.
   */
  const apercu = valeur.teinte ?? teinteParDefaut(propre)

  return (
    <>
      <Champ
        ref={refNom}
        label="Nom"
        type="text"
        value={valeur.nom}
        maxLength={60}
        autoComplete="off"
        onChange={(event) => onChange({ ...valeur, nom: event.target.value })}
        erreur={erreur}
      />

      <SelecteurTeinte
        groupe={groupeTeinte}
        legende="Couleur"
        valeur={apercu}
        onChange={(teinte) => onChange({ ...valeur, teinte })}
      />

      {/* Ce qu'on obtiendra, tel que ça s'écrira dans les listes. */}
      <div className="champs-categorie__apercu">
        <span className="champ__label">Aperçu</span>
        <ChipCategorie
          categorie={{
            id: 'apercu',
            name: propre === '' ? 'Sans nom' : propre,
            tint: apercu,
            createdAt: '',
            updatedAt: '',
          }}
        />
      </div>
    </>
  )
}
