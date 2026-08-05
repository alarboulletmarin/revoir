import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { usePanneauOuvert, useTitrePage } from '../state/useTitrePage'
import {
  DEFAULT_SCHEDULE,
  buildReviews,
  getSchedule,
  listerDecalages,
  previewDates,
} from '../lib/schedules'
import { formatShort, todayKey } from '../lib/dates'
import { chargeParDate } from '../lib/stats'
import type { ScheduleId } from '../types'
import { Champ, ChampDate, GroupeChamp } from '../components/Champ'
import { Bouton } from '../components/Bouton'
import { Frise } from '../components/Frise'
import { SelecteurCategorie } from '../components/SelecteurCategorie'

/**
 * Ce qu'une duplication transmet au formulaire de création.
 *
 * La date de départ n'en fait pas partie : dupliquer, c'est reprendre le
 * chapitre suivant, pas rejouer les échéances du précédent. Elle vaut donc
 * aujourd'hui, comme pour toute création.
 */
export interface ModeleSujet {
  titre: string
  categoryId: string | null
  scheduleId: ScheduleId
  /** Le sujet d'origine, pour le dire à l'écran. */
  depuis: string
}

/**
 * L'état d'historique est une donnée extérieure : il survit au rechargement,
 * se conserve dans le `sessionStorage` du navigateur et s'écrit à la main. On
 * le relit comme on relit une sauvegarde, plutôt que de le croire sur parole.
 */
function modeleDepuis(state: unknown): ModeleSujet | null {
  if (typeof state !== 'object' || state === null) return null
  const modele = (state as { modele?: unknown }).modele
  if (typeof modele !== 'object' || modele === null) return null
  const { titre, categoryId, scheduleId, depuis } = modele as Record<string, unknown>
  if (typeof titre !== 'string' || typeof scheduleId !== 'string') return null
  return {
    titre,
    categoryId: typeof categoryId === 'string' ? categoryId : null,
    scheduleId,
    depuis: typeof depuis === 'string' ? depuis : titre,
  }
}

