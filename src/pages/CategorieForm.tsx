// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Création et modification d'une catégorie.
 *
 * Un nom et une couleur, et les deux se changent toujours : contrairement au
 * rythme d'un programme, rien n'est écrit ailleurs qui dépendrait d'eux. Les
 * sujets désignent la catégorie par identifiant — la renommer une fois la
 * renomme partout, la recolorer recolore chaque chip, chaque pastille et
 * chaque point du calendrier.
 *
 * Un homonyme est refusé. Tant que la catégorie naissait d'une saisie, « maths »
 * rejoignait « Maths » ; maintenant qu'on la crée sciemment, la même égalité
 * sert à refuser le doublon — deux catégories qui ne se distinguent que par une
 * majuscule seraient deux couleurs pour une seule idée.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { useRetour } from '../state/useRetour'
import { categorieHomonyme } from '../lib/categories'
import { Bouton } from '../components/Bouton'
import {
  ChampsCategorie,
  type BrouillonCategorie,
} from '../components/ChampsCategorie'

export function CategorieForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { categories, creerCategorie, modifierCategorie, loading } = useDonnees()
  const revenir = useRetour()
  const t = useTextes()

  const titre =
    mode === 'edit' ? t.categories.titreEdition : t.categories.titreCreation
  useTitrePage(titre)

  const existante =
    mode === 'edit' ? categories.find((categorie) => categorie.id === id) : undefined

  const [brouillon, setBrouillon] = useState<BrouillonCategorie>({
    nom: '',
    teinte: null,
  })
  const [soumis, setSoumis] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)

  // Les catégories arrivent de façon asynchrone, comme les sujets.
  useEffect(() => {
    if (!existante) return
    setBrouillon({ nom: existante.name, teinte: existante.tint })
  }, [existante])

  const propre = brouillon.nom.trim()
  const erreurNom =
    propre === ''
      ? t.categories.erreurNom
      : categorieHomonyme(propre, categories, existante?.id)
        ? t.categories.erreurHomonyme
        : null

  if (mode === 'edit' && !existante) {
    return loading ? (
      <p className="discret">{t.commun.chargement}</p>
    ) : (
      <p className="discret">{t.categories.introuvable}</p>
    )
  }

  const soumettre = async (event: FormEvent) => {
    event.preventDefault()
    setSoumis(true)
    if (erreurNom || enregistrement) return

    setEnregistrement(true)
    try {
      if (mode === 'edit' && existante) {
        await modifierCategorie(existante.id, propre, brouillon.teinte)
      } else {
        await creerCategorie(propre, brouillon.teinte)
      }
      navigate('/categories', { replace: true })
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <>
      <h1 className="page__titre">{titre}</h1>

      <form className="formulaire" onSubmit={soumettre} noValidate>
        <ChampsCategorie
          valeur={brouillon}
          onChange={setBrouillon}
          erreur={soumis ? erreurNom : null}
          groupeTeinte="teinte-categorie"
        />

        <div className="formulaire__actions">
          <Bouton variante="discret" onClick={revenir}>
            {t.commun.annuler}
          </Bouton>
          <Bouton variante="primaire" type="submit" disabled={enregistrement}>
            {mode === 'edit'
              ? t.categories.modifierBouton
              : t.categories.creerBouton}
          </Bouton>
        </div>
      </form>
    </>
  )
}
