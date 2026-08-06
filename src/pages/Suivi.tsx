// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PracticeStatus, Review } from '../types'
import { useDonnees } from '../state/useDonnees'
import { useMediaQuery } from '../state/useMediaQuery'
import { usePanneauOuvert, useTitrePage } from '../state/useTitrePage'
import { useValidation } from '../state/useValidation'
import { estListeDeChaines, usePreference } from '../state/usePreference'
import { useTextes } from '../state/usePreferences'
import { textes } from '../i18n'
import { useAujourdhui } from '../state/useAujourdhui'
import { libelleReport, useReport } from '../state/useReport'
import { formatLong, formatIsoDate } from '../lib/dates'
import { CLE_SANS_CATEGORIE, grouperParCategorie, revisionsDe } from '../lib/sujets'
import { etatRevision, resumeCategorie, statsCategorie, type ModeColonnes } from '../lib/suivi'
import { progressionEntree } from '../lib/stats'
import { PastilleCategorie } from '../components/ChipCategorie'
import { IconeChevron } from '../components/Icons'
import { FeuilleBas } from '../components/FeuilleBas'
import { LegendeSuivi } from '../components/LegendeSuivi'
import { Bouton, LienBouton } from '../components/Bouton'
import { SelecteurPratique } from '../components/SelecteurPratique'
import { TableauSuivi, type CelluleVisee } from '../components/TableauSuivi'

const CLE_MODE = 'revoir.suivi.mode'
const CLE_OUVERTES = 'revoir.suivi.ouvertes'

const TOUTES = '*'

const estChoixDeMode = (valeur: unknown): valeur is ModeColonnes | null =>
  valeur === null || valeur === 'compact' || valeur === 'intervalles'

const estChoixDePli = (valeur: unknown): valeur is string[] | null =>
  valeur === null || estListeDeChaines(valeur)