export function SujetForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [modele] = useState(() => (mode === 'create' ? modeleDepuis(state) : null))
  const {
    topics,
    reviews,
    categories,
    creerCategorie,
    loading,
    createTopic,
    editTopic,
    programmes,
    programmesDisponibles,
  } = useDonnees()

  useTitrePage(mode === 'edit' ? 'Modifier le sujet' : 'Nouveau sujet')

  const existant = mode === 'edit' ? topics.find((topic) => topic.id === id) : undefined

  const [titre, setTitre] = useState(modele?.titre ?? '')
  const [categorieId, setCategorieId] = useState<string | null>(
    modele?.categoryId ?? null,
  )
  const [depart, setDepart] = useState(todayKey)
  const [programme, setProgramme] = useState<ScheduleId>(
    modele?.scheduleId ?? DEFAULT_SCHEDULE,
  )
  const [soumis, setSoumis] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)
  const [feuille, setFeuille] = useState(false)

  // Une feuille modale est ouverte : le FAB s'efface et la page ne défile plus
  // derrière elle (section 7.3).
  usePanneauOuvert(feuille)

  /*
   * Les sujets arrivent de façon asynchrone : on remplit le formulaire dès que
   * le sujet visé est disponible.
   *
   * `existant` seul en dépendance : la liste des catégories n'entre plus dans
   * le calcul, et l'y laisser ferait réécrire le champ à chaque création depuis
   * la feuille — la catégorie qu'on vient de choisir serait aussitôt reperdue.
   */
  useEffect(() => {
    if (!existant) return
    setTitre(existant.title)
    setCategorieId(existant.categoryId)
    setDepart(existant.startDate)
    setProgramme(existant.scheduleId)
  }, [existant])

  /**
   * Règle métier n°4 : l'aperçu montre les dates générées **et** la charge
   * déjà planifiée sur chacune. C'est ce qui distingue l'app d'un simple
   * générateur de dates.
   */
  const apercu = useMemo(() => {
    if (depart === '') return []
    const { offsets } = getSchedule(programme, programmes)
    const dates = previewDates(depart, programme, programmes)
    const charge = chargeParDate(topics, reviews, dates, existant?.id)
    return dates.map((date, index) => ({
      offset: offsets[index],
      date,
      charge: charge.get(date) ?? 0,
    }))
  }, [depart, programme, programmes, topics, reviews, existant?.id])

  const erreurTitre = titre.trim() === '' ? 'Le titre est obligatoire.' : null
  const erreurDate = depart === '' ? 'La date de départ est obligatoire.' : null

  if (mode === 'edit' && !existant) {
    return loading ? (
      <p className="discret">Chargement…</p>
    ) : (
      <p className="discret">Ce sujet n'existe pas ou plus.</p>
    )
  }

  const soumettre = async (event: FormEvent) => {
    event.preventDefault()
    setSoumis(true)
    if (erreurTitre || erreurDate || enregistrement) return

    setEnregistrement(true)
    const brouillon = {
      title: titre,
      categoryId: categorieId,
      startDate: depart,
      scheduleId: programme,
    }
    try {
      if (mode === 'edit' && existant) {
        await editTopic(existant.id, brouillon)
        navigate(`/sujet/${existant.id}`, { replace: true })
      } else {
        const cree = await createTopic(brouillon)
        navigate(`/sujet/${cree.id}`, { replace: true })
      }
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <>
      <h1 className="page__titre">
        {mode === 'edit' ? 'Modifier le sujet' : 'Nouveau sujet'}
      </h1>

      {/*
        Ce qui a été repris, et ce qui ne l'a pas été. Sans cette phrase, un
        formulaire pré-rempli laisse croire qu'on modifie le sujet d'origine.
      */}
      {modele && (
        <p className="page__intro">
          Dupliqué depuis « {modele.depuis} ». Le titre, la catégorie et le
          programme sont repris ; la date de départ est celle d'aujourd'hui.
        </p>
      )}

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

        {/*
          On désigne une catégorie, on ne la tape plus. La couleur, elle,
          appartient à la catégorie et se règle là où elle vit — la poser sous
          ce champ laisserait croire qu'elle appartient au sujet.
        */}
        <SelecteurCategorie
          categories={categories}
          valeur={categorieId}
          onChange={setCategorieId}
          onCreer={creerCategorie}
          onFeuille={setFeuille}
        />

        <ChampDate
          label="Date de départ"
          intitule="Choisir la date de départ"
          value={depart}
          onChange={setDepart}
          erreur={soumis ? erreurDate : null}
        />

        <GroupeChamp legende="Programme">
          <div className="programmes">
            {programmesDisponibles.map((option) => (
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
                    {option.offsets.length} révisions · {option.description}
                  </span>
                </span>
                {/* On choisit un rythme, pas un mot (section 8.7). */}
                <Frise
                  origine={depart || todayKey()}
                  reviews={buildReviews(
                    'apercu',
                    depart || todayKey(),
                    option.id,
                    programmes,
                  )}
                  aujourdhui={depart || todayKey()}
                  variante="mini"
                  intitule={`Programme ${option.label}`}
                />
                {/*
                  Les jours écrits sous la frise : sous 480px elle n'a pas de
                  libellés, et c'est alors la seule façon de lire le rythme.
                */}
                <span className="programme__jours">
                  {listerDecalages(option.offsets)}
                </span>
              </label>
            ))}
          </div>
        </GroupeChamp>

        {apercu.length > 0 && (
          <section className="apercu">
            <h2 className="section__titre">Dates générées</h2>

            <Frise
              origine={depart}
              reviews={buildReviews('apercu', depart, programme, programmes)}
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
            {mode === 'edit' ? 'Modifier le sujet' : 'Créer le sujet'}
          </Bouton>
        </div>
      </form>
    </>
  )
}
