import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { useTitrePage } from '../state/useTitrePage'
import {
  ECHELLE_RYTHME,
  RYTHME_MAX_REVISIONS,
  SCHEDULES,
  decrireEcart,
  decrirePortee,
  listerDecalages,
  nommerEcart,
  reviewsDepuisOffsets,
} from '../lib/schedules'
import { todayKey } from '../lib/dates'
import { Champ, GroupeChamp } from '../components/Champ'
import { Bouton } from '../components/Bouton'
import { Frise } from '../components/Frise'

/** Le rythme proposé d'emblée : celui de « Simple ». */
const RYTHME_INITIAL = SCHEDULES[0].offsets

/**
 * Création et modification d'un programme.
 *
 * Un rythme ne se tape pas, il se compose : on touche des graduations, comme
 * on lit une règle. Chacune porte son écart dans son unité naturelle — « 1
 * sem. », « 3 mois », « 1 an » —, et la frise se redessine à chaque geste.
 * Rien n'oblige à savoir ce qu'est un « J+14 » pour s'en servir.
 *
 * L'écran s'ouvre sur le rythme de « Simple » plutôt que sur du vide :
 * personne n'invente un rythme de répétition espacée depuis rien, on part de
 * ce qui marche et on l'ajuste.
 *
 * Le nom se change toujours ; le rythme, seulement tant qu'aucun élément ne
 * s'en sert. Les révisions d'un élément sont écrites à sa création : les
 * rejouer déplacerait des échéances déjà en tête.
 */
