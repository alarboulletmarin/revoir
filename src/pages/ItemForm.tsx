import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { useTitrePage } from '../state/useTitrePage'
import {
  DEFAULT_SCHEDULE,
  SCHEDULES,
  buildReviews,
  previewDates,
} from '../lib/schedules'
import { formatShort, todayKey } from '../lib/dates'
import { chargeParDate, usedCategories } from '../lib/stats'
import type { ScheduleId } from '../types'
import { Champ, GroupeChamp } from '../components/Champ'
import { Bouton } from '../components/Bouton'
import { Frise } from '../components/Frise'

const CATEGORIES_SUGGEREES = [
  'Études',
  'Travail',
  'Développement',
  'Langues',
  'Lecture',
  'Personnel',
  'Autre',
]

export function ItemForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, loading, createItem, editItem } = useItems()
  const listeCategories = useId()

  useTitrePage(mode === 'edit' ? "Modifier l'élément" : 'Nouvel élément')

  const existant = mode === 'edit' ? items.find((item) => item.id === id) : undefined

  const [titre, setTitre] = useState('')
  const [categorie, setCategorie] = useState('')
  const [depart, setDepart] = useState(todayKey)
  const [programme, setProgramme] = useState<ScheduleId>(DEFAULT_SCHEDULE)
  const [soumis, setSoumis] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)

  // Les éléments arrivent de façon asynchrone : on remplit le formulaire dès
  // que l'élément visé est disponible.
  useEffect(() => {
    if (!existant) return
    setTitre(existant.title)
    setCategorie(existant.category)
    setDepart(existant.startDate)
    setProgramme(existant.schedule)
  }, [existant])

  /**
   * Règle métier n°4 : l'aperçu montre les dates générées **et** la charge
   * déjà planifiée sur chacune. C'est ce qui distingue l'app d'un simple
   * générateur de dates.
   */
  const apercu = useMemo(() => {
    if (depart === '') return []
    const dates = previewDates(depart, programme)
    const charge = chargeParDate(items, dates, existant?.id)
    return dates.map((date, index) => ({
      offset: SCHEDULES.find((s) => s.id === programme)!.offsets[index],
      date,
      charge: charge.get(date) ?? 0,
    }))
  }, [depart, programme, items, existant?.id])

  const categories = useMemo(
    () => [...new Set([...usedCategories(items), ...CATEGORIES_SUGGEREES])],
    [items],
  )

  const erreurTitre = titre.trim() === '' ? 'Le titre est obligatoire.' : null
  const erreurDate = depart === '' ? 'La date de départ est obligatoire.' : null

  if (mode === 'edit' && !existant) {
    return loading ? (
      <p className="discret">Chargement…</p>
    ) : (
      <p className="discret">Cet élément n'existe pas ou plus.</p>
    )
  }

  const soumettre = async (event: FormEvent) => {
    event.preventDefault()
    setSoumis(true)
    if (erreurTitre || erreurDate || enregistrement) return

    setEnregistrement(true)
    const brouillon = { title: titre, category: categorie, startDate: depart, schedule: programme }
    try {
      if (mode === 'edit' && existant) {
        await editItem(existant.id, brouillon)
        navigate(`/element/${existant.id}`, { replace: true })
      } else {
        const cree = await createItem(brouillon)
        navigate(`/element/${cree.id}`, { replace: true })
      }
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <>
      <h1 className="page__titre">
        {mode === 'edit' ? "Modifier l'élément" : 'Nouvel élément'}
      </h1>

      <form className="formulaire" onSubmit={soumettre} noValidate>
        <Champ
          label="Titre"
          type="text"
          value={titre}
          maxLength={120}
          autoComplete="off"
          onChange={(event) => setTitre(event.target.value)}
          erreur={soumis ? erreurTitre : null}
        />

        <Champ
          label="Catégorie"
          type="text"
          value={categorie}
          maxLength={60}
          list={listeCategories}
          autoComplete="off"
          onChange={(event) => setCategorie(event.target.value)}
          aide="Facultatif."
        />
        <datalist id={listeCategories}>
          {categories.map((nom) => (
            <option key={nom} value={nom} />
          ))}
        </datalist>

        <Champ
          label="Date de départ"
          type="date"
          value={depart}
          onChange={(event) => setDepart(event.target.value)}
          erreur={soumis ? erreurDate : null}
        />

        <GroupeChamp legende="Programme">
          <div className="programmes">
            {SCHEDULES.map((option) => (
              <label
                key={option.id}
                className={
                  programme === option.id ? 'programme programme--actif' : 'programme'
                }
              >
                <input
                  className="programme__radio"
                  type="radio"
                  name="programme"
                  value={option.id}
                  checked={programme === option.id}
                  onChange={() => setProgramme(option.id)}
                />
                <span className="programme__entete">
                  <span className="programme__nom">{option.label}</span>
                  <span className="programme__compte">
                    {option.offsets.length} révisions
                  </span>
                </span>
                {/* On choisit un rythme, pas un mot (section 8.7). */}
                <Frise
                  origine={depart || todayKey()}
                  reviews={buildReviews(depart || todayKey(), option.id)}
                  aujourdhui={depart || todayKey()}
                  variante="mini"
                  intitule={`Programme ${option.label}`}
                />
              </label>
            ))}
          </div>
        </GroupeChamp>

        {apercu.length > 0 && (
          <section className="apercu">
            <h2 className="section__titre">Dates générées</h2>

            <Frise
              origine={depart}
              reviews={buildReviews(depart, programme)}
              aujourdhui={depart}
              libelles="date"
              intitule="Aperçu du programme"
            />

            <ul className="apercu__dates">
              {apercu.map((ligne) => (
                <li key={ligne.offset} className="apercu__ligne">
                  <span className="apercu__decalage">J+{ligne.offset}</span>
                  <span className="apercu__date">{formatShort(ligne.date)}</span>
                  <span className="apercu__charge">
                    {ligne.charge === 0
                      ? 'rien de prévu'
                      : `déjà ${ligne.charge} révision${ligne.charge > 1 ? 's' : ''}`}
                  </span>
                </li>
              ))}
            </ul>

            {mode === 'edit' && (
              <p className="discret discret--petit">
                Les révisions déjà effectuées restent cochées si leur décalage existe
                toujours dans le programme choisi.
              </p>
            )}
          </section>
        )}

        <div className="formulaire__actions">
          <Bouton variante="discret" onClick={() => navigate(-1)}>
            Annuler
          </Bouton>
          <Bouton variante="primaire" type="submit" disabled={enregistrement}>
            {mode === 'edit' ? "Modifier l'élément" : "Créer l'élément"}
          </Bouton>
        </div>
      </form>
    </>
  )
}
