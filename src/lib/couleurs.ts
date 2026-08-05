/**
 * Couleurs de matière choisies librement.
 *
 * La section 3 bis pose huit teintes désaturées. Mesurées en OKLab — un espace
 * perceptuel, où deux couleurs de même clarté paraissent aussi claires l'une
 * que l'autre —, elles forment un registre d'une régularité qui n'est pas un
 * hasard :
 *
 *     clarté   de 0,489 (bleu) à 0,505 (ocre)
 *     chroma   de 0,038 (ardoise) à 0,079 (ocre)
 *
 * C'est ce qui leur donne le même poids à l'écran : aucune matière ne crie
 * plus fort que sa voisine, et toutes restent lisibles en texte (5,54:1 à
 * 5,99:1 sur `--papier`).
 *
 * Une couleur prise telle quelle au sélecteur casserait ce registre. La
 * couleur choisie y est donc ramenée : **sa teinte est conservée exactement**
 * — c'est elle que l'utilisateur a choisie —, sa chroma est ramenée dans la
 * bande des huit, sa clarté posée au milieu de la leur.
 *
 * En HSL, la même opération ne tiendrait pas : à saturation égale un rouge
 * crie bien plus fort qu'un ocre. C'est tout l'intérêt de passer par OKLab.
 *
 * Un rouge vif ressort donc en brique, un bleu électrique en ardoise soutenue.
 * Le sélecteur montre le résultat en direct : rien n'est décidé dans le dos.
 */

/** Une couleur libre, toujours normalisée, toujours en `#rrggbb` minuscule. */
export type CouleurPersonnalisee = `#${string}`

/** Clarté OKLab des huit teintes, moyennée. */
const CLARTE = 0.497

/** Bande de chroma des huit : de l'ardoise à l'ocre. */
const CHROMA_MIN = 0.038
const CHROMA_MAX = 0.079

/**
 * En dessous, la couleur est un gris. Lui imposer la chroma plancher la
 * teinterait — une couleur neutre a une teinte arbitraire —, alors qu'un gris
 * est un choix légitime. Il reste gris, à la bonne clarté.
 */
const SEUIL_NEUTRE = 0.004

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
 * Ramène une couleur dans le registre des huit teintes : même clarté
 * perceptuelle, chroma dans leur bande, teinte inchangée.
 */
export function normaliserCouleur(hex: string): CouleurPersonnalisee {
  const [, a, b] = versOklab(versRgb(HEX.test(hex) ? hex : '#808080'))
  const chromaSource = Math.hypot(a, b)

  if (chromaSource < SEUIL_NEUTRE) return versHex(depuisOklab([CLARTE, 0, 0]))

  const angle = Math.atan2(b, a)
  let chroma = Math.min(CHROMA_MAX, Math.max(CHROMA_MIN, chromaSource))

  /*
   * La bande de chroma tient dans le gamut sRGB à cette clarté pour toutes les
   * teintes, mais on ne le suppose pas : tant qu'une composante déborde, on
   * resserre. La teinte, elle, n'est jamais touchée.
   */
  for (let essai = 0; essai < 24; essai += 1) {
    const rgb = depuisOklab([CLARTE, Math.cos(angle) * chroma, Math.sin(angle) * chroma])
    if (rgb.every((composante) => composante >= -0.001 && composante <= 1.001)) {
      return versHex(rgb)
    }
    chroma *= 0.95
  }
  return versHex(depuisOklab([CLARTE, 0, 0]))
}
