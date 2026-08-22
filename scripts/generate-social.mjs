// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les visuels de présentation pour les réseaux sociaux, en 16:9 et en 9:16.
 *
 * Ils ne sont pas dessinés ailleurs puis importés : ils sont *rendus depuis le
 * design system*, comme les icônes. La palette vient de `src/styles/tokens.css`,
 * la géométrie de la frise de `src/lib/frise.ts`, et les phrases du dictionnaire
 * français de `src/i18n/fr.ts`. Une valeur qui change dans l'application change
 * ici au prochain rendu, plutôt que de laisser vieillir une image.
 *
 * Deux formats, un seul contenu. Le 16:9 sert les fils larges — LinkedIn, X,
 * l'aperçu d'un lien — et le 9:16 les formats debout — les stories, les Reels,
 * TikTok. Ce ne sont pas deux recadrages du même dessin : la mise en page change
 * de sens, parce qu'un titre lu sur un écran couché et un titre lu au pouce ne
 * se coupent pas au même endroit.
 *
 * Aucune dépendance : du HTML, la pile de polices de l'application, et le
 * Chromium déjà présent pour les tests de bout en bout. Le rendu se fait à la
 * taille finale, pas à une taille intermédiaire remise à l'échelle.
 *
 *   node scripts/generate-social.mjs
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const sortie = join(racine, 'media', 'social')
const travail = join(tmpdir(), 'revoir-social')

/* ------------------------------------------------------------------ palette */

/** Les trois papiers. Valeurs reprises telles quelles de `tokens.css`. */
const THEMES = {
  papier: {
    papier: '#FAF9F6', surface: '#FDFCF8', trait: '#E6E2D9',
    encre: '#2C2A26', encre2: '#6B665D', accent: '#52796F',
    accentDoux: '#F1F4F2', retard: '#B0763A', retardTexte: '#8A5A28',
    fait: '#6A8F6B', faitTexte: '#4F6E50',
  },
  sombre: {
    papier: '#1A1917', surface: '#221F1C', trait: '#3A3630',
    encre: '#EFECE4', encre2: '#98927F', accent: '#7FA89A',
    accentDoux: '#23302C', retard: '#B8843F', retardTexte: '#CF9D64',
    fait: '#6F9670', faitTexte: '#8FB790',
  },
  /* Le papier retourné : l'accent devient le fond, et l'encre le papier. */
  accent: {
    papier: '#52796F', surface: '#5C8478', trait: '#6E9488',
    encre: '#FAF9F6', encre2: '#D3E0DA', accent: '#FAF9F6',
    accentDoux: '#456A61', retard: '#E8C79A', retardTexte: '#E8C79A',
    fait: '#CFE0CE', faitTexte: '#CFE0CE',
  },
}

const TEINTES = {
  bleu: '#3F6389', olive: '#5A6B3C', mauve: '#7A5470', terre: '#7A5B45',
  ardoise: '#4A6572', ocre: '#75632A',
}
const TEINTES_SOMBRE = {
  bleu: '#6E94BC', olive: '#849766', mauve: '#AD84A1', terre: '#AB8A72',
  ardoise: '#7895A2', ocre: '#A18F56',
}

/* -------------------------------------------------------- géométrie : frise */

/**
 * La même compression qu'à l'écran : le poids d'un segment est la racine carrée
 * du nombre de jours qu'il couvre (`src/lib/frise.ts`). Sans elle, J+1 et J+3
 * se toucheraient au bout d'une frise qui va jusqu'à J+30.
 */
function frise(intervalles) {
  const bornes = [0, ...intervalles]
  const poids = intervalles.map((jour, index) =>
    Math.sqrt(Math.max(1, jour - bornes[index])),
  )
  const total = poids.reduce((somme, valeur) => somme + valeur, 0)
  let cumul = 0
  return intervalles.map((jour, index) => {
    cumul += poids[index]
    return { jour, position: cumul / total }
  })
}

const SIMPLE = [1, 3, 7, 14, 30]

