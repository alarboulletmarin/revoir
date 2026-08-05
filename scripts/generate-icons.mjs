// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Génère les icônes PNG de la PWA sans dépendance : on rasterise quelques
 * formes simples puis on encode le PNG à la main via zlib.
 *
 * Motif : la frise, signature de l'application. Les graduations sont placées
 * comme dans l'app — écart proportionnel à √jours pour le programme Simple
 * (J+1, J+3, J+7, J+14, J+30). Palette : --accent sur --papier.
 *
 * Usage : npm run icons
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [0x52, 0x79, 0x6f] // --accent #52796F
const FG = [0xfa, 0xf9, 0xf6] // --papier #FAF9F6

/** Programme « Simple » : J+1, J+3, J+7, J+14, J+30. */
const DECALAGES = [1, 3, 7, 14, 30]

/**
 * Positions des graduations le long de la frise, de 0 (origine) à 1.
 * Même compression qu'en production : poids du segment = √jours écoulés.
 */
function graduations() {
  const poids = DECALAGES.map((decalage, index) =>
    Math.sqrt(decalage - (index === 0 ? 0 : DECALAGES[index - 1])),
  )
  const total = poids.reduce((somme, valeur) => somme + valeur, 0)
  let cumul = 0
  return [0, ...poids.map((valeur) => (cumul += valeur) / total)]
}

/** Canvas RGBA minimal, avec anticrénelage par sur-échantillonnage 3x3. */
function createCanvas(width, height = width) {
  const pixels = new Uint8Array(width * height * 4)
  return {
    width,
    height,
    pixels,
    fill(color) {
      for (let i = 0; i < width * height; i += 1) {
        pixels[i * 4] = color[0]
        pixels[i * 4 + 1] = color[1]
        pixels[i * 4 + 2] = color[2]
        pixels[i * 4 + 3] = 255
      }
    },
    /** Peint la zone où `inside(x, y)` est vrai, bords lisses. */
    paint(color, inside) {
      const SAMPLES = 3
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          let hits = 0
          for (let sy = 0; sy < SAMPLES; sy += 1) {
            for (let sx = 0; sx < SAMPLES; sx += 1) {
              const px = x + (sx + 0.5) / SAMPLES
              const py = y + (sy + 0.5) / SAMPLES
              if (inside(px, py)) hits += 1
            }
          }
          if (hits === 0) continue
          const alpha = hits / (SAMPLES * SAMPLES)
          const offset = (y * width + x) * 4
          for (let channel = 0; channel < 3; channel += 1) {
            pixels[offset + channel] = Math.round(
              pixels[offset + channel] * (1 - alpha) + color[channel] * alpha,
            )
          }
          pixels[offset + 3] = Math.max(pixels[offset + 3], Math.round(alpha * 255))
        }
      }
    },
  }
}

const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r

/** Rectangle à coins arrondis. */
const roundedRect = (left, top, width, height, radius) => (x, y) => {
  if (x < left || x > left + width || y < top || y > top + height) return false
  const dx = Math.max(left + radius - x, 0, x - (left + width - radius))
  const dy = Math.max(top + radius - y, 0, y - (top + height - radius))
  return dx * dx + dy * dy <= radius * radius
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePNG(canvas) {
  const { width, height, pixels } = canvas
  const stride = width * 4
  // Chaque ligne est préfixée par son octet de filtre (0 = aucun).
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // profondeur
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * @param size taille en pixels
 * @param inset marge du fond, en fraction (0.1 = safe zone des icônes maskables)
 */
function drawIcon(size, inset = 0) {
  const canvas = createCanvas(size)
  const margin = size * inset
  const box = size - margin * 2

  if (inset > 0) {
    // Icône maskable : le fond doit couvrir toute la surface, le motif reste
    // dans la zone sûre.
    canvas.fill(BG)
  } else {
    canvas.fill(FG)
    canvas.paint(BG, roundedRect(0, 0, size - 1, size - 1, size * 0.22))
  }

  // La frise : une piste horizontale et ses graduations.
  const piste = box * 0.72
  const gauche = margin + (box - piste) / 2
  const milieu = margin + box * 0.5
  const epaisseur = Math.max(1, box * 0.022)
  const hauteurGraduation = box * 0.2

  canvas.paint(
    FG,
    roundedRect(gauche, milieu - epaisseur / 2, piste, epaisseur, epaisseur / 2),
  )

  for (const position of graduations()) {
    // La dernière graduation doit rester entièrement dans la piste.
    const x = gauche + piste * position - epaisseur * position
    canvas.paint(
      FG,
      roundedRect(
        x,
        milieu - hauteurGraduation / 2,
        epaisseur,
        hauteurGraduation,
        epaisseur / 2,
      ),
    )
  }

  return encodePNG(canvas)
}

/**
 * L'image de partage — celle qu'affiche un lien collé dans une conversation.
 *
 * Le même motif que l'icône, aux couleurs de l'application plutôt qu'à celles
 * de son écran d'accueil : la frise en --accent sur le papier. Aucun mot n'y
 * est dessiné, les balises `og:` portent déjà le titre et la description ; du
 * texte rasterisé à la main ferait moins bien qu'elles.
 *
 * 1200 × 630 : le format que réclament les aperçus, et le seul endroit du
 * projet où le canvas n'est pas carré.
 */
function drawSociale(width = 1200, height = 630) {
  const canvas = createCanvas(width, height)
  canvas.fill(FG)

  const piste = width * 0.66
  const gauche = (width - piste) / 2
  const milieu = height * 0.5
  const epaisseur = Math.max(1, height * 0.012)
  const hauteurGraduation = height * 0.16

  canvas.paint(
    BG,
    roundedRect(gauche, milieu - epaisseur / 2, piste, epaisseur, epaisseur / 2),
  )

  for (const position of graduations()) {
    const x = gauche + piste * position - epaisseur * position
    canvas.paint(
      BG,
      roundedRect(
        x,
        milieu - hauteurGraduation / 2,
        epaisseur,
        hauteurGraduation,
        epaisseur / 2,
      ),
    )
  }

  return encodePNG(canvas)
}

mkdirSync(OUT_DIR, { recursive: true })

const outputs = [
  ['icon-192.png', drawIcon(192)],
  ['icon-512.png', drawIcon(512)],
  ['icon-512-maskable.png', drawIcon(512, 0.14)],
  ['apple-touch-icon.png', drawIcon(180)],
  ['social.png', drawSociale()],
]

for (const [name, data] of outputs) {
  writeFileSync(join(OUT_DIR, name), data)
  console.log(`${name} (${(data.length / 1024).toFixed(1)} Ko)`)
}
