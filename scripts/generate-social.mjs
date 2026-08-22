// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les visuels de présentation, en 16:9 et en 9:16.
 *
 * Ils ne sont pas dessinés ailleurs puis importés : ils sont *rendus depuis le
 * design system*, comme les icônes. La palette vient de `src/styles/tokens.css`,
 * la géométrie de la frise de `src/lib/frise.ts`, et les phrases du dictionnaire
 * français de `src/i18n/fr.ts`. Une valeur qui change dans l'application change
 * ici au prochain rendu, plutôt que de laisser vieillir une image.
 *
 * Deux formats, et deux mises en page — pas un dessin et son recadrage.
 *
 * Le **16:9** est une planche : on la lit posée, de gauche à droite, et elle a
 * la place de montrer trois écrans côte à côte ou une frise étirée.
 *
 * Le **9:16** est une story : elle est tenue à bout de bras, elle dure cinq
 * secondes, et le pouce est déjà sur le bord de l'écran. Elle est donc écrite
 * autrement : un titre qui occupe le tiers de la hauteur, une seule idée, un
 * seul objet à regarder, et rien dans les bandes que l'interface d'Instagram
 * recouvre — le nom du compte en haut, la barre de réponse en bas.
 *
 * Aucune dépendance : du HTML, la pile de polices de l'application, et le
 * Chromium déjà présent pour les tests de bout en bout. Le rendu se fait à la
 * taille finale, pas à une taille intermédiaire remise à l'échelle.
 *
 *   node scripts/generate-social.mjs
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
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
const DATES_SIMPLE = ['2 sept.', '4 sept.', '8 sept.', '15 sept.', '1er oct.']

/** Le logotype : la frise du programme Simple, réduite à un signe. */
function marque(couleur, largeur = 88) {
  const hauteur = (largeur / 44) * 12
  const traits = [0, ...frise(SIMPLE).map((g) => g.position)]
    .map((p) => `<rect x="${(p * (44 - 1.6)).toFixed(2)}" y="0" width="1.6" height="12" />`)
    .join('')
  return `<svg viewBox="0 0 44 12" width="${largeur}" height="${hauteur.toFixed(1)}"
    fill="${couleur}" aria-hidden="true" style="display:block">
    <rect x="0" y="5.4" width="44" height="1.2" />${traits}</svg>`
}

/** L'icône installée : le signe posé dans son carré accent. */
function icone(taille, fond = '#52796F', encre = '#FAF9F6') {
  const traits = [0, ...frise(SIMPLE).map((g) => g.position)]
    .map((p) => `<rect x="${(10 + p * (44 - 1.6)).toFixed(2)}" y="26" width="1.6" height="12" />`)
    .join('')
  return `<svg viewBox="0 0 64 64" width="${taille}" height="${taille}"
    aria-hidden="true" style="display:block">
    <rect width="64" height="64" rx="14" fill="${fond}" />
    <g fill="${encre}"><rect x="10" y="31.4" width="44" height="1.2" />${traits}</g></svg>`
}

/** Les trois signes de la barre du bas, réduits à leur forme. */
const NAV = {
  aujourdhui: (c) => `<svg viewBox="0 0 24 24" width="30" height="30" fill="none"
    stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M8.5 12.2l2.4 2.4 4.6-4.9" /></svg>`,
  calendrier: (c) => `<svg viewBox="0 0 24 24" width="30" height="30" fill="none"
    stroke="${c}" stroke-width="1.8" stroke-linecap="round">
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>`,
  suivi: (c) => `<svg viewBox="0 0 24 24" width="30" height="30" fill="none"
    stroke="${c}" stroke-width="1.8" stroke-linecap="round">
    <path d="M4 7h16M4 12h11M4 17h7" /></svg>`,
}

/* ============================================================= LA PLANCHE 16:9
 *
 * 1920 × 1080. Une marge de 104, un logotype en haut à gauche, un filet et deux
 * mentions en bas. Le contenu tient entre les deux.
 */

const PAYSAGE = { l: 1920, h: 1080 }

