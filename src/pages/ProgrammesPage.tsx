// SPDX-License-Identifier: AGPL-3.0-only

import type { Programme } from '../types'
import { useDonnees } from '../state/useDonnees'
import { useToast } from '../state/useToast'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { decrirePortee, listerDecalages, reviewsDepuisOffsets } from '../lib/schedules'
import { todayKey } from '../lib/dates'
import { Frise } from '../components/Frise'
import { Bouton, LienBouton } from '../components/Bouton'

/**
 * Les rythmes créés — la liste, extraite des réglages.
 *
 * Les trois programmes intégrés n'y figurent pas : ils ne se modifient ni ne
 * se suppriment, et une liste où deux tiers des lignes n'ont pas d'action
 * n'est plus une liste de gestion. On les voit là où ils servent, au moment de
 * choisir un rythme.
 */
export function ProgrammesPage() {
  const t = useTextes()
  useTitrePage(t.reglages.programmes.titre)
  const { programmes, supprimerProgramme, restaurerProgramme, compterUsages } =
    useDonnees()
  const { afficherToast } = useToast()

  /*
   * On annule, on ne confirme pas (règle métier n°3). Un programme supprimable
   * n'est suivi par aucun sujet — il n'emporte donc rien —, mais il a pu
   * demander quelques gestes à composer, et un message de constat ne les
   * rendait pas. Le toast, lui, les rend.
   */
  const supprimer = (programme: Programme) => {
    void supprimerProgramme(programme.id).then((fait) => {
      if (!fait) return
      afficherToast({
        texte: t.reglages.programmes.supprime,
        detail: programme.label,
        action: {
          libelle: t.commun.annuler,
          onAction: () => restaurerProgramme(programme),
        },
      })
    })
  }

  return (
    <>
      <div className="page__entete">
        <h1 className="titre-page">{t.reglages.programmes.titre}</h1>
        <p className="page__intro">{t.reglages.programmes.intro}</p>
      </div>

      {programmes.length === 0 ? (
        <p className="discret">{t.reglages.programmes.aucun}</p>
      ) : (
        <ul className="rythmes">
          {programmes.map((programme) => {
            const usages = compterUsages(programme.id)
            return (
              <li key={programme.id} className="rythme">
                <div className="rythme__entete">
                  <span className="rythme__nom">{programme.label}</span>
                  <span className="rythme__compte">
                    {t.reglages.programmes.compte(
                      programme.offsets.length,
                      decrirePortee(programme.offsets),
                    )}
                  </span>
                </div>
                <Frise
                  origine={todayKey()}
                  reviews={reviewsDepuisOffsets('apercu', todayKey(), programme.offsets)}
                  aujourdhui={todayKey()}
                  variante="mini"
                  intitule={t.reglages.programmes.intitule(programme.label)}
                />
                <span className="rythme__jours">{listerDecalages(programme.offsets)}</span>
                {/*
                  Le nom se renomme toujours ; le rythme et la suppression
                  tombent dès qu'un sujet suit le programme.
                */}
                <div className="rythme__actions">
                  <LienBouton
                    vers={`/programmes/${programme.id}/modifier`}
                    variante="discret"
                  >
                    {usages > 0
                      ? t.reglages.programmes.renommer
                      : t.reglages.programmes.modifier}
                  </LienBouton>
                  {usages === 0 && (
                    <Bouton variante="danger" onClick={() => supprimer(programme)}>
                      {t.commun.supprimer}
                    </Bouton>
                  )}
                </div>
                {usages > 0 && (
                  <p className="discret discret--petit">
                    {t.reglages.programmes.usages(usages)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="reglages__actions">
        <LienBouton vers="/programmes/nouveau" variante="primaire">
          {t.reglages.programmes.creer}
        </LienBouton>
      </div>
    </>
  )
}