/** Le logotype : la frise du programme Simple, réduite à un signe. */
function marque(couleur, largeur = 88) {
  const hauteur = (largeur / 44) * 12
  const points = [0, ...frise(SIMPLE).map((g) => g.position)]
  const traits = points
    .map((p) => {
      const x = (p * (44 - 1.6)).toFixed(2)
      return `<rect x="${x}" y="0" width="1.6" height="12" />`
    })
    .join('')
  return `<svg viewBox="0 0 44 12" width="${largeur}" height="${hauteur.toFixed(1)}"
    fill="${couleur}" aria-hidden="true" style="display:block">
    <rect x="0" y="5.4" width="44" height="1.2" />${traits}</svg>`
}

/** L'icône installée : le signe posé dans son carré accent. */
function icone(taille, fond = '#52796F', encre = '#FAF9F6') {
  const points = [0, ...frise(SIMPLE).map((g) => g.position)]
  const traits = points
    .map((p) => {
      const x = (10 + p * (44 - 1.6)).toFixed(2)
      return `<rect x="${x}" y="26" width="1.6" height="12" />`
    })
    .join('')
  return `<svg viewBox="0 0 64 64" width="${taille}" height="${taille}"
    aria-hidden="true" style="display:block">
    <rect width="64" height="64" rx="14" fill="${fond}" />
    <g fill="${encre}"><rect x="10" y="31.4" width="44" height="1.2" />${traits}</g></svg>`
}

/* ------------------------------------------------------------------ gabarit */

const FORMATS = {
  '16x9': { l: 1920, h: 1080, u: 1, portrait: false },
  '9x16': { l: 1080, h: 1920, u: 0.86, portrait: true },
}

function css(format, theme) {
  const c = THEMES[theme]
  const { u, portrait } = FORMATS[format]
  const marge = portrait ? 76 : 104
  const margeHaute = portrait ? 118 : 104
  const margeBasse = portrait ? 136 : 104
  return `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: ${FORMATS[format].l}px; height: ${FORMATS[format].h}px;
    overflow: hidden; background: ${c.papier}; color: ${c.encre};
    font-family: Arial, 'Liberation Sans', Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .carte {
    width: 100%; height: 100%;
    padding: ${margeHaute}px ${marge}px ${margeBasse}px;
    display: flex; flex-direction: column; gap: ${44 * u}px;
  }
  /* L'en-tête : le logotype à gauche, la mention de format à droite. */
  .entete { display: flex; align-items: center; justify-content: space-between; }
  .logotype { display: flex; align-items: center; gap: ${18 * u}px; }
  .logotype span {
    font-size: ${26 * u}px; letter-spacing: 0.24em; text-transform: uppercase;
    font-weight: 700; color: ${c.encre};
  }
  .entete-note {
    font-size: ${22 * u}px; letter-spacing: 0.14em; text-transform: uppercase;
    color: ${c.encre2};
  }
  .corps { flex: 1; display: flex; flex-direction: column; justify-content: center;
           gap: ${36 * u}px; min-height: 0; }
  .surtitre {
    font-size: ${26 * u}px; letter-spacing: 0.14em; text-transform: uppercase;
    color: ${c.encre2}; font-weight: 700;
  }
  h1 {
    margin: 0; font-size: ${104 * u}px; line-height: 1.04;
    letter-spacing: -0.035em; font-weight: 700; max-width: ${portrait ? '100%' : '17ch'};
  }
  h1.moyen { font-size: ${84 * u}px; max-width: ${portrait ? '100%' : '20ch'}; }
  h1.petit { font-size: ${70 * u}px; max-width: 100%; }
  .chapeau {
    margin: 0; font-size: ${36 * u}px; line-height: 1.45; color: ${c.encre2};
    max-width: ${portrait ? '100%' : '52ch'};
  }
  .chapeau strong { color: ${c.encre}; font-weight: 700; }
  .pied {
    margin-top: auto;
    display: flex; align-items: center; justify-content: space-between; gap: ${24 * u}px;
    border-top: 1px solid ${c.trait}; padding-top: ${28 * u}px;
    font-size: ${26 * u}px; color: ${c.encre2};
  }
  .pied b { color: ${c.encre}; font-weight: 700; }
  .legende { font-size: ${26 * u}px; line-height: 1.45; color: ${c.encre2}; }

  /* Les maquettes d'écran : une surface, un filet, rien de plus. */
  .ecrans { display: flex; gap: ${portrait ? 26 : 34}px; flex: 1; min-height: 0;
            flex-direction: ${portrait ? 'column' : 'row'}; }
  .ecran { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: ${16 * u}px; }
  .ecran-nom { font-size: ${24 * u}px; letter-spacing: 0.14em; text-transform: uppercase;
               color: ${c.encre2}; font-weight: 700; }
  .ecran-corps {
    flex: 1; min-height: 0; overflow: hidden; background: ${c.surface};
    border: 1px solid ${c.trait}; border-radius: ${20 * u}px;
    padding: ${26 * u}px; display: flex; flex-direction: column; gap: ${16 * u}px;
  }
  .ecran-note { font-size: ${23 * u}px; line-height: 1.4; color: ${c.encre2}; }

  .compte { font-size: ${76 * u}px; line-height: 1; font-weight: 700;
            font-variant-numeric: tabular-nums; }
  .compte-note { font-size: ${25 * u}px; color: ${c.encre2}; margin-top: ${-6 * u}px; }

  .rangee { display: flex; align-items: center; gap: ${14 * u}px;
            font-size: ${25 * u}px; padding: ${8 * u}px 0; }
  .cercle { width: ${26 * u}px; height: ${26 * u}px; border-radius: 999px;
            border: ${2 * u}px solid ${c.encre2}; flex: none; }
  .cercle.coche { border-color: ${c.fait}; background: ${c.fait};
                  position: relative; }
  .cercle.coche::after {
    content: ''; position: absolute; left: ${8 * u}px; top: ${4 * u}px;
    width: ${7 * u}px; height: ${13 * u}px; border: solid ${c.surface};
    border-width: 0 ${2.5 * u}px ${2.5 * u}px 0; transform: rotate(45deg);
  }
  .pastille { width: ${9 * u}px; height: ${9 * u}px; border-radius: 999px; flex: none; }
  .rangee .titre { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .rangee .quand { color: ${c.encre2}; font-family: ui-monospace, 'DejaVu Sans Mono', monospace;
                   font-size: ${21 * u}px; font-variant-numeric: tabular-nums; }
  .rangee .quand.retard { color: ${c.retardTexte}; }
  .rangee.faite .titre { color: ${c.encre2}; }
  `
}