function cssPaysage(theme) {
  const c = THEMES[theme]
  return `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: ${PAYSAGE.l}px; height: ${PAYSAGE.h}px; overflow: hidden;
    background: ${c.papier}; color: ${c.encre};
    font-family: Arial, 'Liberation Sans', Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .carte { width: 100%; height: 100%; padding: 104px;
           display: flex; flex-direction: column; gap: 44px; }
  .entete { display: flex; align-items: center; justify-content: space-between; }
  .logotype { display: flex; align-items: center; gap: 18px; }
  .logotype span { font-size: 26px; letter-spacing: 0.24em; text-transform: uppercase;
                   font-weight: 700; color: ${c.encre}; }
  .entete-note { font-size: 22px; letter-spacing: 0.14em; text-transform: uppercase;
                 color: ${c.encre2}; }
  .corps { flex: 1; display: flex; flex-direction: column; justify-content: center;
           gap: 36px; min-height: 0; }
  .surtitre { font-size: 26px; letter-spacing: 0.14em; text-transform: uppercase;
              color: ${c.encre2}; font-weight: 700; }
  h1 { margin: 0; font-size: 104px; line-height: 1.04; letter-spacing: -0.035em;
       font-weight: 700; max-width: 17ch; }
  h1.moyen { font-size: 84px; max-width: 20ch; }
  h1.petit { font-size: 70px; max-width: 100%; }
  .chapeau { margin: 0; font-size: 36px; line-height: 1.45; color: ${c.encre2};
             max-width: 52ch; }
  .chapeau strong { color: ${c.encre}; font-weight: 700; }
  .pied { margin-top: auto; display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
          border-top: 1px solid ${c.trait}; padding-top: 28px;
          font-size: 26px; color: ${c.encre2}; }
  .pied b { color: ${c.encre}; font-weight: 700; }

  .ecrans { display: flex; gap: 34px; flex: 1; min-height: 0; }
  .ecran { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 16px; }
  .ecran-nom { font-size: 24px; letter-spacing: 0.14em; text-transform: uppercase;
               color: ${c.encre2}; font-weight: 700; }
  .ecran-corps { flex: 1; min-height: 0; overflow: hidden; background: ${c.surface};
                 border: 1px solid ${c.trait}; border-radius: 20px; padding: 26px;
                 display: flex; flex-direction: column; gap: 16px; }
  .ecran-note { font-size: 23px; line-height: 1.4; color: ${c.encre2}; }
  .compte { font-size: 76px; line-height: 1; font-weight: 700;
            font-variant-numeric: tabular-nums; }
  .compte-note { font-size: 25px; color: ${c.encre2}; margin-top: -6px; }
  .rangee { display: flex; align-items: center; gap: 14px; font-size: 25px; padding: 8px 0; }
  .cercle { width: 26px; height: 26px; border-radius: 999px;
            border: 2px solid ${c.encre2}; flex: none; }
  .cercle.coche { border-color: ${c.fait}; background: ${c.fait}; position: relative; }
  .cercle.coche::after { content: ''; position: absolute; left: 8px; top: 4px;
    width: 7px; height: 13px; border: solid ${c.surface};
    border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
  .pastille { width: 9px; height: 9px; border-radius: 999px; flex: none; }
  .rangee .titre { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .rangee .quand { color: ${c.encre2}; font-family: ui-monospace, 'DejaVu Sans Mono', monospace;
                   font-size: 21px; font-variant-numeric: tabular-nums; }
  .rangee .quand.retard { color: ${c.retardTexte}; }
  .rangee.faite .titre { color: ${c.encre2}; }
  `
}

/* La bannière du haut : le signe, le nom, et la mention de ce que c'est. */
const enTete = (theme) => `
  <div class="entete">
    <div class="logotype">${marque(THEMES[theme].encre, 84)}<span>Revoir</span></div>
    <div class="entete-note">Répétition espacée</div>
  </div>`

/** La question à laquelle l'application répond, sur le papier retourné. */
function plancheQuestion() {
  const c = THEMES.accent
  return {
    style: `
      .rail { display: flex; align-items: center; gap: 20px; }
      .rail .barre { height: 1px; background: ${c.trait}; flex: 1; }
      h1 { max-width: 15ch; }
    `,
    html: `<div class="carte">
      ${enTete('accent')}
      <div class="corps">
        <div class="surtitre">La question</div>
        <h1>Qu’est-ce que je dois revoir aujourd’hui&nbsp;?</h1>
        <div class="rail"><span class="barre"></span>${marque(c.encre, 200)}</div>
        <p class="chapeau">Revoir planifie vos révisions par répétition espacée et répond
          à cette seule question. <strong>Il garde ce que vous voulez revoir et quand —
          jamais ce que vous apprenez.</strong></p>
      </div>
      <div class="pied"><span><b>Application web installable</b> · hors ligne</span>
        <span>Aucun compte · aucun serveur</span></div>
    </div>`,
  }
}

