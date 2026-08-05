// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Choix de la catégorie d'un sujet (section 8.15).
 *
 * Un `<select>` natif, et non un champ libre : la catégorie existe avant le
 * sujet, on la désigne. La saisie libre créait une catégorie par frappe — une
 * faute de frappe suffisait à en fabriquer une seconde, avec sa propre couleur.
 *
 * La pastille est **dans le champ**, à gauche de la valeur, et suit la
 * sélection : la liste déroulée appartient au système, un `<option>` ne se
 * colore pas de la même façon d'un navigateur à l'autre. La couleur ne porte
 * rien seule — le nom est écrit dans le champ comme dans chaque option
 * (section 3 bis, règle 2).
 *
 * Le raccourci de création est un **bouton sous le champ**, pas une option
 * piégée dans la liste : une option qui n'est pas une valeur est annoncée comme
 * une valeur, et laisserait le champ incohérent si l'on renonce.
 */
import { useEffect, useRef, useState } from 'react'
import type { Category } from '../types'
import type { Teinte } from '../lib/categories'
import { categorieHomonyme } from '../lib/categories'
import { categoriesTriees } from '../lib/sujets'
import { Bouton } from './Bouton'
import { ChampSelect } from './Champ'
import { ChampsCategorie, type BrouillonCategorie } from './ChampsCategorie'
import { PastilleCategorie } from './ChipCategorie'
import { FeuilleBas } from './FeuilleBas'
import { IconePlus } from './Icons'

const VIDE: BrouillonCategorie = { nom: '', teinte: null }

interface SelecteurCategorieProps {
  categories: Category[]
  /** null pour « Sans catégorie », qui est un état normal et non une ligne. */
  valeur: string | null
  onChange: (categoryId: string | null) => void
  /** Création rapide : le formulaire passe `creerCategorie` du contexte. */
  onCreer: (nom: string, teinte: Teinte | null) => Promise<Category>
  /** Ouverture de la feuille, remontée pour que la page efface le FAB. */
  onFeuille?: (ouverte: boolean) => void
}

export function SelecteurCategorie({
  categories,
  valeur,
  onChange,
  onCreer,
  onFeuille,
}: SelecteurCategorieProps) {
  const champ = useRef<HTMLSelectElement>(null)
  const viserLeChamp = useRef(false)
  const [feuille, setFeuille] = useState(false)
  const selectionnee = categories.find((categorie) => categorie.id === valeur) ?? null

  const basculer = (ouverte: boolean) => {
    setFeuille(ouverte)
    onFeuille?.(ouverte)
  }

  const creer = async (nom: string, teinte: Teinte | null) => {
    const creee = await onCreer(nom, teinte)
    // Créer une catégorie depuis ce formulaire n'a de sens que si elle devient
    // aussitôt celle du sujet : c'est le geste qu'on venait faire.
    onChange(creee.id)
    viserLeChamp.current = true
    basculer(false)
  }

  /*
   * Le focus revient au champ après une création, et pas au bouton
   * « Nouvelle catégorie » où `<dialog>.close()` le renvoie : sans cela, rien
   * n'apprend à un lecteur d'écran que le champ vient de changer de valeur.
   *
   * Dans un effet, et non à la suite de `creer` : la fermeture est elle-même
   * un effet, celui de `FeuilleBas`. Les effets d'un enfant passent avant ceux
   * de son parent — la feuille est donc refermée quand celui-ci s'exécute, et
   * le focus qu'elle rend est déjà rendu.
   *
   * Seulement après une création : refermer la feuille par Échap, par le fond
   * ou par « Annuler » doit rendre le focus là où le navigateur le rend, au
   * bouton d'où l'on vient.
   */
  useEffect(() => {
    if (feuille || !viserLeChamp.current) return
    viserLeChamp.current = false
    champ.current?.focus()
  }, [feuille])

  return (
    <>
      <div className="selecteur-categorie">
        <ChampSelect
          ref={champ}
          label="Catégorie"
          aide="Facultatif."
          value={valeur ?? ''}
          pastille={
            selectionnee ? (
              <PastilleCategorie categorie={selectionnee} />
            ) : (
              /* Un cercle vide plutôt que rien : le champ ne doit pas sauter
                 latéralement au premier choix. */
              <span className="pastille pastille--vide" />
            )
          }
          onChange={(event) => onChange(event.target.value || null)}
        >
          <option value="">Sans catégorie</option>
          {categoriesTriees(categories).map((categorie) => (
            <option key={categorie.id} value={categorie.id}>
              {categorie.name}
            </option>
          ))}
        </ChampSelect>

        <Bouton className="selecteur-categorie__ajout" onClick={() => basculer(true)}>
          <IconePlus width="16" height="16" strokeWidth="2" />
          Nouvelle catégorie
        </Bouton>
      </div>

      <FeuilleNouvelleCategorie
        ouverte={feuille}
        categories={categories}
        onFermer={() => basculer(false)}
        onCreer={creer}
      />
    </>
  )
}