function page(format, theme, corps) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>${css(format, theme)}${corps.style ?? ''}</style></head>
<body>${corps.html}</body></html>`
}

const enTete = (theme, rang) => `
  <div class="entete">
    <div class="logotype">${marque(THEMES[theme].encre, 84)}<span>Revoir</span></div>
    <div class="entete-note">${rang} / 06</div>
  </div>`

/* -------------------------------------------------------------- les visuels */

/** 1 — la question. Le papier retourné : l'accent prend toute la surface. */
function carteQuestion(format) {
  const { u, portrait } = FORMATS[format]
  const c = THEMES.accent
  return {
    style: `
      .rail { display: flex; align-items: center; gap: ${20 * u}px; }
      .rail .barre { height: 1px; background: ${c.trait}; flex: 1; }
      .points { display: flex; align-items: flex-end; gap: 0; }
      h1 { max-width: ${portrait ? '14ch' : '15ch'}; }
    `,
    html: `<div class="carte">
      ${enTete('accent', '01')}
      <div class="corps">
        <div class="surtitre">La question</div>
        <h1>Qu’est-ce que je dois revoir aujourd’hui&nbsp;?</h1>
        <div class="rail"><span class="barre"></span>${marque(c.encre, portrait ? 160 : 200)}</div>
        <p class="chapeau">Revoir planifie vos révisions par répétition espacée et répond
          à cette seule question. <strong>Il garde ce que vous voulez revoir et quand —
          jamais ce que vous apprenez.</strong></p>
      </div>
      <div class="pied"><span><b>Application web installable</b> · hors ligne</span>
        <span>Aucun compte · aucun serveur</span></div>
    </div>`,
  }
}

/** 2 — le principe, montré par la frise plutôt que raconté. */
function cartePrincipe(format) {
  const { u, portrait } = FORMATS[format]
  const c = THEMES.papier
  const dates = ['2 sept.', '4 sept.', '8 sept.', '15 sept.', '1er oct.']
  const g = frise(SIMPLE)

  /*
   * La frise se dessine dans un repère de 1000 de large, quel que soit le
   * format : c'est sa hauteur qui change. Couchée, elle a la place de s'étirer ;
   * debout, elle n'a que la largeur de l'écran, et une frise réduite à un fil de
   * cent pixels ne montrerait plus l'écart qu'elle est venue montrer.
   *
   * Debout, les dates disparaissent — et c'est la seule façon honnête de tenir
   * dans la largeur. « 2 sept. » et « 4 sept. » sont séparés par deux jours,
   * donc par presque rien : à cette échelle leurs libellés se chevauchent, et
   * un libellé illisible ment plus qu'il n'informe. Les graduations, elles,
   * disent déjà l'écart, et les cinq pastilles sous la frise le disent en mots.
   */
  const cote = portrait
    ? { H: 190, haut: 42, origine: 50, police: 32, dates: false, gauche: 190 }
    : { H: 140, haut: 26, origine: 32, police: 27, dates: true, gauche: 150 }
  const { H, police } = cote
  const axe = H / 2
  const L = 1000
  /* « départ » se pose à gauche de l'origine : posé dessous, il touchait J+1. */
  const gauche = cote.gauche
  const droite = 70
  const utile = L - gauche - droite
  const x = (p) => gauche + p * utile

  const graduations = [{ position: 0 }, ...g]
    .map((point, index) => {
      const px = x(point.position)
      const haut = index === 0 ? cote.origine : cote.haut
      const large = H * 0.028
      return `<rect x="${(px - large / 2).toFixed(1)}" y="${(axe - haut).toFixed(1)}"
                width="${large.toFixed(1)}" height="${(haut * 2).toFixed(1)}"
                fill="${index === 0 ? c.encre2 : c.accent}" />`
    })
    .join('')

  const etiquettes = g
    .map((point, index) => {
      const px = x(point.position).toFixed(1)
      const date = cote.dates
        ? `<text x="${px}" y="${(axe + cote.haut + police * 0.95).toFixed(1)}"
             text-anchor="middle" fill="${c.encre2}" font-size="${police * 0.88}"
             font-family="Arial, sans-serif">${dates[index]}</text>`
        : ''
      return `<text x="${px}" y="${(axe - cote.haut - police * 0.45).toFixed(1)}"
                text-anchor="middle" fill="${c.encre}" font-size="${police}" font-weight="bold"
                font-family="Arial, sans-serif">J+${point.jour}</text>${date}`
    })
    .join('')

  return {
    style: `
      .frise { width: 100%; }
      .ecarts { display: flex; gap: ${18 * u}px; flex-wrap: wrap; }
      .ecart { border: 1px solid ${c.trait}; border-radius: 999px;
               padding: ${10 * u}px ${22 * u}px; font-size: ${26 * u}px; color: ${c.encre2}; }
      .ecart b { color: ${c.encre}; }
    `,
    html: `<div class="carte">
      ${enTete('papier', '02')}
      <div class="corps">
        <div class="surtitre">Le principe</div>
        <h1 class="moyen">Les écarts grandissent.</h1>
        <svg class="frise" viewBox="0 0 ${L} ${H}" preserveAspectRatio="xMidYMid meet">
          <rect x="${gauche}" y="${axe - 1}" width="${utile}" height="2" fill="${c.trait}" />
          ${graduations}${etiquettes}
          <text x="0" y="${(axe + police * 0.33).toFixed(1)}" text-anchor="start"
            fill="${c.encre2}" font-size="${police * 0.88}"
            font-family="Arial, sans-serif">départ</text>
        </svg>
        <div class="ecarts">
          <span class="ecart"><b>Un jour</b></span><span class="ecart"><b>trois jours</b></span>
          <span class="ecart"><b>une semaine</b></span><span class="ecart"><b>deux</b></span>
          <span class="ecart"><b>un mois</b></span>
        </div>
        <p class="chapeau">On revoit juste avant d’oublier — c’est tout ce que fait la
          répétition espacée. <strong>L’écart entre deux graduations vaut l’écart réel entre
          deux dates&nbsp;:</strong> vous ne lisez pas des nombres, vous voyez le temps s’étirer.</p>
      </div>
      <div class="pied"><span><b>Trois programmes</b> · Simple, Poussé, Ultime</span>
        <span>ou le vôtre, composé à la main</span></div>
    </div>`,
  }
}

/** 3 — les trois vues, dessinées et non décrites. */
function carteVues(format) {
  const { u } = FORMATS[format]
  const c = THEMES.papier
  const T = TEINTES

  const regle = () => {
    const hauteurs = [6, 12, 18, 22, 12, 6, 6, 18, 12, 6, 24, 6, 12, 6]
    return `<div class="regle">${hauteurs
      .map((h, i) => `<span style="height:${h * 2.1 * u}px;background:${i === 10 ? c.accent : c.encre2}"></span>`)
      .join('')}</div>`
  }

  const calendrier = () => {
    /* Septembre 2026 commence un mardi ; la semaine commence un lundi. */
    const jours = Array.from({ length: 35 }, (_, i) => i)
    const nombres = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
      .map((j) => `<span class="jour-nom">${j}</span>`).join('')
    const cases = jours
      .map((index) => {
        const j = index - 0
        if (j < 1 || j > 30) return '<span class="case vide"></span>'
        const traits = { 3: 2, 8: 2, 12: 3, 14: 2, 15: 2, 22: 2 }[j]
          ?? ([5, 11, 19, 26].includes(j) ? 1 : 0)
        const retard = j === 5
        const jour = j === 12
        return `<span class="case${jour ? ' jour' : ''}"><i>${j}</i>
          <em>${Array.from({ length: traits }, () =>
            `<b class="${retard ? 'retard' : ''}"></b>`).join('')}</em></span>`
      })
      .join('')
    return `<div class="mois entete-mois">${nombres}</div><div class="mois">${cases}</div>`
  }

  const suivi = () => {
    const lignes = [
      ['Les dérivées', ['fait', 'fait', 'jour', 'a-venir', 'a-venir']],
      ['Les limites', ['fait', 'fait', 'fait', 'retard', 'a-venir']],
      ['Les intégrales', ['fait', 'jour', 'a-venir', 'a-venir', 'hors']],
      ['Les matrices', ['fait', 'fait', 'fait', 'fait', 'a-venir']],
    ]
    return `<table class="suivi">
      <thead><tr><th>Sujet</th>${['J+1', 'J+3', 'J+7', 'J+14', 'J+30']
        .map((t) => `<th>${t}</th>`).join('')}</tr></thead>
      <tbody>${lignes
        .map(([nom, etats]) =>
          `<tr><td>${nom}</td>${etats.map((e) => `<td><span class="m ${e}"></span></td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
  }

  return {
    style: `
      .regle { display: flex; align-items: flex-end; gap: ${5 * u}px; height: ${52 * u}px; }
      .regle span { flex: 1; border-radius: 1px; }
      .mois { display: grid; grid-template-columns: repeat(7, 1fr); gap: ${4 * u}px; flex: 1; }
      .mois.entete-mois { flex: none; }
      .jour-nom { text-align: center; font-size: ${17 * u}px; color: ${c.encre2};
                  letter-spacing: 0.08em; padding-bottom: ${4 * u}px; }
      .case { border-radius: ${6 * u}px; display: flex; flex-direction: column;
              align-items: center; justify-content: center; gap: ${5 * u}px;
              font-size: ${19 * u}px; color: ${c.encre2}; min-height: 0; }
      .case.vide { visibility: hidden; }
      .case.jour { background: ${c.accentDoux}; color: ${c.encre}; font-weight: 700; }
      .case i { font-style: normal; font-variant-numeric: tabular-nums; }
      .case em { display: flex; gap: ${3 * u}px; height: ${11 * u}px; align-items: flex-end; }
      .case b { width: ${3 * u}px; height: ${9 * u}px; background: ${c.encre}; display: block; }
      .case b.retard { height: ${13 * u}px; background: ${c.retard}; }
      .suivi { width: 100%; border-collapse: collapse; font-size: ${21 * u}px; }
      .suivi th { text-align: left; font-size: ${18 * u}px; color: ${c.encre2};
                  font-weight: 700; padding: ${8 * u}px ${4 * u}px;
                  border-bottom: 1px solid ${c.trait}; letter-spacing: 0.06em; }
      .suivi th:not(:first-child) { text-align: center; }
      .suivi td { padding: ${11 * u}px ${4 * u}px; border-bottom: 1px solid ${c.trait};
                  text-align: center; }
      .suivi td:first-child { text-align: left; white-space: nowrap; overflow: hidden;
                              text-overflow: ellipsis; max-width: ${150 * u}px; }
      .m { display: inline-block; width: ${16 * u}px; height: ${16 * u}px; border-radius: 999px; }
      .m.fait { background: ${c.encre}; }
      .m.jour { background: ${c.accent}; box-shadow: 0 0 0 ${3 * u}px ${c.accentDoux}; }
      .m.retard { background: ${c.retard}; border-radius: 2px;
                  transform: rotate(45deg) scale(0.9); }
      .m.a-venir { border: ${2 * u}px solid ${c.trait}; }
      .m.hors { width: ${14 * u}px; height: ${2 * u}px; background: ${c.trait};
                border-radius: 0; vertical-align: middle; }
    `,
    html: `<div class="carte">
      ${enTete('papier', '03')}
      <div style="display:flex;flex-direction:column;gap:${14 * u}px">
        <h1 class="petit">Aujourd’hui, le calendrier, le suivi.</h1>
        <p class="chapeau">Trois façons de regarder le même travail&nbsp;: ce qui tombe
          maintenant, comment il se répartit, où en est chaque sujet.</p>
      </div>
      <div class="ecrans">
        <div class="ecran">
          <div class="ecran-nom">Aujourd’hui</div>
          <div class="ecran-corps">
            <div>
              <div class="compte">4</div>
              <div class="compte-note">révisions aujourd’hui</div>
            </div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${T.bleu}"></span>
              <span class="titre">Les hooks React</span><span class="quand">J+7</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${T.mauve}"></span>
              <span class="titre">Les accords majeurs</span><span class="quand retard">2 j</span></div>
            <div class="rangee faite"><span class="cercle coche"></span>
              <span class="pastille" style="background:${T.olive}"></span>
              <span class="titre">Le vocabulaire</span><span class="quand">fait</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${T.ocre}"></span>
              <span class="titre">Les règles de priorité</span><span class="quand">J+3</span></div>
            <div style="margin-top:auto">
              ${regle()}
              <div class="ecran-note" style="margin-top:${10 * u}px">La charge des quatorze
                prochains jours</div>
            </div>
          </div>
        </div>
        <div class="ecran">
          <div class="ecran-nom">Calendrier</div>
          <div class="ecran-corps">
            <div class="ecran-note" style="font-weight:700;color:${c.encre};font-size:${25 * u}px">
              Septembre 2026</div>
            ${calendrier()}
            <div class="ecran-note">Un trait par révision&nbsp;: plein pour ce qui reste,
              long pour le retard.</div>
          </div>
        </div>
        <div class="ecran">
          <div class="ecran-nom">Suivi</div>
          <div class="ecran-corps">
            <div class="ecran-note" style="font-weight:700;color:${c.encre};font-size:${25 * u}px">
              Mathématiques</div>
            ${suivi()}
            <div class="ecran-note" style="margin-top:auto">Cinq états, cinq formes&nbsp;:
              la couleur ne porte jamais l’information seule.</div>
          </div>
        </div>
      </div>
    </div>`,
  }
}

