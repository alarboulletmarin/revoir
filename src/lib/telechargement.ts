// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Enregistrer un fichier depuis le navigateur.
 *
 * Trois écrans le font désormais — la sauvegarde JSON des réglages, l'export
 * calendrier global, celui d'un sujet — et la manœuvre a deux pièges qu'on ne
 * remarque qu'une fois : le lien doit être **dans le document** pour que
 * Firefox suive le clic, et l'URL ne doit **pas** être libérée dans le même
 * tour de boucle, sous peine d'annuler le téléchargement avant qu'il ne
 * démarre. Écrite une fois, elle ne se retrouve pas à moitié juste ailleurs.
 */
export function telecharger(contenu: string, nom: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contenu], { type }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.append(lien)
  lien.click()
  lien.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Les deux types MIME que l'application produit. */
export const TYPE_JSON = 'application/json'
export const TYPE_ICS = 'text/calendar;charset=utf-8'