interface FeuilleNouvelleCategorieProps {
  ouverte: boolean
  categories: Category[]
  onFermer: () => void
  onCreer: (nom: string, teinte: Teinte | null) => Promise<void>
}

/**
 * La création rapide, sans quitter le formulaire du sujet.
 *
 * Une feuille plutôt qu'une navigation : le titre, la date et le programme
 * déjà saisis sont derrière elle et l'attendent. Partir sur `/categories`
 * reviendrait à abandonner la saisie en cours pour ranger ses étiquettes.
 *
 * Le nom et la couleur, rien de plus : c'est un raccourci, pas le formulaire
 * complet, qui reste sur son écran.
 */
function FeuilleNouvelleCategorie({
  ouverte,
  categories,
  onFermer,
  onCreer,
}: FeuilleNouvelleCategorieProps) {
  const champNom = useRef<HTMLInputElement>(null)
  const [brouillon, setBrouillon] = useState<BrouillonCategorie>(VIDE)
  const [soumis, setSoumis] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)

  const propre = brouillon.nom.trim()
  const erreur =
    propre === ''
      ? 'Le nom est obligatoire.'
      : categorieHomonyme(propre, categories)
        ? 'Une catégorie porte déjà ce nom.'
        : null

  const fermer = () => {
    setBrouillon(VIDE)
    setSoumis(false)
    onFermer()
  }

  const soumettre = async () => {
    setSoumis(true)
    if (erreur || enregistrement) return
    setEnregistrement(true)
    try {
      await onCreer(propre, brouillon.teinte)
      setBrouillon(VIDE)
      setSoumis(false)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <FeuilleBas
      ouverte={ouverte}
      titre="Nouvelle catégorie"
      cibleFocus={champNom}
      onFermer={fermer}
    >
      {/*
        Monté seulement quand la feuille est ouverte : la pipette du sélecteur
        de teinte n'est pas contrôlée — elle s'amorce sur `defaultValue`, une
        seule fois. Sans démontage, la deuxième ouverture rouvrirait le
        sélecteur du système sur la couleur de la catégorie précédente.
      */}
      {ouverte && (
        <div
          className="formulaire formulaire--feuille"
          /*
           * Une div et non un `<form>`. Cette feuille est rendue au milieu du
           * formulaire du sujet, et un `<form>` dans un `<form>` est interdit :
           * le navigateur s'y perd et soumet pour de bon — la page se
           * rechargeait, emportant le titre et la date déjà saisis.
           *
           * Entrée valide quand même, parce qu'un champ de texte le promet.
           * Restreint à lui : sur une pastille de couleur, Entrée n'a rien à
           * déclencher, et les flèches y font déjà le travail.
           */
          onKeyDown={(event) => {
            const cible = event.target
            if (
              event.key !== 'Enter' ||
              !(cible instanceof HTMLInputElement) ||
              cible.type !== 'text'
            ) {
              return
            }
            event.preventDefault()
            void soumettre()
          }}
        >
          <ChampsCategorie
            refNom={champNom}
            valeur={brouillon}
            onChange={setBrouillon}
            erreur={soumis ? erreur : null}
            groupeTeinte="teinte-nouvelle-categorie"
          />

          <div className="formulaire__actions">
            <Bouton variante="discret" onClick={fermer}>
              Annuler
            </Bouton>
            <Bouton
              variante="primaire"
              disabled={enregistrement}
              onClick={() => void soumettre()}
            >
              Créer la catégorie
            </Bouton>
          </div>
        </div>
      )}
    </FeuilleBas>
  )
}