/** 4 — le geste, et le recalage qui le suit. */
function carteGeste(format) {
  const { u, portrait } = FORMATS[format]
  const c = THEMES.papier
  const T = TEINTES
  return {
    style: `
      /*
       * Couché, les deux moitiés se font face ; debout, elles s'empilent sur
       * toute la largeur. Un bloc centré à sa largeur de contenu laisserait la
       * maquette flotter au milieu d'un vide, ce que le format ne pardonne pas.
       */
      .scene { display: flex; gap: 56px; min-height: 0;
               flex-direction: ${portrait ? 'column' : 'row'};
               align-items: ${portrait ? 'stretch' : 'center'};
               justify-content: center; }
      .scene > * { ${portrait ? 'flex: none; width: 100%;' : 'flex: 1; min-width: 0;'} }
      .liste { background: ${c.surface}; border: 1px solid ${c.trait};
               border-radius: ${20 * u}px; padding: ${28 * u}px; display: flex;
               flex-direction: column; gap: ${6 * u}px; }
      .toast { margin-top: ${20 * u}px; background: ${c.encre}; color: ${c.papier};
               border-radius: ${14 * u}px; padding: ${18 * u}px ${24 * u}px;
               display: flex; align-items: center; justify-content: space-between;
               font-size: ${25 * u}px; }
      .toast b { text-decoration: underline; text-underline-offset: ${5 * u}px; }
      .points { display: flex; flex-direction: column; gap: ${26 * u}px; justify-content: center; }
      .point { display: flex; gap: ${20 * u}px; align-items: flex-start; }
      .point .n { font-size: ${24 * u}px; font-weight: 700; color: ${c.accent};
                  font-variant-numeric: tabular-nums; padding-top: ${6 * u}px;
                  letter-spacing: 0.1em; }
      .point p { margin: 0; font-size: ${29 * u}px; line-height: 1.4; color: ${c.encre2}; }
      .point p b { color: ${c.encre}; }
    `,
    html: `<div class="carte">
      ${enTete('papier', '04')}
      <div class="corps">
        <div style="display:flex;flex-direction:column;gap:${14 * u}px">
          <div class="surtitre">Le geste</div>
          <h1 class="moyen">Vous cochez, l’application suit.</h1>
        </div>
        <div class="scene">
        <div>
          <div class="liste">
            <div class="rangee faite"><span class="cercle coche"></span>
              <span class="pastille" style="background:${T.bleu}"></span>
              <span class="titre">Les hooks React</span><span class="quand">fait</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${T.mauve}"></span>
              <span class="titre">Les accords majeurs</span><span class="quand retard">en retard</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${T.terre}"></span>
              <span class="titre">Les règles de priorité</span><span class="quand">J+14</span></div>
          </div>
          <div class="toast"><span>Révision enregistrée</span><b>Annuler</b></div>
        </div>
        <div class="points">
          <div class="point"><span class="n">01</span>
            <p><b>En un tap</b>, depuis n’importe quelle liste, sans ouvrir de fiche
              et sans confirmation.</p></div>
          <div class="point"><span class="n">02</span>
            <p>Un toast propose <b>« Annuler »</b> pendant cinq secondes. On annule,
              on ne confirme pas.</p></div>
          <div class="point"><span class="n">03</span>
            <p>Validée en retard, une révision <b>recale les suivantes</b> en gardant
              leurs écarts — plutôt que de les faire tomber le même jour.</p></div>
          </div>
        </div>
      </div>
      <div class="pied"><span><b>Reporter</b> ne déplace que l’échéance visée</span>
        <span>« pas aujourd’hui », et rien d’autre</span></div>
    </div>`,
  }
}

