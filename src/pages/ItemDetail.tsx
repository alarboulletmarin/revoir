import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { useToast } from '../state/useToast'
import { useTitrePage } from '../state/useTitrePage'
import { getSchedule } from '../lib/schedules'
import { formatIsoDate, formatLong, formatRelative, todayKey } from '../lib/dates'
import { itemProgress } from '../lib/stats'
import { Frise } from '../components/Frise'
import { AnneauProgression } from '../components/AnneauProgression'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Bouton, LienBouton } from '../components/Bouton'
import { IconeArchive, IconeCoche, IconeCorbeille } from '../components/Icons'
import { ChipCategorie } from '../components/ChipCategorie'

export function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    items,
    teintes,
    loading,
    valider,
    devalider,
    restaurer,
    setArchived,
    removeItem,
    programmes,
  } = useItems()
  const { afficherToast } = useToast()
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const aujourdhui = todayKey()

  const item = items.find((candidat) => candidat.id === id)
  useTitrePage(item?.title ?? 'Élément')

  if (!item) {
    return loading ? (
      <p className="discret">Chargement…</p>
    ) : (
      <div className="etat-vide">
        <p className="discret">Cet élément n'existe pas ou plus.</p>
        <LienBouton vers="/" variante="discret">
          Retour au tableau de bord
        </LienBouton>
      </div>
    )
  }

  const programme = getSchedule(item.schedule, programmes)
  const faites = item.reviews.filter((review) => review.done).length
  const restantes = item.reviews.length - faites
  const creeLe = formatIsoDate(item.createdAt)

  const basculer = (offset: number, faite: boolean) => {
    if (faite) {
      devalider(item.id, offset)
      return
    }
    const effet = valider(item.id, offset)
    if (!effet) return
    afficherToast({
      texte: 'Révision enregistrée',
      detail: effet.deplacees > 0 ? 'Prochaines dates ajustées' : undefined,
      action: { libelle: 'Annuler', onAction: () => restaurer(effet.precedent) },
    })
  }

  const archiver = () => {
    setArchived(item.id, !item.archived)
    afficherToast({
      texte: item.archived ? 'Élément désarchivé' : 'Élément archivé',
      action: {
        libelle: 'Annuler',
        onAction: () => setArchived(item.id, item.archived),
      },
    })
  }

  return (
    <>
      <div className="fiche__entete">
        <h1 className="page__titre">{item.title}</h1>
        <div className="fiche__badges">
          <ChipCategorie categorie={item.category} teintes={teintes} />
          <span className="chip chip--accent">{programme.label}</span>
          {item.archived && <span className="chip chip--retard">Archivé</span>}
        </div>
        {creeLe && <p className="page__intro">Créé le {creeLe}</p>}
      </div>

      {/* La frise en grand, avec ses libellés : c'est ici qu'elle se lit. */}
      <section className="fiche__bloc">
        <h2 className="section__titre">Programme</h2>
        <Frise
          origine={item.startDate}
          reviews={item.reviews}
          aujourdhui={aujourdhui}
          libelles="decalage"
          intitule={item.title}
        />
        <div className="restantes">
          <AnneauProgression
            part={itemProgress(item) / 100}
            label={`Progression : ${itemProgress(item)} %`}
          />
          <p className="discret discret--petit chiffres" aria-live="polite">
            {faites} révision{faites > 1 ? 's' : ''} effectuée{faites > 1 ? 's' : ''} ·{' '}
            {restantes} restante{restantes > 1 ? 's' : ''}
          </p>
        </div>
      </section>

      <section className="fiche__bloc">
        <h2 className="section__titre">Échéances</h2>
        <p className="discret discret--petit">
          Départ le {formatLong(item.startDate)}
        </p>
        <ul className="liste-revisions">
          {item.reviews.map((review) => {
            const enRetard = !review.done && review.date < aujourdhui
            const classes = ['echeance', review.done ? 'echeance--faite' : null]
              .filter(Boolean)
              .join(' ')

            return (
              <li key={review.offset} className={classes}>
                <button
                  type="button"
                  className="item-revision__case"
                  role="checkbox"
                  aria-checked={review.done}
                  aria-label={`${review.done ? 'Décocher' : 'Marquer comme revu'} la révision J+${review.offset}`}
                  onClick={() => basculer(review.offset, review.done)}
                >
                  <span className="item-revision__cercle">
                    {review.done && <IconeCoche className="item-revision__coche" />}
                  </span>
                </button>

                <div className="echeance__corps">
                  <span className="echeance__titre">
                    J+{review.offset} · {formatLong(review.date)}
                  </span>
                  <span
                    className={
                      review.done
                        ? 'echeance__etat echeance__etat--fait'
                        : enRetard
                          ? 'echeance__etat echeance__etat--retard'
                          : 'echeance__etat'
                    }
                  >
                    {review.done
                      ? 'effectuée'
                      : formatRelative(review.date, aujourdhui)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="fiche__bloc">
        <h2 className="section__titre">Actions</h2>
        <div className="fiche__actions">
          <LienBouton vers={`/element/${item.id}/modifier`} variante="discret">
            Modifier
          </LienBouton>
          <Bouton variante="discret" onClick={archiver}>
            <IconeArchive width="18" height="18" />
            {item.archived ? 'Désarchiver' : 'Archiver'}
          </Bouton>
          <Bouton variante="danger" onClick={() => setConfirmerSuppression(true)}>
            <IconeCorbeille width="18" height="18" />
            Supprimer
          </Bouton>
        </div>
        <p className="discret discret--petit">
          Un élément archivé sort du tableau de bord et du calendrier. Il reste dans
          l'export.
        </p>
      </section>

      {/*
        La seule action qui demande une confirmation (règle métier n°3).
        Les guillemets tiennent leur titre par une espace fine insécable :
        sans elle, un titre long renvoie le guillemet fermant seul à la ligne.
      */}
      <ConfirmDialog
        open={confirmerSuppression}
        title="Supprimer cet élément ?"
        message={`« ${item.title} » et ses ${item.reviews.length} révisions seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmerSuppression(false)}
        onConfirm={() => {
          setConfirmerSuppression(false)
          void removeItem(item.id).then(() => navigate('/', { replace: true }))
        }}
      />
    </>
  )
}
