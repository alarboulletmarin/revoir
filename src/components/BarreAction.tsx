// SPDX-License-Identifier: AGPL-3.0-only

/**
 * La barre d'action fixe — section 8.22 du design system.
 *
 * Une sortie à gauche, écrite en lien souligné ; l'action à droite, plus haute
 * que la cible minimale parce qu'elle est seule de son espèce sur l'écran.
 * L'action reste à droite même sans sortie : elle ne doit pas changer de place
 * d'un écran à l'autre d'un même parcours.
 *
 * **La barre de navigation s'efface là où celle-ci apparaît** (section 7.3).
 * Deux barres empilées, ce sont cent vingt pixels de chrome sous le pouce et
 * deux réponses à « comment je sors d'ici ? ». Les écrans qui la portent sont
 * des tâches à terminer, pas des vues à quitter — c'est au Layout de le savoir,
 * par leur adresse.
 */
interface BarreActionProps {
  sortie?: { libelle: string; onClick: () => void }
  action: {
    libelle: string
    onClick?: () => void
    type?: 'button' | 'submit'
    desactivee?: boolean
  }
}

export function BarreAction({ sortie, action }: BarreActionProps) {
  return (
    <div className="barre-action">
      {sortie !== undefined && (
        <button
          type="button"
          className="lien barre-action__sortie"
          onClick={sortie.onClick}
        >
          {sortie.libelle}
        </button>
      )}
      <button
        type={action.type ?? 'button'}
        className="btn btn--primaire barre-action__principale"
        onClick={action.onClick}
        disabled={action.desactivee}
      >
        {action.libelle}
      </button>
    </div>
  )
}