/** 5 — ce que l'application ne fait pas. Sur le papier de nuit. */
function carteNeFaitPas(format) {
  const { u, portrait } = FORMATS[format]
  const c = THEMES.sombre
  const absences = ['de compte', 'de serveur', 'de synchronisation', 'de publicité',
    'de mesure d’audience', 'de notification', 'de série à tenir', 'de score']
  return {
    style: `
      body { background: ${c.papier}; color: ${c.encre}; }
      .entete-note, .surtitre, .chapeau, .pied, .legende { color: ${c.encre2}; }
      .pied { border-top-color: ${c.trait}; }
      .pied b, .chapeau strong { color: ${c.encre}; }
      .absences { display: flex; flex-wrap: wrap; gap: ${16 * u}px; max-width: ${portrait ? '100%' : '90%'}; }
      .absence { border: 1px solid ${c.trait}; border-radius: 999px;
                 padding: ${14 * u}px ${28 * u}px; font-size: ${30 * u}px; color: ${c.encre2}; }
      .absence b { color: ${c.encre}; font-weight: 700; }
    `,
    html: `<div class="carte">
      <div class="entete">
        <div class="logotype">${marque(c.encre, 84)}<span>Revoir</span></div>
        <div class="entete-note">05 / 06</div>
      </div>
      <div class="corps">
        <div class="surtitre">Ce que Revoir ne fait pas</div>
        <h1 class="moyen">Pas de serveur, donc rien à quitter l’appareil.</h1>
        <div class="absences">${absences
          .map((mot) => `<span class="absence"><b>Pas</b> ${mot}</span>`).join('')}</div>
        <p class="chapeau"><strong>Le retard est une information, pas un jugement.</strong>
          Vos données vivent dans le stockage de ce navigateur, et vous les exportez
          dans un fichier — ou dans votre agenda — à tout moment.</p>
      </div>
      <div class="pied"><span><b>Aucun appel réseau</b> à l’exécution</span>
        <span>Aucune police téléchargée · aucun CDN</span></div>
    </div>`,
  }
}

