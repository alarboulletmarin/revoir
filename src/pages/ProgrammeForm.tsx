// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { useRetour } from '../state/useRetour'
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
import { cheminInterne } from '../lib/navigation'
import { Champ, GroupeChamp } from '../components/Champ'
import { Bouton } from '../components/Bouton'
import { BarreAction } from '../components/BarreAction'
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
 * Le nom se change toujours ; le rythme, seulement tant qu'aucun sujet ne
 * s'en sert. Les révisions d'un sujet sont écrites à sa création : les
 * rejouer déplacerait des échéances déjà en tête.
 */
export function ProgrammeForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  /*
   * D'où l'on vient, quand ce n'est pas de la liste des rythmes.
   *
   * Composer un rythme au milieu de la création d'un sujet ne doit pas
   * interrompre cette création : on y retourne, et on y retourne avec le
   * rythme qu'on vient de composer. Sans lui, il faudrait le retrouver dans la
   * liste et le désigner à nouveau — alors qu'on venait justement de le
   * construire pour ce sujet-là.
   */
  const [retourVers] = useState(() => cheminInterne(state))
  const { programmes, creerProgramme, modifierProgramme, compterUsages, loading } =
    useDonnees()
  const revenir = useRetour()
  const t = useTextes()

  const titre =
    mode === 'edit' ? t.programmeForm.titreEdition : t.programmeForm.titreCreation
  useTitrePage(titre)

  const existant = mode === 'edit' ? programmes.find((p) => p.id === id) : undefined
  const usages = existant ? compterUsages(existant.id) : 0
  const rythmeFige = usages > 0

  const [nom, setNom] = useState('')
  const [jours, setJours] = useState<number[]>(RYTHME_INITIAL)
  const [soumis, setSoumis] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)

  // Les programmes arrivent de façon asynchrone, comme les sujets.
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

  /*
   * Au plafond, une graduation de plus ne remplace rien en silence : jusqu'ici
   * le `slice` faisait disparaître la plus lointaine sans un mot, et le geste
   * semblait n'avoir servi à rien. On refuse l'ajout, et la phrase sous les
   * graduations dit pourquoi.
   */
  const plein = jours.length >= RYTHME_MAX_REVISIONS

  const basculer = (jour: number) => {
    setJours((actuels) => {
      if (actuels.includes(jour)) {
        return actuels.filter((candidat) => candidat !== jour)
      }
      if (actuels.length >= RYTHME_MAX_REVISIONS) return actuels
      return [...actuels, jour].sort((a, b) => a - b)
    })
  }

  const erreurNom =
    nom.trim() === ''
      ? t.programmeForm.erreurNom
      : programmes.some(
            (programme) =>
              programme.id !== existant?.id &&
              programme.label.toLocaleLowerCase('fr') === nom.trim().toLocaleLowerCase('fr'),
          )
        ? t.programmeForm.erreurHomonyme
        : null

  const erreurRythme = jours.length === 0 ? t.programmeForm.erreurRythme : null

  if (mode === 'edit' && !existant) {
    return loading ? (
      <p className="discret">{t.commun.chargement}</p>
    ) : (
      <p className="discret">{t.programmeForm.introuvable}</p>
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
        navigate('/programmes', { replace: true })
      } else {
        const cree = await creerProgramme(nom, jours)
        navigate(retourVers ?? '/programmes', {
          replace: true,
          state: retourVers === null ? undefined : { programmeCree: cree.id },
        })
      }
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <>
      {/*
        La question en titre, pas le nom de l'écran. « Composer un rythme » dit
        ce qu'on fait ; « Quand la révision revient-elle ? » dit à quoi on
        répond, et c'est ce qu'on a besoin de lire pour toucher la première
        graduation.
      */}
      <div className="page__entete">
        <h1 className="titre-page">
          {rythmeFige ? titre : t.programmeForm.question}
        </h1>
        {!rythmeFige && <p className="page__intro">{t.programmeForm.aideQuestion}</p>}
      </div>

      <form className="formulaire formulaire--barre" onSubmit={soumettre} noValidate>
        {rythmeFige ? (
          <GroupeChamp legende={t.programmeForm.rythme}>
            <div className="rythme__apercu">
              <Frise
                origine={todayKey()}
                reviews={reviewsDepuisOffsets('apercu', todayKey(), existant!.offsets)}
                aujourdhui={todayKey()}
                intitule={t.programmeForm.rythmeIntitule}
              />
              <span className="rythme__jours">
                {t.programmeForm.detailFige(
                  existant!.offsets.length,
                  decrirePortee(existant!.offsets),
                  listerDecalages(existant!.offsets),
                )}
              </span>
            </div>
            <p className="discret discret--petit">
              {t.programmeForm.fige(usages)} {t.programmeForm.figeSuite}
            </p>
          </GroupeChamp>
        ) : (
          <>
            <GroupeChamp legende={t.programmeForm.modeles}>
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
              <legend className="invisible">{t.programmeForm.question}</legend>
              <div className="jours">
                {graduations.map((jour) => {
                  const retenu = jours.includes(jour)
                  const indisponible = plein && !retenu
                  return (
                    <label
                      key={jour}
                      className={
                        retenu
                          ? 'jour jour--actif'
                          : indisponible
                            ? 'jour jour--indisponible'
                            : 'jour'
                      }
                    >
                      <input
                        className="jour__case"
                        type="checkbox"
                        checked={retenu}
                        disabled={indisponible}
                        onChange={() => basculer(jour)}
                      />
                      <span aria-hidden="true">{nommerEcart(jour)}</span>
                      <span className="invisible">{decrireEcart(jour)}</span>
                    </label>
                  )
                })}
              </div>
              {plein && (
                <p className="champ__aide" role="status">
                  {t.programmeForm.plein(RYTHME_MAX_REVISIONS)}
                </p>
              )}
              {soumis && erreurRythme && (
                <p className="champ__erreur">{erreurRythme}</p>
              )}
            </fieldset>

            {/* On choisit un rythme, pas une liste de nombres (section 8.7). */}
            {jours.length > 0 && (
              <section className="apercu">
                <h2 className="section__titre">{t.programmeForm.resultat}</h2>
                <Frise
                  origine={todayKey()}
                  reviews={reviewsDepuisOffsets('apercu', todayKey(), jours)}
                  aujourdhui={todayKey()}
                  libelles="decalage"
                  intitule={t.programmeForm.apercuIntitule}
                />
                <p className="rythme__jours">
                  {t.programmeForm.resume(jours.length, decrirePortee(jours))}
                </p>
              </section>
            )}
          </>
        )}

        {/*
          Le nom en dernier, et pas en premier : on nomme un rythme qu'on vient
          de composer. Ouvrir sur un champ « Nom du programme » demande de
          baptiser quelque chose qui n'existe pas encore.
        */}
        <Champ
          label={t.programmeForm.champNom}
          type="text"
          value={nom}
          maxLength={40}
          autoComplete="off"
          onChange={(event) => setNom(event.target.value)}
          erreur={soumis ? erreurNom : null}
          aide={t.programmeForm.aideNom}
        />

        <BarreAction
          sortie={{ libelle: t.commun.annuler, onClick: revenir }}
          action={{
            libelle: mode === 'edit' ? t.commun.enregistrer : t.programmeForm.creer,
            type: 'submit',
            desactivee: enregistrement,
          }}
        />
      </form>
    </>
  )
}
