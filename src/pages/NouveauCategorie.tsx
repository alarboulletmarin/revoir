// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { useBrouillonSujet } from '../state/useBrouillonSujet'
import { comparerTextes } from '../i18n'
import { IconeCoche } from '../components/Icons'
import { PastilleCategorie } from '../components/ChipCategorie'
import { EtapeCreation } from '../components/EtapeCreation'

/**
 * Deuxième question : dans quelle catégorie ?
 *
 * Elle a une sortie — « Passer » —, parce que la catégorie est facultative et
 * qu'un sujet sans catégorie est un état normal, pas un oubli à réparer. La
 * sortie mène à l'étape suivante, pas hors du parcours : passer une question
 * n'est pas abandonner.
 */
export function NouveauCategorie() {
  const t = useTextes()
  useTitrePage(t.creation.categorie.question)
  const navigate = useNavigate()
  const { categories, topics } = useDonnees()
  const { brouillon, majBrouillon } = useBrouillonSujet()

  /** Le nombre de sujets par catégorie : ce qui situe une catégorie, c'est son contenu. */
  const comptes = useMemo(() => {
    const compte = new Map<string, number>()
    for (const topic of topics) {
      if (topic.categoryId === null) continue
      compte.set(topic.categoryId, (compte.get(topic.categoryId) ?? 0) + 1)
    }
    return compte
  }, [topics])

  const listees = useMemo(
    () => [...categories].sort((a, b) => comparerTextes(a.name, b.name)),
    [categories],
  )

  const suivant = () => navigate('/nouveau/rythme')

  return (
    <EtapeCreation
      rang={2}
      question={t.creation.categorie.question}
      intro={
        brouillon.titre.trim() === ''
          ? t.creation.categorie.introSansTitre
          : t.creation.categorie.intro(brouillon.titre.trim())
      }
      sortie={{
        libelle: t.creation.passer,
        onClick: () => {
          majBrouillon({ categoryId: null })
          suivant()
        },
      }}
      action={{ libelle: t.creation.continuer, onClick: suivant }}
    >
      <ul className="choix">
        {listees.map((categorie) => (
          <li key={categorie.id}>
            <button
              type="button"
              className="choix__rangee"
              aria-pressed={brouillon.categoryId === categorie.id}
              onClick={() => majBrouillon({ categoryId: categorie.id })}
            >
              <PastilleCategorie categorie={categorie} />
              <span className="choix__nom">{categorie.name}</span>
              <span className="choix__compte chiffres">
                {t.creation.categorie.compte(comptes.get(categorie.id) ?? 0)}
              </span>
              {/*
                La coche marque la sélection, `aria-pressed` la dit. La couleur
                seule ne suffirait pas — c'est la règle de la section 1, et
                elle vaut aussi pour l'état d'un choix.
              */}
              {brouillon.categoryId === categorie.id && (
                <IconeCoche className="choix__coche" width="18" height="18" />
              )}
            </button>
          </li>
        ))}

        {/*
          « Sans catégorie » est une réponse, pas une absence de réponse : elle
          se choisit comme les autres, en fin de liste parce qu'elle n'est pas
          la plus attendue.
        */}
        <li>
          <button
            type="button"
            className="choix__rangee"
            aria-pressed={brouillon.categoryId === null}
            onClick={() => majBrouillon({ categoryId: null })}
          >
            <span className="pastille pastille--vide" aria-hidden="true" />
            <span className="choix__nom">{t.creation.categorie.aucune}</span>
            {brouillon.categoryId === null && (
              <IconeCoche className="choix__coche" width="18" height="18" />
            )}
          </button>
        </li>
      </ul>

      <p className="etape__lien">
        <Link to="/categories/nouvelle" className="lien">
          {t.creation.categorie.nouvelle}
        </Link>
      </p>

      <p className="discret discret--petit">{t.creation.categorie.note}</p>
    </EtapeCreation>
  )
}
