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
import { CATEGORIES_PROPOSEES, categorieHomonyme } from '../lib/categories'
import { categoriesTriees, compterSujets } from '../lib/sujets'
import { Bouton, LienBouton } from '../components/Bouton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PastilleCategorie } from '../components/ChipCategorie'
import type { Category } from '../types'

/** Combien de sujets, en toutes lettres. Le zéro se dit, il ne se chiffre pas. */
function direSujets(nombre: number): string {
  if (nombre === 0) return 'Aucun sujet'
  return `${nombre} sujet${nombre > 1 ? 's' : ''}`
}

export function CategoriesPage() {
  useTitrePage('Catégories')
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
    const manquantes = CATEGORIES_PROPOSEES.filter(
      ({ name }) => categorieHomonyme(name, categories) === null,
    )
    for (const { name, tint } of manquantes) {
      await creerCategorie(name, tint)
    }
    setRetour(
      `${manquantes.length} catégorie${manquantes.length > 1 ? 's' : ''} ajoutée${manquantes.length > 1 ? 's' : ''}.`,
    )
  }

  const confirmerSuppression = () => {
    if (!visee) return
    const nom = visee.name
    void supprimerCategorie(visee.id).then(() => {
      setRetour(`Catégorie « ${nom} » supprimée.`)
    })
    setVisee(null)
  }

  const portes = visee ? compterSujets(visee.id, topics) : 0

  return (
    <>
      <h1 className="page__titre">Catégories</h1>
      <p className="discret">
        Une catégorie regroupe des sujets. Sa couleur lui appartient : la changer ici
        la change partout où la catégorie apparaît.
      </p>

      {retour && (
        <p className="banniere banniere--fait" role="status">
          {retour}
        </p>
      )}

      {rangees.length === 0 ? (
        <div className="etat-vide">
          <p className="discret">Aucune catégorie pour le moment.</p>
          <div className="reglages__actions">
            <LienBouton vers="/categories/nouvelle" variante="primaire">
              Créer une catégorie
            </LienBouton>
            <Bouton onClick={() => void ajouterProposees()}>
              Ajouter les catégories proposées
            </Bouton>
          </div>
        </div>
      ) : (
        <>
          <ul className="categories">
            {rangees.map((categorie) => (
              <li key={categorie.id} className="categorie">
                <div className="categorie__entete">
                  <span className="categorie__nom">
                    <PastilleCategorie categorie={categorie} />
                    {categorie.name}
                  </span>
                  <span className="categorie__compte">
                    {direSujets(compterSujets(categorie.id, topics))}
                  </span>
                </div>
                <div className="categorie__actions">
                  <LienBouton vers={`/categories/${categorie.id}/modifier`}>
                    Modifier
                  </LienBouton>
                  <Bouton variante="danger" onClick={() => setVisee(categorie)}>
                    Supprimer
                  </Bouton>
                </div>
              </li>
            ))}
          </ul>

          <div className="reglages__actions">
            <LienBouton vers="/categories/nouvelle">Créer une catégorie</LienBouton>
          </div>
        </>
      )}

      <ConfirmDialog
        open={visee !== null}
        title={visee ? `Supprimer « ${visee.name} » ?` : ''}
        message={
          portes === 0
            ? 'Cette catégorie ne porte aucun sujet.'
            : `${portes === 1 ? 'Son sujet passera' : `Ses ${portes} sujets passeront`} sans catégorie. ${portes === 1 ? 'Il' : 'Ils'} ne ${portes === 1 ? 'sera' : 'seront'} pas supprimé${portes === 1 ? '' : 's'}.`
        }
        confirmLabel="Supprimer"
        danger
        onCancel={() => setVisee(null)}
        onConfirm={confirmerSuppression}
      />
    </>
  )
}
