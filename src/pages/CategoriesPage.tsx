// SPDX-License-Identifier: AGPL-3.0-only

/**
 * L'écran des catégories.
 *
 * Une catégorie s'y crée, s'y renomme, s'y recolore et s'y supprime. Elle vit
 * indépendamment de ses sujets : jusqu'ici elle naissait d'un mot tapé dans le
 * formulaire d'un sujet et disparaissait dès que plus aucun ne la portait, ce
 * qui interdisait de la préparer, de la renommer ou de la garder vide.
 *
 * Là où un programme suivi refuse d'être supprimé — une fiche n'aurait plus de
 * rythme à nommer —, une catégorie portée se supprime toujours : ses sujets
 * rejoignent « Sans catégorie », qui est un état normal du modèle. Aucun sujet
 * n'est perdu, et la boîte de confirmation dit combien sont concernés.
 */
import { useState } from 'react'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { textes } from '../i18n'
import { categorieHomonyme, propositionsCategories } from '../lib/categories'
import { categoriesTriees, compterSujets } from '../lib/sujets'
import { Bouton, LienBouton } from '../components/Bouton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PastilleCategorie } from '../components/ChipCategorie'
import type { Category } from '../types'

/** Combien de sujets, en toutes lettres. Le zéro se dit, il ne se chiffre pas. */
function direSujets(nombre: number): string {
  return nombre === 0
    ? textes().categories.aucunSujet
    : textes().commun.sujets(nombre)
}

export function CategoriesPage() {
  const t = useTextes()
  useTitrePage(t.categories.titre)
  const { categories, topics, creerCategorie, supprimerCategorie } = useDonnees()
  const [visee, setVisee] = useState<Category | null>(null)
  const [retour, setRetour] = useState<string | null>(null)

  const rangees = categoriesTriees(categories)

  /*
   * Le rattrapage des installations qui existaient avant les catégories
   * livrées : le semis ne touche qu'une base neuve (voir `db/database.ts`), et
   * arriver sur un écran vide sans rien à quoi se raccrocher n'apprend rien.
   * On ne rajoute que ce qui manque — un homonyme resterait un doublon.
   */
  const ajouterProposees = async () => {
    const manquantes = propositionsCategories().filter(
      ({ name }) => categorieHomonyme(name, categories) === null,
    )
    for (const { name, tint } of manquantes) {
      await creerCategorie(name, tint)
    }
    setRetour(t.categories.ajoutees(manquantes.length))
  }

  const confirmerSuppression = () => {
    if (!visee) return
    const nom = visee.name
    void supprimerCategorie(visee.id).then(() => {
      setRetour(t.categories.supprimee(nom))
    })
    setVisee(null)
  }

  const portes = visee ? compterSujets(visee.id, topics) : 0

  return (
    <>
      <div className="page__entete">
        <h1 className="titre-page">{t.categories.titre}</h1>
        <p className="page__intro">{t.categories.intro}</p>
      </div>

      {retour && (
        <p className="banniere banniere--fait" role="status">
          {retour}
        </p>
      )}

      {rangees.length === 0 ? (
        <div className="etat-vide">
          <p className="discret">{t.categories.aucune}</p>
          <div className="reglages__actions">
            <LienBouton vers="/categories/nouvelle" variante="primaire">
              {t.categories.creer}
            </LienBouton>
            <Bouton onClick={() => void ajouterProposees()}>
              {t.categories.ajouterProposees}
            </Bouton>
          </div>
        </div>
      ) : (
        <>
          <ul className="categories">
            {rangees.map((categorie) => {
              const sujets = compterSujets(categorie.id, topics)
              return (
                <li key={categorie.id} className="categorie">
                  <span className="categorie__nom">
                    <PastilleCategorie categorie={categorie} />
                    {categorie.name}
                  </span>
                  <span className="categorie__compte">{direSujets(sujets)}</span>
                  {/*
                    « Modifier » toujours ; « Supprimer » seulement sur une
                    catégorie que personne ne porte.
                    
                    Supprimer une catégorie portée reste possible et sans danger
                    — ses sujets rejoignent « Sans catégorie » —, mais ce n'est
                    pas le même geste : il en touche d'autres, il se confirme, et
                    il n'a rien à faire au même niveau qu'un renommage, sur une
                    rangée qu'on parcourt du pouce. Il se fait depuis l'écran de
                    la catégorie, où l'on est venu s'en occuper.
                  */}
                  <span className="categorie__actions">
                    <LienBouton
                      vers={`/categories/${categorie.id}/modifier`}
                      variante="texte"
                    >
                      {t.commun.modifier}
                    </LienBouton>
                    {sujets === 0 && (
                      <Bouton variante="texte" onClick={() => setVisee(categorie)}>
                        {t.commun.supprimer}
                      </Bouton>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="reglages__actions">
            <LienBouton vers="/categories/nouvelle">{t.categories.creer}</LienBouton>
          </div>
        </>
      )}

      <ConfirmDialog
        open={visee !== null}
        title={visee ? t.categories.confirmerSuppression(visee.name) : ''}
        message={
          portes === 0
            ? t.categories.detailAucunSujet
            : t.categories.detailSujets(portes)
        }
        confirmLabel={t.commun.supprimer}
        danger
        onCancel={() => setVisee(null)}
        onConfirm={confirmerSuppression}
      />
    </>
  )
}
