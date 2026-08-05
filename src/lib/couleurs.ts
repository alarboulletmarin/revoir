/**
 * Couleurs de matière choisies librement.
 *
 * **La couleur choisie est la couleur retenue.** Elle n'est ni assombrie ni
 * désaturée pour ressembler aux huit teintes intégrées : un jaune pâle reste
 * un jaune pâle, sur sa pastille comme dans le sélecteur.
 *
 * Deux contraintes seulement, et aucune n'est affaire de goût — ce sont
 * celles sans lesquelles l'écran cesse de fonctionner :
 *
 *   1. **Le texte doit se lire.** `--teinte` sert d'encre au libellé de la
 *      chip : un jaune pâle y serait illisible. La couleur du texte est donc
 *      dérivée — même teinte, même chroma, assombrie juste assez pour tenir
 *      4,5:1 sur `--papier`. Elle ne remplace jamais la couleur choisie,
 *      elle s'y ajoute.
 *   2. **La pastille doit se voir.** Un blanc cassé sur du papier crème est
 *      un point invisible, pas un choix. Sous 1,4:1 la couleur est descendue
 *      jusqu'à ce seuil, et pas d'un pas de plus.
 *
 * Tout se calcule en OKLab, où la clarté est perceptuelle : assombrir un
 * jaune et un bleu de la même quantité les assombrit autant à l'œil.
 */

/** Une couleur libre, toujours normalisée, toujours en `#rrggbb` minuscule. */
export type CouleurPersonnalisee = `#${string}`

/** Contraste minimal d'un texte sur `--papier` (WCAG AA, texte courant). */
const CONTRASTE_TEXTE = 4.5

/**
 * Plancher de visibilité d'une surface. Bien en dessous des 3:1 que la WCAG
 * demande d'un objet graphique porteur d'information — la pastille n'en porte
 * aucune, le nom de la matière est toujours écrit à côté (section 3 bis). Il
 * ne sert qu'à écarter l'invisible.
 */
const CONTRASTE_VISIBLE = 1.4

const HEX = /^#([0-9a-f]{6})$/i

type Triplet = [number, number, number]

export function estCouleurPersonnalisee(valeur: unknown): valeur is CouleurPersonnalisee {
  return typeof valeur === 'string' && HEX.test(valeur)
}

function versRgb(hex: string): Triplet {
  const chiffres = hex.slice(1)
  return [
    parseInt(chiffres.slice(0, 2), 16) / 255,
    parseInt(chiffres.slice(2, 4), 16) / 255,
    parseInt(chiffres.slice(4, 6), 16) / 255,
  ]
}

function versHex([r, g, b]: Triplet): CouleurPersonnalisee {
  const composante = (valeur: number) =>
    Math.round(Math.min(1, Math.max(0, valeur)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${composante(r)}${composante(g)}${composante(b)}`
}

const versLineaire = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const versGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

/** sRGB → OKLab (Björn Ottosson). */
function versOklab([r, g, b]: Triplet): Triplet {
  const rl = versLineaire(r)
  const gl = versLineaire(g)
  const bl = versLineaire(b)
  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl)
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl)
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLab → sRGB. Les composantes peuvent sortir de [0, 1] : hors gamut. */
function depuisOklab([clarte, a, b]: Triplet): Triplet {
  const l = (clarte + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (clarte - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (clarte - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    versGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    versGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    versGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/** Luminance relative WCAG. */
function luminance([r, g, b]: Triplet): number {
  return (
    0.2126 * versLineaire(r) + 0.7152 * versLineaire(g) + 0.0722 * versLineaire(b)
  )
}

/** Rapport de contraste WCAG entre deux couleurs. */
export function contraste(a: CouleurPersonnalisee, b: CouleurPersonnalisee): number {
  const la = luminance(versRgb(a))
  const lb = luminance(versRgb(b))
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Contraste sur `--papier` — la seule mesure qui nous occupe ici. */
export function contrasteSurPapier(couleur: CouleurPersonnalisee): number {
  return contraste(couleur, '#faf9f6')
}

/** Clarté et chroma OKLab d'une couleur, pour les tests et le registre. */
export function repereOklab(couleur: CouleurPersonnalisee): {
  clarte: number
  chroma: number
} {
  const [clarte, a, b] = versOklab(versRgb(couleur))
  return { clarte, chroma: Math.hypot(a, b) }
}

/**
 * Assombrit une couleur jusqu'à ce qu'elle atteigne le contraste visé sur le
 * papier, sans la toucher si elle y est déjà. La teinte et la chroma sont
 * conservées ; seule la clarté descend, et du minimum.
 */
function assombrirJusqua(
  couleur: CouleurPersonnalisee,
  cible: number,
): CouleurPersonnalisee {
  if (contrasteSurPapier(couleur) >= cible) return couleur

  const [clarteSource, a, b] = versOklab(versRgb(couleur))
  const angle = Math.atan2(b, a)
  const chromaSource = Math.hypot(a, b)

  /*
   * Le contraste sur le papier décroît quand la clarté monte : on cherche la
   * clarté la plus haute qui tienne encore la cible — la couleur la plus
   * proche de celle qu'on a choisie.
   */
  const rendu = (clarte: number, chroma: number) =>
    depuisOklab([clarte, Math.cos(angle) * chroma, Math.sin(angle) * chroma])

  let chroma = chromaSource
  for (let essai = 0; essai < 24; essai += 1) {
    let bas = 0
    let haut = clarteSource
    for (let tour = 0; tour < 30; tour += 1) {
      const milieu = (bas + haut) / 2
      if (contraste(versHex(rendu(milieu, chroma)), '#faf9f6') >= cible) bas = milieu
      else haut = milieu
    }
    const rgb = rendu(bas, chroma)
    // Une chroma trop forte pour cette clarté sort du gamut sRGB : on la
    // resserre plutôt que de laisser le rendu se faire écrêter n'importe où.
    if (rgb.every((composante) => composante >= -0.001 && composante <= 1.001)) {
      return versHex(rgb)
    }
    chroma *= 0.9
  }
  return versHex(rendu(0, 0))
}

/**
 * La couleur telle qu'elle sera portée par les pastilles, les points du
 * calendrier et les bordures : celle qui a été choisie, à ceci près qu'une
 * couleur invisible sur le papier est descendue jusqu'au seuil.
 */
export function couleurRetenue(hex: string): CouleurPersonnalisee {
  if (!HEX.test(hex)) return '#6b665d'
  return assombrirJusqua(hex.toLowerCase() as CouleurPersonnalisee, CONTRASTE_VISIBLE)
}

/**
 * La même couleur, en encre : assombrie juste assez pour se lire sur le
 * papier. Une couleur déjà assez foncée ressort inchangée.
 */
export function couleurTexte(couleur: CouleurPersonnalisee): CouleurPersonnalisee {
  return assombrirJusqua(couleur, CONTRASTE_TEXTE)
}