export function Suivi() {
  const t = useTextes()
  useTitrePage(t.suivi.titre)
  const { categories, topics, reviews, loading, devalider, definirPratique } =
    useDonnees()
  const { validerRevision } = useValidation()
  const reporter = useReport()
  const large = useMediaQuery('(min-width: 768px)')
  const aujourdhui = useAujourdhui()
  const champFiltre = useId()

  /*
   * Tant que rien n'a été choisi, le mode suit la largeur : sur un téléphone,
   * l'union des écarts d'une catégorie mêlant Simple et Ultime fait dix-sept
   * colonnes, et « J+180 » ne tient pas dans 44px. Dès que l'utilisateur
   * choisit, c'est son choix qui vaut, quelle que soit la fenêtre — d'où le
   * `null` plutôt qu'une valeur figée au montage.
   */
  const [modeChoisi, setMode] = usePreference<ModeColonnes | null>(
    CLE_MODE,
    null,
    estChoixDeMode,
  )
  const mode: ModeColonnes = modeChoisi ?? (large ? 'intervalles' : 'compact')
  const [filtre, setFiltre] = useState<string>(TOUTES)
  const [visee, setVisee] = useState<CelluleVisee | null>(null)

  usePanneauOuvert(visee !== null)

  const groupes = useMemo(
    () => grouperParCategorie(categories, topics, reviews),
    [categories, topics, reviews],
  )

  /*
   * Une seule catégorie ouverte par défaut — la première. Sur un téléphone,
   * six tableaux dépliés font une page qu'on parcourt au lieu de la lire.
   *
   * `null` signifie « jamais choisi », et le défaut se calcule alors à chaque
   * rendu. Le figer au montage laisserait tout replié quand la page s'ouvre
   * directement sur /suivi : les catégories n'existent pas encore, la base est
   * en cours de lecture, et une valeur initiale prise à cet instant vaut liste
   * vide pour toujours.
   */
  const [choix, setChoix] = usePreference<string[] | null>(
    CLE_OUVERTES,
    null,
    estChoixDePli,
  )
  const ouvertes = choix ?? groupes.slice(0, 1).map((groupe) => groupe.cle)

  const basculer = (cle: string, ouvert: boolean) => {
    setChoix(
      ouvert ? [...new Set([...ouvertes, cle])] : ouvertes.filter((autre) => autre !== cle),
    )
  }

  /*
   * Le filtre retenu, ou « Toutes » si la catégorie qu'il désignait n'a plus
   * un seul sujet actif. Sans ce garde, la page n'affiche plus aucun tableau
   * et le champ reste sur une valeur qu'aucune option ne porte — un `<select>`
   * vide sous un écran vide.
   */
  const filtreEffectif =
    filtre === TOUTES || groupes.some((groupe) => groupe.cle === filtre)
      ? filtre
      : TOUTES

  const choisirFiltre = (cle: string) => {
    setFiltre(cle)
    // Filtrer sur une catégorie, c'est demander à la voir : la déplier fait
    // partie du geste. Rien n'empêche de la replier ensuite, et c'est alors
    // ce choix-là qui vaut.
    if (cle !== TOUTES) setChoix([...new Set([...ouvertes, cle])])
  }

  // Stable : les colonnes du tableau se mémorisent dessus.
  const ouvrirCellule = useCallback((cible: CelluleVisee) => setVisee(cible), [])

  const visibles = groupes.filter(
    (groupe) => filtreEffectif === TOUTES || groupe.cle === filtreEffectif,
  )

  if (loading) return <p className="discret">{t.commun.chargement}</p>

  if (groupes.length === 0) {
    return (
      <div className="etat-vide">
        <h1 className="page__titre">{t.suivi.videTitre}</h1>
        <p className="discret">{t.suivi.videDetail}</p>
        <LienBouton vers="/nouveau" variante="primaire">
          {t.suivi.creerSujet}
        </LienBouton>
      </div>
    )
  }

  return (
    <>
      <div className="page__entete">
        <h1 className="page__titre">{t.suivi.titre}</h1>
      </div>

      <div className="suivi__reglages">
        <label className="suivi__filtre" htmlFor={champFiltre}>
          <span className="champ__label">{t.suivi.categorie}</span>
          {/* Même gabarit que le champ de choix du formulaire : `appearance:
              none` emporte la flèche native, on la redessine. */}
          <div className="champ-select">
            <select
              id={champFiltre}
              className="champ-select__saisie"
              value={filtreEffectif}
              onChange={(event) => choisirFiltre(event.target.value)}
            >
              <option value={TOUTES}>{t.suivi.toutesCategories}</option>
              {groupes.map((groupe) => (
                <option key={groupe.cle} value={groupe.cle}>
                  {groupe.nom}
                </option>
              ))}
            </select>
            <IconeChevron className="champ-select__chevron" width="18" height="18" />
          </div>
        </label>

        <fieldset className="suivi__mode">
          <legend className="champ__label">{t.suivi.colonnes}</legend>
          <div className="suivi__bascule">
            {(['compact', 'intervalles'] as const).map((option) => (
              <label
                key={option}
                className={
                  mode === option
                    ? 'pratique__option pratique__option--actif'
                    : 'pratique__option'
                }
              >
                <input
                  className="pratique__radio"
                  type="radio"
                  name="suivi-mode"
                  value={option}
                  checked={mode === option}
                  onChange={() => setMode(option)}
                />
                {option === 'compact' ? t.suivi.compact : t.suivi.intervalles}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/*
        Repliée : une légende sert une fois, et prendre huit lignes au-dessus
        du tableau à chaque visite reviendrait à faire payer aux habitués ce
        que les nouveaux venus lisent une seule fois. Un `<details>` fermé
        reste annoncé et atteignable au clavier.
      */}
      <details className="suivi__legende">
        <summary className="suivi__legende-titre">
          <IconeChevron className="suivi__chevron" width="16" height="16" />
          {t.suivi.legendeTitre}
        </summary>
        <LegendeSuivi />
      </details>

      {visibles.map((groupe, index) => {
        const stats = statsCategorie(groupe.topics, reviews, aujourdhui)
        const ouvert = ouvertes.includes(groupe.cle)

        return (
          <details
            key={groupe.cle}
            className="suivi__groupe"
            open={ouvert}
            onToggle={(event) => basculer(groupe.cle, event.currentTarget.open)}
          >
            {/*
              `aria-expanded` double l'état natif de <details>, que Safari
              n'expose pas toujours. Il vient de la même source que l'attribut
              `open` : les deux ne peuvent pas se désaccorder.
            */}
            <summary className="suivi__entete-groupe" aria-expanded={ouvert}>
              <IconeChevron className="suivi__chevron" width="16" height="16" />
              {groupe.cle !== CLE_SANS_CATEGORIE && (
                <PastilleCategorie categorie={groupe.categorie} />
              )}
              <span className="suivi__nom">{groupe.nom}</span>
              <span className="suivi__resume">{resumeCategorie(stats)}</span>
            </summary>

            <TableauSuivi
              nom={groupe.nom}
              topics={groupe.topics}
              reviews={reviews}
              mode={mode}
              aujourdhui={aujourdhui}
              onCellule={ouvrirCellule}
              astuce={index === 0}
            />
          </details>
        )
      })}

      {/*
        Le toast et son « Annuler » viennent d'`useValidation` : la validation
        se dit dans les mêmes mots depuis les listes, la fiche et le tableau.
      */}
      <PanneauCellule
        visee={visee}
        onFermer={() => setVisee(null)}
        aujourdhui={aujourdhui}
        onValider={(reviewId) => {
          validerRevision(reviewId)
          setVisee(null)
        }}
        onDevalider={(reviewId) => {
          devalider(reviewId)
          setVisee(null)
        }}
        onReporter={(reviewId) => {
          reporter(reviewId, aujourdhui)
          setVisee(null)
        }}
        onPratique={definirPratique}
      />
    </>
  )
}

interface PanneauCelluleProps {
  visee: CelluleVisee | null
  aujourdhui: string
  onFermer: () => void
  onValider: (reviewId: string) => void
  onDevalider: (reviewId: string) => void
  onReporter: (reviewId: string) => void
  onPratique: (topicId: string, statut: PracticeStatus) => void
}

/**
 * Le panneau d'une cellule.
 *
 * Une feuille par page, pas une par case : c'est le composant déjà utilisé par
 * le calendrier, avec son `<dialog>` natif, son focus, sa touche Échap et son
 * glissement vers le bas. Rien de tout cela ne se réécrit correctement à la
 * légère, et un tableau de deux cents cases ne peut pas porter deux cents
 * feuilles.
 */
function PanneauCellule({
  visee,
  aujourdhui,
  onFermer,
  onValider,
  onDevalider,
  onReporter,
  onPratique,
}: PanneauCelluleProps) {
  const t = useTextes()
  const { topics, reviews } = useDonnees()

  const topic = topics.find((candidat) => candidat.id === visee?.topicId) ?? null
  const revisions = useMemo(
    () => (topic ? revisionsDe(topic.id, reviews) : []),
    [topic, reviews],
  )
  const review =
    visee?.type === 'revision'
      ? (revisions.find((candidat) => candidat.id === visee.reviewId) ?? null)
      : null

  const titre =
    topic === null
      ? ''
      : visee?.type === 'pratique'
        ? t.suivi.panneauPratique(topic.title)
        : review
          ? t.suivi.panneauRevision(
              t.programmes.decalage(review.intervalInDays),
              topic.title,
            )
          : topic.title

  return (
    <FeuilleBas ouverte={visee !== null && topic !== null} titre={titre} onFermer={onFermer}>
      {topic !== null && visee?.type === 'pratique' && (
        <SelecteurPratique
          valeur={topic.practiceStatus}
          legende={t.pratique.legendeSujet}
          onChange={(statut) => {
            onPratique(topic.id, statut)
            onFermer()
          }}
        />
      )}

      {topic !== null && review !== null && (
        <>
          <p className="panneau__etat">{etatEnClair(review, revisions, aujourdhui)}</p>

          {/*
            Une révision à venir se valide comme les autres. Elle l'était déjà
            depuis la feuille du calendrier, depuis « Prochaines révisions » et
            depuis la fiche du sujet : le panneau était le seul écran à la
            refuser, ce qui ne se lisait pas comme une règle mais comme une
            case morte. Réviser en avance est un usage, pas une erreur.
          */}
          <div className="panneau__actions">
            {etatRevision(review, aujourdhui) === 'faite' ? (
              <Bouton variante="discret" onClick={() => onDevalider(review.id)}>
                {t.suivi.annulerValidation}
              </Bouton>
            ) : (
              <>
                <Bouton variante="primaire" onClick={() => onValider(review.id)}>
                  {t.suivi.marquerEffectuee}
                </Bouton>
                <Bouton variante="discret" onClick={() => onReporter(review.id)}>
                  {libelleReport(review, aujourdhui)}
                </Bouton>
              </>
            )}
            <Link to={`/sujet/${topic.id}`} className="btn btn--discret">
              {t.suivi.voirLeSujet}
            </Link>
          </div>
        </>
      )}
    </FeuilleBas>
  )
}

/** L'état d'une révision, écrit en toutes lettres. */
function etatEnClair(review: Review, revisions: Review[], aujourdhui: string): string {
  const t = textes().suivi
  const { rang, total } = progressionEntree(review, revisions)
  const situation = t.situation(rang, total)

  if (review.completedAt !== null) {
    const jour = formatIsoDate(review.completedAt)
    return jour === null ? t.effectuee(situation) : t.effectueeLe(situation, jour)
  }
  const etat = etatRevision(review, aujourdhui)
  const date = formatLong(review.dueDate)
  if (etat === 'retard') return t.prevueRetard(situation, date)
  if (etat === 'aujourdhui') return t.prevueAujourdhui(situation)
  return t.prevue(situation, date)
}