export function ProgrammeForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { programmes, creerProgramme, modifierProgramme, compterUsages, loading } =
    useItems()

  useTitrePage(mode === 'edit' ? 'Modifier le programme' : 'Nouveau programme')

  const existant = mode === 'edit' ? programmes.find((p) => p.id === id) : undefined
  const usages = existant ? compterUsages(existant.id) : 0
  const rythmeFige = usages > 0

  const [nom, setNom] = useState('')
  const [jours, setJours] = useState<number[]>(RYTHME_INITIAL)
  const [soumis, setSoumis] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)

  // Les programmes arrivent de façon asynchrone, comme les éléments.
  useEffect(() => {
    if (!existant) return
    setNom(existant.label)
    setJours(existant.offsets)
  }, [existant])

  /*
   * L'échelle, plus les écarts déjà retenus qui n'y figurent pas : un rythme
   * importé ou créé par une version antérieure reste modifiable, sa graduation
   * vient simplement se ranger à sa place.
   */
  const graduations = useMemo(
    () => [...new Set([...ECHELLE_RYTHME, ...jours])].sort((a, b) => a - b),
    [jours],
  )

  const basculer = (jour: number) => {
    setJours((actuels) =>
      actuels.includes(jour)
        ? actuels.filter((candidat) => candidat !== jour)
        : [...actuels, jour].sort((a, b) => a - b).slice(0, RYTHME_MAX_REVISIONS),
    )
  }

  const erreurNom =
    nom.trim() === ''
      ? 'Le nom est obligatoire.'
      : programmes.some(
            (programme) =>
              programme.id !== existant?.id &&
              programme.label.toLocaleLowerCase('fr') === nom.trim().toLocaleLowerCase('fr'),
          )
        ? 'Un programme porte déjà ce nom.'
        : null

  const erreurRythme = jours.length === 0 ? 'Choisissez au moins une échéance.' : null

  if (mode === 'edit' && !existant) {
    return loading ? (
      <p className="discret">Chargement…</p>
    ) : (
      <p className="discret">Ce programme n'existe pas ou plus.</p>
    )
  }

  const soumettre = async (event: FormEvent) => {
    event.preventDefault()
    setSoumis(true)
    if (erreurNom || erreurRythme || enregistrement) return

    setEnregistrement(true)
    try {
      if (mode === 'edit' && existant) {
        await modifierProgramme(existant.id, nom, rythmeFige ? existant.offsets : jours)
      } else {
        await creerProgramme(nom, jours)
      }
      navigate('/reglages', { replace: true })
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <>
      <h1 className="page__titre">
        {mode === 'edit' ? 'Modifier le programme' : 'Nouveau programme'}
      </h1>

      <form className="formulaire" onSubmit={soumettre} noValidate>
        <Champ
          label="Nom du programme"
          type="text"
          value={nom}
          maxLength={40}
          autoComplete="off"
          onChange={(event) => setNom(event.target.value)}
          erreur={soumis ? erreurNom : null}
          aide="Par exemple : Examen blanc, Vocabulaire, Permis."
        />

        {rythmeFige ? (
          <GroupeChamp legende="Rythme">
            <div className="rythme__apercu">
              <Frise
                origine={todayKey()}
                reviews={reviewsDepuisOffsets(todayKey(), existant!.offsets)}
                aujourdhui={todayKey()}
                intitule="Rythme du programme"
              />
              <span className="rythme__jours">
                {existant!.offsets.length} révision
                {existant!.offsets.length > 1 ? 's' : ''} ·{' '}
                {decrirePortee(existant!.offsets)} ·{' '}
                {listerDecalages(existant!.offsets)}
              </span>
            </div>
            <p className="discret discret--petit">
              {usages > 1
                ? `${usages} éléments suivent ce programme : leurs révisions sont déjà planifiées, le rythme ne peut plus changer.`
                : 'Un élément suit ce programme : ses révisions sont déjà planifiées, le rythme ne peut plus changer.'}{' '}
              Le nom, lui, se modifie librement.
            </p>
          </GroupeChamp>
        ) : (
          <>
            <GroupeChamp legende="Partir d'un rythme connu">
              <div className="rythme__modeles">
                {SCHEDULES.map((modele) => (
                  <Bouton
                    key={modele.id}
                    variante="discret"
                    onClick={() => setJours(modele.offsets)}
                  >
                    {modele.label}
                  </Bouton>
                ))}
              </div>
            </GroupeChamp>

            <fieldset className="champ">
              <legend className="champ__label">Quand la révision revient-elle ?</legend>
              <p className="champ__aide">
                Touchez les échéances à garder. Elles se comptent à partir du jour de
                départ.
              </p>
              <div className="jours">
                {graduations.map((jour) => {
                  const retenu = jours.includes(jour)
                  return (
                    <label
                      key={jour}
                      className={retenu ? 'jour jour--actif' : 'jour'}
                    >
                      <input
                        className="jour__case"
                        type="checkbox"
                        checked={retenu}
                        onChange={() => basculer(jour)}
                      />
                      <span aria-hidden="true">{nommerEcart(jour)}</span>
                      <span className="invisible">{decrireEcart(jour)}</span>
                    </label>
                  )
                })}
              </div>
              {soumis && erreurRythme && (
                <p className="champ__erreur">{erreurRythme}</p>
              )}
            </fieldset>

            {/* On choisit un rythme, pas une liste de nombres (section 8.7). */}
            {jours.length > 0 && (
              <section className="apercu">
                <h2 className="section__titre">Le rythme obtenu</h2>
                <Frise
                  origine={todayKey()}
                  reviews={reviewsDepuisOffsets(todayKey(), jours)}
                  aujourdhui={todayKey()}
                  libelles="decalage"
                  intitule="Aperçu du rythme"
                />
                <p className="rythme__jours">
                  {jours.length} révision{jours.length > 1 ? 's' : ''} ·{' '}
                  {decrirePortee(jours)}
                </p>
              </section>
            )}
          </>
        )}

        <div className="formulaire__actions">
          <Bouton variante="discret" onClick={() => navigate(-1)}>
            Annuler
          </Bouton>
          <Bouton variante="primaire" type="submit" disabled={enregistrement}>
            {mode === 'edit' ? 'Enregistrer' : 'Créer le programme'}
          </Bouton>
        </div>
      </form>
    </>
  )
}