/** Le principe, montré par la frise plutôt que raconté. */
function planchePrincipe() {
  const c = THEMES.papier
  const g = frise(SIMPLE)
  const H = 140
  const axe = H / 2
  const L = 1000
  /* « départ » se pose à gauche de l'origine : posé dessous, il touchait J+1. */
  const gauche = 150
  const utile = L - gauche - 70
  const x = (p) => gauche + p * utile
  const police = 27

  const graduations = [{ position: 0 }, ...g]
    .map((point, index) => {
      const px = x(point.position)
      const haut = index === 0 ? 32 : 26
      return `<rect x="${(px - 2).toFixed(1)}" y="${(axe - haut).toFixed(1)}"
                width="4" height="${haut * 2}"
                fill="${index === 0 ? c.encre2 : c.accent}" />`
    })
    .join('')

  const etiquettes = g
    .map((point, index) => {
      const px = x(point.position).toFixed(1)
      return `<text x="${px}" y="${axe - 26 - police * 0.45}" text-anchor="middle"
                fill="${c.encre}" font-size="${police}" font-weight="bold"
                font-family="Arial, sans-serif">J+${point.jour}</text>
              <text x="${px}" y="${axe + 26 + police * 0.95}" text-anchor="middle"
                fill="${c.encre2}" font-size="${police * 0.88}"
                font-family="Arial, sans-serif">${DATES_SIMPLE[index]}</text>`
    })
    .join('')

  return {
    style: `
      .frise { width: 100%; }
      .ecarts { display: flex; gap: 18px; flex-wrap: wrap; }
      .ecart { border: 1px solid ${c.trait}; border-radius: 999px;
               padding: 10px 22px; font-size: 26px; color: ${c.encre2}; }
      .ecart b { color: ${c.encre}; }
    `,
    html: `<div class="carte">
      ${enTete('papier')}
      <div class="corps">
        <div class="surtitre">Le principe</div>
        <h1 class="moyen">Les écarts grandissent.</h1>
        <svg class="frise" viewBox="0 0 ${L} ${H}" preserveAspectRatio="xMidYMid meet">
          <rect x="${gauche}" y="${axe - 1}" width="${utile}" height="2" fill="${c.trait}" />
          ${graduations}${etiquettes}
          <text x="0" y="${axe + police * 0.33}" text-anchor="start" fill="${c.encre2}"
            font-size="${police * 0.88}" font-family="Arial, sans-serif">départ</text>
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

/** Les trois vues, dessinées et non décrites. */
function plancheVues() {
  const c = THEMES.papier

  const regle = () => {
    const hauteurs = [6, 12, 18, 22, 12, 6, 6, 18, 12, 6, 24, 6, 12, 6]
    return `<div class="regle">${hauteurs
      .map((h, i) => `<span style="height:${h * 2.1}px;background:${i === 10 ? c.accent : c.encre2}"></span>`)
      .join('')}</div>`
  }

  const calendrier = () => {
    /* Septembre 2026 commence un mardi ; la semaine commence un lundi. */
    const nombres = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
      .map((j) => `<span class="jour-nom">${j}</span>`).join('')
    const cases = Array.from({ length: 35 }, (_, index) => index)
      .map((j) => {
        if (j < 1 || j > 30) return '<span class="case vide"></span>'
        const traits = { 3: 2, 8: 2, 12: 3, 14: 2, 15: 2, 22: 2 }[j]
          ?? ([5, 11, 19, 26].includes(j) ? 1 : 0)
        const retard = j === 5
        return `<span class="case${j === 12 ? ' jour' : ''}"><i>${j}</i>
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
      .regle { display: flex; align-items: flex-end; gap: 5px; height: 52px; }
      .regle span { flex: 1; border-radius: 1px; }
      .mois { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; flex: 1; }
      .mois.entete-mois { flex: none; }
      .jour-nom { text-align: center; font-size: 17px; color: ${c.encre2};
                  letter-spacing: 0.08em; padding-bottom: 4px; }
      .case { border-radius: 6px; display: flex; flex-direction: column;
              align-items: center; justify-content: center; gap: 5px;
              font-size: 19px; color: ${c.encre2}; min-height: 0; }
      .case.vide { visibility: hidden; }
      .case.jour { background: ${c.accentDoux}; color: ${c.encre}; font-weight: 700; }
      .case i { font-style: normal; font-variant-numeric: tabular-nums; }
      .case em { display: flex; gap: 3px; height: 11px; align-items: flex-end; }
      .case b { width: 3px; height: 9px; background: ${c.encre}; display: block; }
      .case b.retard { height: 13px; background: ${c.retard}; }
      .suivi { width: 100%; border-collapse: collapse; font-size: 21px; }
      .suivi th { text-align: left; font-size: 18px; color: ${c.encre2}; font-weight: 700;
                  padding: 8px 4px; border-bottom: 1px solid ${c.trait};
                  letter-spacing: 0.06em; }
      .suivi th:not(:first-child) { text-align: center; }
      .suivi td { padding: 11px 4px; border-bottom: 1px solid ${c.trait}; text-align: center; }
      .suivi td:first-child { text-align: left; white-space: nowrap; overflow: hidden;
                              text-overflow: ellipsis; max-width: 150px; }
      .m { display: inline-block; width: 16px; height: 16px; border-radius: 999px; }
      .m.fait { background: ${c.encre}; }
      .m.jour { background: ${c.accent}; box-shadow: 0 0 0 3px ${c.accentDoux}; }
      .m.retard { background: ${c.retard}; border-radius: 2px; transform: rotate(45deg) scale(0.9); }
      .m.a-venir { border: 2px solid ${c.trait}; }
      .m.hors { width: 14px; height: 2px; background: ${c.trait}; border-radius: 0;
                vertical-align: middle; }
    `,
    html: `<div class="carte">
      ${enTete('papier')}
      <div style="display:flex;flex-direction:column;gap:14px">
        <h1 class="petit">Aujourd’hui, le calendrier, le suivi.</h1>
        <p class="chapeau">Trois façons de regarder le même travail&nbsp;: ce qui tombe
          maintenant, comment il se répartit, où en est chaque sujet.</p>
      </div>
      <div class="ecrans">
        <div class="ecran">
          <div class="ecran-nom">Aujourd’hui</div>
          <div class="ecran-corps">
            <div><div class="compte">4</div>
              <div class="compte-note">révisions aujourd’hui</div></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${TEINTES.bleu}"></span>
              <span class="titre">Les hooks React</span><span class="quand">J+7</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${TEINTES.mauve}"></span>
              <span class="titre">Les accords majeurs</span><span class="quand retard">2 j</span></div>
            <div class="rangee faite"><span class="cercle coche"></span>
              <span class="pastille" style="background:${TEINTES.olive}"></span>
              <span class="titre">Le vocabulaire</span><span class="quand">fait</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${TEINTES.ocre}"></span>
              <span class="titre">Les règles de priorité</span><span class="quand">J+3</span></div>
            <div style="margin-top:auto">${regle()}
              <div class="ecran-note" style="margin-top:10px">La charge des quatorze
                prochains jours</div></div>
          </div>
        </div>
        <div class="ecran">
          <div class="ecran-nom">Calendrier</div>
          <div class="ecran-corps">
            <div class="ecran-note" style="font-weight:700;color:${c.encre};font-size:25px">
              Septembre 2026</div>
            ${calendrier()}
            <div class="ecran-note">Un trait par révision&nbsp;: plein pour ce qui reste,
              long pour le retard.</div>
          </div>
        </div>
        <div class="ecran">
          <div class="ecran-nom">Suivi</div>
          <div class="ecran-corps">
            <div class="ecran-note" style="font-weight:700;color:${c.encre};font-size:25px">
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

/** Le geste, et le recalage qui le suit. */
function plancheGeste() {
  const c = THEMES.papier
  return {
    style: `
      .scene { display: flex; gap: 56px; align-items: center; justify-content: center; }
      .scene > * { flex: 1; min-width: 0; }
      .liste { background: ${c.surface}; border: 1px solid ${c.trait}; border-radius: 20px;
               padding: 28px; display: flex; flex-direction: column; gap: 6px; }
      .toast { margin-top: 20px; background: ${c.encre}; color: ${c.papier};
               border-radius: 14px; padding: 18px 24px; display: flex;
               align-items: center; justify-content: space-between; font-size: 25px; }
      .toast b { text-decoration: underline; text-underline-offset: 5px; }
      .points { display: flex; flex-direction: column; gap: 26px; justify-content: center; }
      .point { display: flex; gap: 20px; align-items: flex-start; }
      .point .n { font-size: 24px; font-weight: 700; color: ${c.accent};
                  font-variant-numeric: tabular-nums; padding-top: 6px; letter-spacing: 0.1em; }
      .point p { margin: 0; font-size: 29px; line-height: 1.4; color: ${c.encre2}; }
      .point p b { color: ${c.encre}; }
    `,
    html: `<div class="carte">
      ${enTete('papier')}
      <div class="corps">
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="surtitre">Le geste</div>
          <h1 class="moyen">Vous cochez, l’application suit.</h1>
        </div>
        <div class="scene">
          <div>
            <div class="liste">
              <div class="rangee faite"><span class="cercle coche"></span>
                <span class="pastille" style="background:${TEINTES.bleu}"></span>
                <span class="titre">Les hooks React</span><span class="quand">fait</span></div>
              <div class="rangee"><span class="cercle"></span>
                <span class="pastille" style="background:${TEINTES.mauve}"></span>
                <span class="titre">Les accords majeurs</span>
                <span class="quand retard">en retard</span></div>
              <div class="rangee"><span class="cercle"></span>
                <span class="pastille" style="background:${TEINTES.terre}"></span>
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

const ABSENCES = ['de compte', 'de serveur', 'de synchronisation', 'de publicité',
  'de mesure d’audience', 'de notification', 'de série à tenir', 'de score']

/** Ce que l'application ne fait pas. Sur le papier de nuit. */
function plancheNeFaitPas() {
  const c = THEMES.sombre
  return {
    style: `
      .absences { display: flex; flex-wrap: wrap; gap: 16px; max-width: 90%; }
      .absence { border: 1px solid ${c.trait}; border-radius: 999px; padding: 14px 28px;
                 font-size: 30px; color: ${c.encre2}; }
      .absence b { color: ${c.encre}; font-weight: 700; }
    `,
    html: `<div class="carte">
      ${enTete('sombre')}
      <div class="corps">
        <div class="surtitre">Ce que Revoir ne fait pas</div>
        <h1 class="moyen">Pas de serveur, donc rien à quitter l’appareil.</h1>
        <div class="absences">${ABSENCES
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

const BADGES = ['Installable', 'Hors ligne', 'Français / English', 'Clair / sombre',
  'Export JSON & .ics', 'AGPL-3.0']

/** La fin de la série : l'icône, le nom, où le trouver. */
function plancheFin() {
  const c = THEMES.papier
  return {
    style: `
      .centre { flex: 1; display: flex; flex-direction: column; align-items: center;
                justify-content: center; text-align: center; gap: 30px; }
      .centre h1 { max-width: 22ch; }
      .centre .chapeau { max-width: 46ch; }
      .lien { font-size: 28px; color: ${c.accent}; font-weight: 700; letter-spacing: 0.02em; }
      .badges { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
      .badge { border: 1px solid ${c.trait}; border-radius: 999px; padding: 10px 24px;
               font-size: 25px; color: ${c.encre2}; }
    `,
    html: `<div class="carte">
      ${enTete('papier')}
      <div class="centre">
        ${icone(150)}
        <h1 class="moyen">Planifier ses révisions, sans stocker ce qu’on apprend.</h1>
        <p class="chapeau">Ni cours, ni fiches, ni documents&nbsp;: un titre, une catégorie,
          une date de départ, un programme. Revoir calcule les dates, vous cochez.</p>
        <div class="badges">${BADGES.map((b) => `<span class="badge">${b}</span>`).join('')}</div>
        <div class="lien">github.com/alarboulletmarin/revoir</div>
      </div>
    </div>`,
  }
}

/* ================================================================ LA STORY 9:16
 *
 * 1080 × 1920, et deux bandes interdites : Instagram pose le nom du compte en
 * haut et la barre de réponse en bas. Rien d'utile ne descend sous 1670 ni ne
 * monte au-dessus de 200 — pas même une mention de pied, parce qu'une mention
 * qu'on ne peut pas lire vaut moins qu'un blanc assumé.
 *
 * Le reste suit : un titre qui prend le tiers de la hauteur, une seule idée par
 * écran, un seul objet à regarder. Ce n'est pas la planche rétrécie, c'est un
 * autre découpage du même propos.
 */

const STORY = { l: 1080, h: 1920 }

function cssStory(theme) {
  const c = THEMES[theme]
  return `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: ${STORY.l}px; height: ${STORY.h}px; overflow: hidden;
    background: ${c.papier}; color: ${c.encre};
    font-family: Arial, 'Liberation Sans', Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .story { width: 100%; height: 100%; padding: 196px 76px 252px;
           display: flex; flex-direction: column; gap: 56px; }
  .haut { display: flex; align-items: center; gap: 22px; }
  .haut span { font-size: 30px; letter-spacing: 0.24em; text-transform: uppercase;
               font-weight: 700; }
  .milieu { flex: 1; min-height: 0; display: flex; flex-direction: column;
            justify-content: center; gap: 40px; }
  .surtitre { font-size: 32px; letter-spacing: 0.14em; text-transform: uppercase;
              color: ${c.encre2}; font-weight: 700; }
  h1 { margin: 0; font-size: 122px; line-height: 1.02; letter-spacing: -0.035em;
       font-weight: 700; }
  h1.moyen { font-size: 100px; }
  h1.petit { font-size: 82px; }
  .chapeau { margin: 0; font-size: 42px; line-height: 1.36; color: ${c.encre2}; }
  .chapeau strong { color: ${c.encre}; font-weight: 700; }
  .bas { font-size: 32px; line-height: 1.4; color: ${c.encre2}; }
  .bas b { color: ${c.encre}; font-weight: 700; }
  `
}

const hautStory = (theme) => `
  <div class="haut">${marque(THEMES[theme].encre, 110)}<span>Revoir</span></div>`

/** Story 1 — la question, en très grand, sur le papier retourné. */
function storyQuestion() {
  const c = THEMES.accent
  return {
    style: `h1 { font-size: 128px; }
      .signe { margin: 14px 0 6px; }`,
    html: `<div class="story">
      ${hautStory('accent')}
      <div class="milieu">
        <div class="surtitre">La question</div>
        <h1>Qu’est-ce que je dois revoir aujourd’hui&nbsp;?</h1>
        <div class="signe">${marque(c.encre, 340)}</div>
        <p class="chapeau">Revoir répond à cette seule question, et à aucune autre.</p>
      </div>
      <div class="bas"><b>Aucun compte · aucun serveur</b><br>Application web installable,
        elle fonctionne hors ligne.</div>
    </div>`,
  }
}

/**
 * Story 2 — la frise, dressée.
 *
 * Couchée, elle occupait un bandeau ; debout, elle descend l'écran, et c'est le
 * format qui le demande : ce qu'on vient voir est un écart qui s'allonge, et
 * l'écran de story est haut. Les dates reviennent, parce que la place perdue en
 * largeur est reprise en hauteur — deux graduations séparées de deux jours ne
 * se marchent plus dessus quand elles se suivent verticalement.
 */
function storyPrincipe() {
  const c = THEMES.papier
  const g = frise(SIMPLE)
  const rangs = [
    { etiquette: 'départ', date: '1er sept.', position: 0, origine: true },
    ...g.map((point, index) => ({
      etiquette: `J+${point.jour}`, date: DATES_SIMPLE[index], position: point.position,
    })),
  ]
  return {
    style: `
      .verticale { position: relative; height: 740px; margin: 46px 0 40px 10px; }
      /* Le rail relie les graduations, et ne fait que cela (section 2). */
      .verticale .rail { position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
                         background: ${c.trait}; }
      .cran { position: absolute; left: 0; transform: translateY(-50%);
              display: flex; align-items: center; gap: 26px; }
      .cran .trait { width: 78px; height: 5px; background: ${c.accent}; }
      .cran.origine .trait { background: ${c.encre2}; height: 3px; width: 58px; }
      .cran .nom { font-size: 50px; font-weight: 700; letter-spacing: -0.02em; }
      .cran.origine .nom { font-size: 36px; font-weight: 400; color: ${c.encre2}; }
      .cran .date { font-size: 36px; color: ${c.encre2}; }
      .cran.origine .date { font-size: 30px; }
    `,
    html: `<div class="story">
      ${hautStory('papier')}
      <div class="milieu">
        <div class="surtitre">Le principe</div>
        <h1 class="moyen">Les écarts grandissent.</h1>
        <div class="verticale"><span class="rail"></span>
          ${rangs.map((rang) => `
            <div class="cran${rang.origine ? ' origine' : ''}" style="top:${(rang.position * 100).toFixed(2)}%">
              <span class="trait"></span><span class="nom">${rang.etiquette}</span>
              <span class="date">${rang.date}</span></div>`).join('')}
        </div>
      </div>
      <div class="bas"><b>On revoit juste avant d’oublier.</b><br>L’écart entre deux
        graduations vaut l’écart réel entre deux dates.</div>
    </div>`,
  }
}

/**
 * Story 3 — l'application elle-même, en grand.
 *
 * Trois maquettes côte à côte tiennent sur une planche ; empilées dans une
 * story, elles deviennent trois vignettes qu'on ne lit pas. Un seul écran, à la
 * taille où on le tient vraiment, en montre davantage — et la barre du bas,
 * qui est dans l'écran, nomme les deux autres vues sans qu'il faille les
 * dessiner.
 */
function storyVues() {
  const c = THEMES.papier
  const regle = () => {
    const hauteurs = [6, 12, 18, 22, 12, 6, 6, 18, 12, 6, 24, 6, 12, 6]
    return `<div class="regle">${hauteurs
      .map((h, i) => `<span style="height:${h * 2.4}px;background:${i === 10 ? c.accent : c.encre2}"></span>`)
      .join('')}</div>`
  }
  const rangee = (teinte, titre, quand, faite = false) => `
    <div class="rangee${faite ? ' faite' : ''}">
      <span class="cercle${faite ? ' coche' : ''}"></span>
      <span class="pastille" style="background:${teinte}"></span>
      <span class="titre">${titre}</span>
      <span class="quand${quand === '2 j' ? ' retard' : ''}">${quand}</span></div>`

  return {
    style: `
      .telephone { flex: 1; min-height: 0; margin: 0 auto; width: 100%; max-width: 646px;
                   background: ${c.surface}; border: 2px solid ${c.trait};
                   border-radius: 54px; overflow: hidden;
                   display: flex; flex-direction: column; }
      .tel-entete { display: flex; align-items: center; justify-content: space-between;
                    padding: 30px 34px 22px; border-bottom: 1px solid ${c.trait}; }
      .tel-entete .aide { font-size: 30px; color: ${c.encre2}; }
      .tel-corps { flex: 1; min-height: 0; padding: 30px 34px 24px;
                   display: flex; flex-direction: column; gap: 10px; }
      .tel-surtitre { font-size: 24px; letter-spacing: 0.14em; text-transform: uppercase;
                      color: ${c.encre2}; font-weight: 700; }
      .compte { font-size: 108px; line-height: 1; font-weight: 700;
                font-variant-numeric: tabular-nums; letter-spacing: -0.03em; }
      .compte-note { font-size: 32px; color: ${c.encre2}; }
      .rangee { display: flex; align-items: center; gap: 16px; font-size: 31px; padding: 13px 0; }
      .cercle { width: 34px; height: 34px; border-radius: 999px;
                border: 2px solid ${c.encre2}; flex: none; }
      .cercle.coche { border-color: ${c.fait}; background: ${c.fait}; position: relative; }
      .cercle.coche::after { content: ''; position: absolute; left: 11px; top: 6px;
        width: 9px; height: 16px; border: solid ${c.surface};
        border-width: 0 3px 3px 0; transform: rotate(45deg); }
      .pastille { width: 12px; height: 12px; border-radius: 999px; flex: none; }
      .rangee .titre { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      .rangee .quand { color: ${c.encre2}; font-family: ui-monospace, 'DejaVu Sans Mono', monospace;
                       font-size: 26px; font-variant-numeric: tabular-nums; }
      .rangee .quand.retard { color: ${c.retardTexte}; }
      .rangee.faite .titre { color: ${c.encre2}; }
      .regle { display: flex; align-items: flex-end; gap: 7px; height: 62px;
               margin-top: auto; padding-top: 30px; }
      .regle span { flex: 1; border-radius: 1px; }
      .tel-note { font-size: 26px; color: ${c.encre2}; margin-top: 12px; }
      .tel-titre { font-size: 24px; letter-spacing: 0.14em; text-transform: uppercase;
                   color: ${c.encre2}; font-weight: 700; margin-top: 26px;
                   padding-top: 22px; border-top: 1px solid ${c.trait}; }
      .tel-nav { display: flex; border-top: 1px solid ${c.trait}; padding: 18px 0 26px; }
      .onglet { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
                font-size: 24px; color: ${c.encre2}; }
      .onglet.actif { color: ${c.accent}; font-weight: 700; }
    `,
    html: `<div class="story">
      ${hautStory('papier')}
      <div class="milieu" style="gap:34px">
        <h1 class="petit">Trois vues, une barre au pouce.</h1>
        <div class="telephone">
          <div class="tel-entete">${marque(c.encre, 92)}<span class="aide">?</span></div>
          <div class="tel-corps">
            <div class="tel-surtitre">Aujourd’hui</div>
            <div class="compte">4</div>
            <div class="compte-note">révisions aujourd’hui</div>
            <div style="margin-top:14px">
              ${rangee(TEINTES.bleu, 'Les hooks React', 'J+7')}
              ${rangee(TEINTES.mauve, 'Les accords majeurs', '2 j')}
              ${rangee(TEINTES.olive, 'Le vocabulaire', 'fait', true)}
              ${rangee(TEINTES.ocre, 'Les règles de priorité', 'J+3')}
            </div>
            <div class="tel-titre">Prochaines échéances</div>
            <div>
              ${rangee(TEINTES.bleu, 'Les dérivées', 'demain')}
              ${rangee(TEINTES.terre, 'Les limites', 'jeu. 17')}
            </div>
            ${regle()}
            <div class="tel-note">La charge des quatorze prochains jours</div>
          </div>
          <div class="tel-nav">
            <div class="onglet actif">${NAV.aujourdhui(c.accent)}Aujourd’hui</div>
            <div class="onglet">${NAV.calendrier(c.encre2)}Calendrier</div>
            <div class="onglet">${NAV.suivi(c.encre2)}Suivi</div>
          </div>
        </div>
      </div>
      <div class="bas"><b>Aujourd’hui, le calendrier, le suivi.</b><br>Trois façons de
        regarder le même travail.</div>
    </div>`,
  }
}

/** Story 4 — le geste, réduit à ce qu'on voit à l'écran. */
function storyGeste() {
  const c = THEMES.papier
  return {
    style: `
      .liste { background: ${c.surface}; border: 1px solid ${c.trait}; border-radius: 26px;
               padding: 34px 32px; display: flex; flex-direction: column; gap: 4px; }
      .rangee { display: flex; align-items: center; gap: 18px; font-size: 34px; padding: 16px 0; }
      .cercle { width: 38px; height: 38px; border-radius: 999px;
                border: 2px solid ${c.encre2}; flex: none; }
      .cercle.coche { border-color: ${c.fait}; background: ${c.fait}; position: relative; }
      .cercle.coche::after { content: ''; position: absolute; left: 13px; top: 7px;
        width: 10px; height: 18px; border: solid ${c.surface};
        border-width: 0 3px 3px 0; transform: rotate(45deg); }
      .pastille { width: 13px; height: 13px; border-radius: 999px; flex: none; }
      .rangee .titre { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      .rangee .quand { color: ${c.encre2}; font-family: ui-monospace, 'DejaVu Sans Mono', monospace;
                       font-size: 28px; }
      .rangee .quand.retard { color: ${c.retardTexte}; }
      .rangee.faite .titre { color: ${c.encre2}; }
      .toast { margin-top: 26px; background: ${c.encre}; color: ${c.papier};
               border-radius: 20px; padding: 28px 34px; display: flex;
               align-items: center; justify-content: space-between; font-size: 34px; }
      .toast b { text-decoration: underline; text-underline-offset: 7px; }
      .cinq { margin-top: 18px; font-size: 30px; color: ${c.encre2}; text-align: right; }
    `,
    html: `<div class="story">
      ${hautStory('papier')}
      <div class="milieu">
        <div class="surtitre">Le geste</div>
        <h1 class="moyen">Vous cochez, l’application suit.</h1>
        <div>
          <div class="liste">
            <div class="rangee faite"><span class="cercle coche"></span>
              <span class="pastille" style="background:${TEINTES.bleu}"></span>
              <span class="titre">Les hooks React</span><span class="quand">fait</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${TEINTES.mauve}"></span>
              <span class="titre">Les accords majeurs</span>
              <span class="quand retard">en retard</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${TEINTES.terre}"></span>
              <span class="titre">Les règles de priorité</span><span class="quand">J+14</span></div>
            <div class="rangee"><span class="cercle"></span>
              <span class="pastille" style="background:${TEINTES.ocre}"></span>
              <span class="titre">Le vocabulaire du voyage</span><span class="quand">J+30</span></div>
          </div>
          <div class="toast"><span>Révision enregistrée</span><b>Annuler</b></div>
          <div class="cinq">annulable pendant cinq secondes</div>
        </div>
      </div>
      <div class="bas"><b>En un tap, sans confirmation.</b><br>Validée en retard, une
        révision recale les suivantes en gardant leurs écarts.</div>
    </div>`,
  }
}

/** Story 5 — les absences, en liste plutôt qu'en paragraphe. */
function storyNeFaitPas() {
  const c = THEMES.sombre
  return {
    style: `
      .absences { display: flex; flex-direction: column; gap: 0; margin-top: 22px; }
      .absence { display: flex; align-items: baseline; gap: 20px; font-size: 46px;
                 padding: 21px 0; border-bottom: 1px solid ${c.trait}; color: ${c.encre2}; }
      .absence:first-child { border-top: 1px solid ${c.trait}; }
      .absence b { color: ${c.encre}; font-weight: 700; }
    `,
    html: `<div class="story">
      ${hautStory('sombre')}
      <div class="milieu">
        <div class="surtitre">Ce que Revoir ne fait pas</div>
        <h1 class="moyen">Pas de serveur, donc rien à quitter l’appareil.</h1>
        <div class="absences">${['de compte', 'de serveur', 'de publicité',
          'de mesure d’audience', 'de notification', 'de série à tenir']
          .map((mot) => `<div class="absence"><b>Pas</b> ${mot}</div>`).join('')}</div>
      </div>
      <div class="bas"><b>Le retard est une information, pas un jugement.</b><br>
        Vos données vivent dans ce navigateur, et vous les exportez quand vous voulez.</div>
    </div>`,
  }
}

/** Story 6 — l'icône, le nom, où le trouver. */
function storyFin() {
  const c = THEMES.papier
  return {
    style: `
      .milieu { align-items: center; text-align: center; gap: 46px; }
      h1 { font-size: 90px; }
      .badges { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
      .badge { border: 1px solid ${c.trait}; border-radius: 999px; padding: 14px 28px;
               font-size: 30px; color: ${c.encre2}; }
      .lien { font-size: 34px; color: ${c.accent}; font-weight: 700; }
      .bas { text-align: center; }
    `,
    html: `<div class="story">
      ${hautStory('papier')}
      <div class="milieu">
        ${icone(230)}
        <h1 class="moyen">Planifier ses révisions, sans stocker ce qu’on apprend.</h1>
        <div class="badges">${BADGES.map((b) => `<span class="badge">${b}</span>`).join('')}</div>
        <div class="lien">github.com/alarboulletmarin/revoir</div>
      </div>
      <div class="bas"><b>Gratuit, libre, sans compte.</b><br>Installable depuis le
        navigateur, sur téléphone comme sur ordinateur.</div>
    </div>`,
  }
}

/* -------------------------------------------------------------------- rendu */

const CARTES = [
  { id: 'question', theme: 'accent', planche: plancheQuestion, story: storyQuestion },
  { id: 'principe', theme: 'papier', planche: planchePrincipe, story: storyPrincipe },
  { id: 'vues', theme: 'papier', planche: plancheVues, story: storyVues },
  { id: 'geste', theme: 'papier', planche: plancheGeste, story: storyGeste },
  { id: 'ne-fait-pas', theme: 'sombre', planche: plancheNeFaitPas, story: storyNeFaitPas },
  { id: 'fin', theme: 'papier', planche: plancheFin, story: storyFin },
]

const FORMATS = [
  { nom: '16x9', ...PAYSAGE, css: cssPaysage, rendu: (carte) => carte.planche() },
  { nom: '9x16', ...STORY, css: cssStory, rendu: (carte) => carte.story() },
]

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
  for (const format of FORMATS) {
    const corps = format.rendu(carte)
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>${format.css(carte.theme)}${corps.style ?? ''}</style></head>
<body>${corps.html}</body></html>`
    const source = join(travail, `${carte.id}-${format.nom}.html`)
    const image = join(sortie, `revoir-${carte.id}-${format.nom}.png`)
    writeFileSync(source, html)
    execFileSync(navigateur, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--force-color-profile=srgb', '--default-background-color=00000000',
      `--window-size=${format.l},${format.h}`, `--screenshot=${image}`, `file://${source}`,
    ], { stdio: 'pipe' })
    rendus += 1
    console.log(`  ${image.replace(racine + '/', '')}  ${format.l}×${format.h}`)
  }
}

console.log(`\n${rendus} visuels rendus dans media/social/.`)