/** 6 — la fin de la série : l'icône, le nom, où le trouver. */
function carteFin(format) {
  const { u, portrait } = FORMATS[format]
  const c = THEMES.papier
  return {
    style: `
      .centre { flex: 1; display: flex; flex-direction: column; align-items: center;
                justify-content: center; text-align: center; gap: ${30 * u}px; }
      .centre h1 { max-width: ${portrait ? '18ch' : '22ch'}; }
      .centre .chapeau { max-width: ${portrait ? '100%' : '46ch'}; }
      .lien { font-size: ${28 * u}px; color: ${c.accent}; font-weight: 700;
              letter-spacing: 0.02em; }
      .badges { display: flex; gap: ${14 * u}px; flex-wrap: wrap; justify-content: center; }
      .badge { border: 1px solid ${c.trait}; border-radius: 999px;
               padding: ${10 * u}px ${24 * u}px; font-size: ${25 * u}px; color: ${c.encre2}; }
    `,
    html: `<div class="carte">
      ${enTete('papier', '06')}
      <div class="centre">
        ${icone(portrait ? 160 : 150)}
        <h1 class="moyen">Planifier ses révisions, sans stocker ce qu’on apprend.</h1>
        <p class="chapeau">Ni cours, ni fiches, ni documents&nbsp;: un titre, une catégorie,
          une date de départ, un programme. Revoir calcule les dates, vous cochez.</p>
        <div class="badges">
          <span class="badge">Installable</span><span class="badge">Hors ligne</span>
          <span class="badge">Français / English</span><span class="badge">Clair / sombre</span>
          <span class="badge">Export JSON &amp; .ics</span><span class="badge">AGPL-3.0</span>
        </div>
        <div class="lien">github.com/alarboulletmarin/revoir</div>
      </div>
    </div>`,
  }
}

