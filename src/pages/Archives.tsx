// SPDX-License-Identifier: AGPL-3.0-only

import { Link } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { archivedTopics } from '../lib/sujets'
import { ChipCategorie } from '../components/ChipCategorie'
import { Bouton } from '../components/Bouton'
import { Gabarit } from '../components/Etats'

/**
 * Les sujets archivés.
 *
 * Archiver n'est pas supprimer : le sujet sort des listes, garde ses
 * révisions, et revient entier. C'est le seul écran où on le retrouve, et il
 * n'a rien à faire au milieu des réglages — on n'y vient pas régler quelque
 * chose, on y vient chercher un sujet.
 */
export function Archives() {
  const t = useTextes()
  useTitrePage(t.reglages.archives.titre)
  const { topics, categories, setArchived, loading } = useDonnees()

  if (loading) return <Gabarit lignes={3} />

  const archives = archivedTopics(topics)

  return (
    <>
      <div className="page__entete">
        <h1 className="titre-page">{t.reglages.archives.titre}</h1>
      </div>

      {archives.length === 0 ? (
        <p className="discret">{t.reglages.archives.aucun}</p>
      ) : (
        <ul className="liste-reglee">
          {archives.map((topic) => (
            <li key={topic.id} className="archive">
              <Link to={`/sujet/${topic.id}`} className="archive__corps">
                <span className="archive__titre">{topic.title}</span>
                <ChipCategorie
                  categorie={
                    categories.find((candidat) => candidat.id === topic.categoryId) ?? null
                  }
                />
              </Link>
              <Bouton variante="discret" onClick={() => setArchived(topic.id, false)}>
                {t.reglages.archives.desarchiver}
              </Bouton>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