const CARTES = [
  { id: '1-question', theme: 'accent', rendu: carteQuestion },
  { id: '2-principe', theme: 'papier', rendu: cartePrincipe },
  { id: '3-vues', theme: 'papier', rendu: carteVues },
  { id: '4-geste', theme: 'papier', rendu: carteGeste },
  { id: '5-ne-fait-pas', theme: 'sombre', rendu: carteNeFaitPas },
  { id: '6-fin', theme: 'papier', rendu: carteFin },
]

/* -------------------------------------------------------------------- rendu */

function chromium() {
  const candidats = [
    process.env.CHROME_BIN,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)
  const trouve = candidats.find((chemin) => existsSync(chemin))
  if (!trouve) {
    console.error('Aucun Chromium trouvé. Renseignez CHROME_BIN.')
    process.exit(1)
  }
  return trouve
}

mkdirSync(sortie, { recursive: true })
rmSync(travail, { recursive: true, force: true })
mkdirSync(travail, { recursive: true })

const navigateur = chromium()
let rendus = 0

for (const carte of CARTES) {
  for (const [format, { l, h }] of Object.entries(FORMATS)) {
    const html = page(format, carte.theme, carte.rendu(format))
    const source = join(travail, `${carte.id}-${format}.html`)
    const image = join(sortie, `revoir-${carte.id}-${format}.png`)
    writeFileSync(source, html)
    execFileSync(navigateur, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--force-color-profile=srgb', '--default-background-color=00000000',
      `--window-size=${l},${h}`, `--screenshot=${image}`, `file://${source}`,
    ], { stdio: 'pipe' })
    rendus += 1
    console.log(`  ${image.replace(racine + '/', '')}  ${l}×${h}`)
  }
}

console.log(`\n${rendus} visuels rendus dans media/social/.`)
