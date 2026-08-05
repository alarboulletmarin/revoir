# Revoir — Design System

> Document de référence unique pour l'UI de Revoir.
> Toute décision visuelle non couverte ici doit être dérivée des principes de la section 1, pas improvisée.

---

## 1. Intention

Revoir répond à une seule question : **« Qu'est-ce que je dois revoir aujourd'hui ? »**

L'interface est un objet d'établi : une règle graduée, pas un tableau de bord d'analytics. Le registre visuel est celui du papier et de l'instrument de mesure — surfaces crème, traits fins, chiffres nets, aucune ombre portée.

### Les trois règles qui priment sur tout le reste

1. **Le tableau de bord est une réponse, pas un rapport.** Une seule zone porte la réponse du jour. Tout le reste est secondaire et peut disparaître.
2. **Le geste central est la validation.** Marquer une révision comme faite se fait en un tap, depuis n'importe quelle liste, sans ouvrir de fiche et sans confirmation. On annule, on ne confirme pas.
3. **Le retard n'accuse pas.** Aucun rouge, aucun compteur culpabilisant, aucun « streak ». Le retard est une information, pas un jugement.

---

## 2. Signature : la frise

**L'élément mémorable de l'app.** Une frise graduée horizontale qui représente le programme de révision : chaque graduation est une échéance, et **l'écart entre les graduations est proportionnel à l'écart réel entre les dates**. L'espacement de la répétition espacée devient littéralement visible.

```
Simple    ├─┬──┬────┬───────┬──────────────┤
          J1 J3  J7    J14        J30

Ultime    ├┬─┬──┬───┬─────┬────────┬──────────────┬───────────────────┤
          J1 J2 J4 J7   J14    J30       J60        J90         J180  J365
```

Règles de la frise :

- Largeur des segments : `flex-grow` proportionnel à `Math.sqrt(jours_écoulés)` — la racine carrée compresse J+365 sans écraser J+1. Sans compression, le programme Ultime rend les premières graduations illisibles.
- Graduations franches : trait de 1px, hauteur 8px (échéance à venir), 12px (échéance faite). Les deux sont à pleine opacité — l'échéance faite se distingue par sa hauteur et par sa couleur.
- Remplissage : le segment parcouru est tracé en `--accent`, le reste en `--trait`.
- **Le rail et les graduations ne portent pas la même valeur.** `--trait` sur `--surface` tient à 1,2:1, très en dessous des 3:1 que la WCAG demande pour un objet graphique porteur d'information. Ce sont les graduations qui portent l'information — où tombent les échéances et à quelle distance : elles sont donc tracées en `--encre-2` (5,4:1). Le rail ne fait que les relier et reste en `--trait`, comme la règle graduée dont la frise s'inspire.
- Le curseur « aujourd'hui » est un trait vertical de 16px en `--encre`, seul élément qui dépasse la frise.

Où elle apparaît : fiche d'un élément (grande, avec libellés), item de liste (miniature de 24px de haut, sans libellés), prévisualisation du formulaire d'ajout (grande, avec dates réelles).

Où elle n'apparaît pas : partout ailleurs. Une signature qui se répète cesse d'en être une.

---

## 3. Couleurs

Aucun noir pur, aucun blanc pur. Palette de 8 valeurs, pas une de plus.

```css
--papier:   #FAF9F6;  /* fond de page */
--surface:  #FDFCF8;  /* cartes, champs */
--trait:    #E6E2D9;  /* bordures, graduations inactives */
--encre:    #2C2A26;  /* texte principal */
--encre-2:  #6B665D;  /* texte secondaire, labels */
--accent:   #52796F;  /* aujourd'hui, actif, frise parcourue */
--retard:   #B0763A;  /* ambre — jamais du rouge */
--fait:     #6A8F6B;
```

Deux variantes sombres, **uniquement pour du texte** :

```css
--retard-texte: #8A5A28;
--fait-texte:   #4F6E50;
```

### Contrastes vérifiés (sur `--papier`)

| Couleur | Ratio | Usage autorisé |
|---|---|---|
| `--encre` | 13,4:1 | tout |
| `--encre-2` | 5,4:1 | texte courant, labels |
| `--accent` | 4,6:1 | texte ≥ 15px, icônes, remplissages |
| `--retard` | 3,7:1 | **jamais en texte** — points, bordures, barres |
| `--fait` | 3,5:1 | **jamais en texte** — points, coches, barres |
| `--retard-texte` | 5,6:1 | texte |
| `--fait-texte` | 5,5:1 | texte |

Sur fond `--accent` plein, le texte est `--surface` (4,6:1) : réservé au poids 500 et à 15px minimum.

### Règle d'usage

**Une seule surface pleine `--accent` par écran.** C'est elle qui porte la hiérarchie. Si deux cellules sont pleines, la hiérarchie est morte.

### 3 bis. Teintes de matière

> Extension ajoutée après coup, pour distinguer les matières. Elle déroge à la règle des huit valeurs ci-dessus, et c'est la seule dérogation admise.

Huit teintes, dans le même registre que la palette : désaturées, aucun rouge. `--retard` et `--fait` restent réservés à leurs états et n'entrent pas dans ce jeu.

```css
--cat-ardoise: #4A6572;   --cat-prune: #6B5B7B;
--cat-olive:   #5A6B3C;   --cat-terre: #7A5B45;
--cat-bleu:    #3F6389;   --cat-teal:  #3E6B68;
--cat-mauve:   #7A5470;   --cat-ocre:  #75632A;
```

| Contraste sur `--papier` | de 5,54:1 (olive) à 5,99:1 (mauve) — toutes utilisables en texte |
|---|---|

Trois règles, sans exception :

1. **Jamais en surface pleine.** Trait, texte et pastille uniquement. Une matière qui remplirait une carte concurrencerait l'unique cellule `--accent` de l'écran, et la hiérarchie retomberait.
2. **La couleur ne porte jamais l'information seule.** Ces huit teintes ont des luminances voisines : elles ne se distinguent pas en niveaux de gris. Le nom de la matière est donc toujours écrit à côté de sa pastille.
3. **Sur fond `--accent` plein, la teinte cède.** Une teinte de matière y serait illisible : la chip repasse en `--surface`, comme le reste de la cellule héros.

Une matière sans couleur choisie en reçoit une, dérivée de son nom par hachage : elle est donc stable d'un appareil à l'autre, et aucune configuration n'est nécessaire pour que l'app soit utilisable.

---

## 4. Typographie

Deux rôles, deux familles.

```css
--police-titre: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
--police-ui:    ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

- **Instrument Sans** (variable, woff2 sous-ensemble latin, ~25 ko, auto-hébergée dans `/public/fonts`) : chiffres du bento, titres de page, titres d'éléments. Grotesque légèrement condensée, chiffres tabulaires très lisibles en grand.
- **Pile système** : tout le reste. Zéro octet, rendu natif, et l'app reste utilisable si la police ne charge pas (`font-display: swap`).

Si tu veux zéro dépendance de police, retire Instrument Sans et passe tout en pile système : le design tient, il perd juste un peu de caractère dans les grands chiffres.

### Échelle

| Token | Taille / interligne | Usage |
|---|---|---|
| `--t-champ` | 16px / 1,4 | **valeur plancher des champs de saisie** (anti-zoom iOS) |
| `--t-xl` | 28px / 1,15 | chiffres des cellules, titre de la cellule du jour |
| `--t-lg` | 20px / 1,3 | titre de page, titre de fiche |
| `--t-md` | 17px / 1,4 | titre d'élément dans une liste |
| `--t-base` | 15px / 1,5 | texte courant |
| `--t-sm` | 13px / 1,45 | labels de cellules, métadonnées |
| `--t-xs` | 12px / 1,4 | graduations de la frise, catégories |

Trois graisses seulement : 400 (courant), 500 (labels, boutons), 600 (chiffres, titres). Jamais de 700.

**Tous les chiffres, dates et compteurs** portent `font-variant-numeric: tabular-nums`. Non négociable : sans ça, les compteurs sautent à chaque validation.

Labels de cellules : 13px, poids 500, `letter-spacing: 0.02em`, en casse normale. **Pas de majuscules forcées** — le français accentué en capitales est laid et moins lisible.

---

## 5. Espacement, rayons, traits

Base 4px.

```css
--e-1:  4px;   --e-2:  8px;   --e-3: 12px;   --e-4: 16px;
--e-5: 24px;   --e-6: 32px;   --e-7: 48px;
```

- Gouttière du bento : `--e-3`
- Padding intérieur des cellules : `--e-4` (mobile), `--e-5` (≥ 768px)
- Marge de page : `--e-4`, avec `max-width: 960px` centré

Rayons — deux valeurs :

```css
--r-carte:  12px;   /* cellules bento, champs, boutons */
--r-pilule: 999px;  /* badges, chips de catégorie */
```

Traits : `1px solid var(--trait)`. C'est le seul mécanisme de séparation.

---

## 6. Élévation et mouvement

**Aucune ombre portée. Jamais.** La profondeur vient du gap qui laisse voir le `--papier` entre les cellules, et de la bordure 1px. Une ombre dans cette app est un bug.

```css
--duree-court: 120ms;
--duree-moyen: 200ms;
--courbe: cubic-bezier(0.2, 0, 0, 1);
```

**Trois animations autorisées, pas une de plus :**

1. La coche de validation (`--duree-court`, opacité + `scale` 0.9 → 1)
2. Le panneau du jour dans le calendrier (`--duree-moyen`, translation depuis le bas)
3. Le toast (`--duree-moyen`, opacité + 8px de translation)

Tout le reste : transitions de couleur sur `:hover` / `:active` en `--duree-court`, point final.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Responsive et mise en page

**Mobile first sans exception.** Chaque écran est écrit d'abord pour 320px, puis élargi. Aucune media query `max-width` dans le projet — uniquement des `min-width`. Si tu te surprends à écrire un `max-width`, c'est que le design de base a été pensé pour le bureau.

### 7.1 Points de rupture

```css
@media (min-width: 480px)  { }  /* grands mobiles */
@media (min-width: 768px)  { }  /* tablette : le bento passe à 4 colonnes */
@media (min-width: 1024px) { }  /* bureau : max-width 960px, marges --e-6 */
```

Largeurs de test obligatoires : **320, 375, 414, 768, 1024, 1280**. Le 320 n'est pas optionnel, c'est lui qui révèle tous les chevauchements.

Hauteurs : `dvh`, jamais `vh` — la barre d'URL mobile fausse `100vh` et fait dépasser le contenu sous le pli. Écran plein : `min-height: 100dvh`.

### 7.2 Grille bento

Réservée au **tableau de bord**. Le calendrier, la fiche d'élément et le formulaire utilisent une colonne simple — étendre le bento partout le banaliserait.

```css
.bento {
  display: grid;
  gap: var(--e-3);
  grid-auto-rows: minmax(96px, auto);
  grid-template-columns: repeat(2, 1fr);
  grid-template-areas:
    "aujourdhui aujourdhui"
    "retard     retard"
    "synthese   synthese";
}

@media (min-width: 768px) {
  .bento {
    grid-template-columns: repeat(4, 1fr);
    grid-template-areas:
      "aujourdhui aujourdhui retard     retard"
      "aujourdhui aujourdhui synthese   synthese"
      "aujourdhui aujourdhui calendrier calendrier";
  }
}
```

`grid-auto-rows: minmax(96px, auto)` est obligatoire : le français est plus long que l'anglais et casserait une grille à hauteur fixe.

Une zone par cellule, jamais deux rangées pour une seule carte : la cellule du jour doit pouvoir ne faire que la hauteur de son unique révision. Elle porte donc `min-height: 0` et `align-self: start` — au-delà de 768px elle couvre trois rangées, et sans cela une journée à deux révisions se retrouverait au sommet de huit cents pixels de vert.

### Inventaire des cellules

| Zone | Contenu | Comportement |
|---|---|---|
| `aujourdhui` | **Cellule héros, fond `--accent` plein.** Titre « 3 révisions aujourd'hui » + liste cochable directement dans la cellule | Si 0 : bascule en état vide (section 8.9) |
| `retard` | Chiffre en `--retard-texte`, point `--retard` | **Disparaît du DOM si 0** — la grille se recompose |
| `synthese` | Total restant, puis les 14 barres de charge sous leur intitulé | Toujours affichée |
| `calendrier` | Mini-mois, points de densité | **≥ 768px uniquement** |

Les six stats de la spec initiale sont volontairement réduites à trois chiffres visibles. Le reste vit dans la fiche d'élément.

Sous 480px, la cellule héros n'affiche que **3 items + « Tout voir »** : un titre et une liste complète ne tiennent pas dans une cellule à 320px. Le grand chiffre de 64px a disparu — la question du jour est une phrase, « 3 révisions aujourd'hui », et c'est le fond `--accent` plein qui porte la hiérarchie, pas la taille du texte.

### 7.3 La pile du bas — source n°1 de chevauchement

Trois éléments se disputent le bas de l'écran : le FAB, le toast et la zone système iOS. Ils sont empilés par des variables, **jamais par des valeurs en dur**.

```css
:root {
  --bas-securise: env(safe-area-inset-bottom, 0px);
  --h-fab: 56px;
  --bas-fab: calc(var(--e-4) + var(--bas-securise));
  --bas-toast: calc(var(--bas-fab) + var(--h-fab) + var(--e-3));
}
```

- Toute liste scrollable se termine par `padding-bottom: calc(var(--bas-fab) + var(--h-fab) + var(--e-5))`. Sans ça, le dernier élément est inatteignable sous le FAB — le bug le plus fréquent de ce type d'app.
- Le panneau du jour du calendrier porte `padding-bottom: var(--bas-securise)`.
- Le FAB s'efface (opacité + `translateY`) dès qu'un panneau ou une feuille modale s'ouvre. Il ne flotte jamais par-dessus.

### 7.4 Pièges d'espacement et de chevauchement

| Piège | Règle |
|---|---|
| Un titre long élargit sa cellule et casse la grille | `min-width: 0` sur **tout** enfant de grid ou de flex contenant du texte. C'est le bug n°1 des bento. |
| Le titre écrase la coche ou le chip de catégorie | Titre : `flex: 1; min-width: 0`. Coche et chip : `flex-shrink: 0`. |
| Un mot long déborde de la carte | `overflow-wrap: anywhere` sur tout texte saisi par l'utilisateur, plus `-webkit-line-clamp: 2` sur les titres de liste |
| Les libellés de la frise se chevauchent (J+1 / J+2) | Libellés masqués sous 480px, et affichés uniquement si le segment mesure plus de 32px |
| Le calendrier déborde à 320px | 7 × 44px = 308px : sous 380px la grille annule la marge de page et utilise `repeat(7, 1fr)` + `aspect-ratio: 1` |
| iOS zoome au focus d'un champ | `font-size: 16px` minimum sur `input`, `select`, `textarea` — c'est le rôle de `--t-champ` |
| Marges qui s'additionnent ou fusionnent | **Aucun composant ne porte de marge externe.** L'espacement vient exclusivement du `gap` du conteneur et de son `padding`. |
| Paysage mobile écrasé | `@media (min-height: 560px)` pour agrandir la cellule héros — jamais l'inverse |
| Double barre de défilement | Un seul conteneur scrollable par écran |

---

## 8. Composants

### 8.1 Cellule bento

```
.cellule            fond --surface, 1px --trait, --r-carte, padding --e-4
.cellule--accent    fond --accent, texte --surface, pas de bordure
.cellule--action    cliquable : :hover → fond #F3F1EA, :active → scale(0.995)
```

Structure interne, toujours dans cet ordre : chiffre → label → contenu. Le chiffre d'abord, parce que c'est ce qu'on vient chercher.

### 8.2 Item de révision (le composant le plus important de l'app)

```
┌────────────────────────────────────────────┐
│ ○   Hooks React                            │
│     Développement · ├─┬──┬────┬──────┤     │
└────────────────────────────────────────────┘
  ↑ 44×44px, cible de tap dédiée
```

- Cible de validation : **44 × 44px minimum**, séparée de la zone qui ouvre la fiche.
- Case : cercle 20px, bordure 1,5px. Coché : fond `--fait`, coche `--surface`.
- Ligne de métadonnées : catégorie en `--encre-2` + frise miniature.
- État en retard : mention « il y a 3 jours » en `--retard-texte`, et rien d'autre. **Aucune bande de couleur en bord de ligne** — elle alourdit la liste sans rien dire que la mention ne dise déjà, et la section 1 demande que le retard n'accuse pas.
- Validation : mise à jour optimiste immédiate, ligne barrée 200ms, puis retrait de la liste. Toast avec « Annuler ».

### 8.3 Frise

Voir section 2. Classes : `.frise`, `.frise--mini`, `.frise__segment`, `.frise__graduation`, `.frise__graduation--faite`, `.frise__curseur`.

### 8.4 Boutons

| Variante | Style | Usage |
|---|---|---|
| `.btn--primaire` | fond `--accent`, texte `--surface`, 48px de haut | une seule par écran |
| `.btn--discret` | fond transparent, 1px `--trait`, texte `--encre` | secondaire |
| `.btn--texte` | texte `--accent`, souligné au survol | tertiaire, liens |
| `.btn--danger` | texte `--retard-texte`, bordure `--retard` | supprimer uniquement |

Hauteur minimale 44px partout. Focus : `outline: 2px solid var(--encre); outline-offset: 2px`. Jamais `outline: none` sans remplacement.

### 8.5 Bouton flottant « + »

56px, cercle, fond `--accent`, icône plus 20px. Position : `bottom: calc(var(--e-4) + env(safe-area-inset-bottom))`, `right: var(--e-4)`. Sans le `safe-area-inset`, le bouton passe sous la barre d'accueil iOS en mode PWA.

### 8.6 Champs de formulaire

Fond `--surface`, 1px `--trait`, `--r-carte`, hauteur 48px, padding `--e-3`. Focus : bordure `--accent` + `outline` 2px. Label au-dessus, 13px, `--encre-2`. Jamais de placeholder en guise de label.

**Champ date** (`.champ-date`). Mêmes bordure, rayon, fond et padding, mais 44px de haut : on y choisit, on n'y écrit pas. Il affiche la date en toutes lettres (« 5 août 2026 ») et l'icône calendrier 18px `--encre-2` au bord droit. La valeur reste ISO. Un `input[type="date"]` transparent couvre la carte : toute la surface ouvre le sélecteur natif, au doigt comme au clavier, et un composant calendrier maison ne se justifie pas. Survol et pression sous `@media (hover: hover)` seulement.

### 8.7 Sélecteur de programme

Trois cartes empilées (Simple / Poussé / Ultime), chacune affichant **sa frise en miniature** — on choisit un rythme, pas un mot. Sélection : bordure 1,5px `--accent` + fond `#F1F4F2`. Pas de radio natif visible.

### 8.8 Barres de charge

14 barres, largeur `1fr` chacune, gap 3px, `border-radius: 2px`, hauteur proportionnelle au nombre de révisions (min 3px pour un jour vide). Opacité `--accent` de 0,25 à 1 selon la densité. La barre du jour porte un trait `--encre` de 2px à sa base — sa hauteur peut être celle d'un jour vide.

La hauteur ne porte jamais l'information seule : les barres forment une `<ul>` dont chaque `<li>` contient un texte `.invisible` — « aujourd'hui, 3 révisions », « ven. 7 août, aucune révision ». Sous l'axe, trois repères seulement — « Auj. », la date médiane, la dernière —, calés par `space-between` sur la première et la dernière barre : quatorze dates tiendraient sur seize pixels chacune à 320px.

À zéro sur les quatorze jours, les barres cèdent la place à une phrase.

### 8.9 États vides

**L'état vide « rien aujourd'hui » est l'écran le plus fréquent de l'app.** Il mérite le meilleur traitement, pas un gris triste.

```
Aucune révision prévue aujourd'hui
Prochaine révision : jeu. 6 août, 3 éléments.
```

Il reste dans la cellule héros, fond `--accent` plein. La deuxième ligne est une information utile, pas un encouragement. Aucune illustration, aucun emoji.

Une journée bouclée n'est pas une journée vide, et les deux ne se disent pas pareil : **« Tout est terminé pour aujourd'hui »** quand quelque chose était prévu, **« Aucune révision prévue aujourd'hui »** quand rien ne l'était. Sans rien à annoncer non plus, la seconde ligne devient « Les prochaines révisions apparaîtront ici. »

### 8.10 Toast

Ancré en bas, au-dessus du FAB, largeur limitée à 480px. Fond `--encre`, texte `--papier`, `--r-carte`. Deux usages seulement : validation annulable (5s) et mise à jour du Service Worker disponible.

### 8.11 Calendrier

Cases de 44px minimum — la case entière, pas le chiffre. Densité indiquée par 1 à 3 points de 4px sous le numéro (jamais plus de 3, même à 12 révisions), et sous eux le reste du compte : « +4 » en `--t-xs` `--encre-2` pour un jour à sept révisions. Trois points ne doivent pas laisser croire qu'il y a trois révisions. Le bloc points + reste garde sa hauteur qu'il soit plein ou vide, pour que les chiffres du mois tiennent tous la même ligne.

Chaque point prend la teinte de sa matière, comme la chip et la pastille (section 3 bis) — c'est le seul endroit où deux révisions d'un même jour se distinguaient d'un coup d'œil. Repli sur `--accent` pour un élément sans matière. Journée soldée : les points passent en `--fait`, un état l'emportant toujours sur une identité.

La couleur ne porte rien seule : l'étiquette du bouton donne la date, « aujourd'hui » s'il y a lieu, le nombre **réel** de révisions, « toutes faites », puis les matières du jour — trois au plus.

Deux états, deux moyens : **aujourd'hui** se marque d'un anneau `--accent`, le **jour sélectionné** d'un disque `--accent` plein. Les deux ensemble : le disque, plus un anneau posé à 2px. La bordure transparente est réservée sur toutes les cases pour qu'aucun changement d'état ne décale la grille.

Clavier : un seul jour tabulable, les flèches déplacent le focus d'un jour ou d'une semaine, Origine et Fin bornent la semaine, Page préc./suiv. changent de mois. Un jour d'un mois voisin reste cliquable et cale le calendrier sur son mois.

**Feuille du jour** (`.feuille`) : `<dialog>` ancré en bas, coins hauts en `--r-carte`, poignée de 32×4px centrée, `::backdrop` à 20 % de `--encre` pour laisser voir le mois. Hauteur suivant le contenu, plafonnée à 78dvh ; seule la liste défile. Quatre sorties : le bouton — un libellé `--t-sm` en `--encre-2`, pas une action —, Échap, le fond, et le glissement vers le bas depuis l'en-tête. Le focus entre dans la feuille à l'ouverture et revient au jour consulté à la fermeture.

Les révisions y sont listées en `.item-revision--compact` : trait de séparation plutôt que carte, et la position dans le programme écrite — « Révision 2 sur 5 · Prochaine : 8 août » — plutôt que la frise. C'est la seule liste où la frise cède la place : sur 44px de haut, quatre traits verticaux ne se lisent pas.

### 8.12 Boîte de confirmation

`<dialog>` centré (`.dialogue`), 400px au plus, `::backdrop` à 40 % de `--encre`. Deux emplois, pas un de plus : supprimer un élément, et remplacer les données par un import. Le reste s'annule, ne se confirme pas (section 1).

Le reset pose `* { margin: 0 }`, qui écrase le `margin: auto` du navigateur : **`inset: 0` et `margin: auto` sont écrits explicitement**, sans quoi la boîte se colle en haut de l'écran. Sa hauteur est plafonnée à `calc(100dvh - var(--e-6))` et son contenu défile — un titre d'élément très long ne doit pas pousser les boutons hors écran.

Les deux boutons se partagent la largeur à parts égales sous 480px, puis reprennent leur largeur naturelle, alignés à droite. Ils ne se replient jamais l'un sous l'autre. « Annuler » est toujours à gauche.

`showModal()` viserait « Annuler », qui s'ouvrirait cerclé de son anneau de focus alors que personne n'a tabulé : c'est le corps, `tabindex="-1"`, qui prend le focus — le lecteur d'écran lit le titre par `aria-labelledby`, et la première tabulation mène aux boutons. Ces réceptacles — celui-ci et celui de la feuille du calendrier — sont les deux seuls éléments du projet à porter `outline: none` : ils ne sont pas atteignables au clavier, leur anneau ne signalerait donc aucun parcours.

Trois sorties, toutes non destructrices : le bouton « Annuler », Échap et un clic sur le fond. C'est l'état de la page qui referme, jamais le navigateur seul. Et comme toute surface modale, elle efface le FAB (section 7.3).

---

## 9. Écriture

L'interface est en français, en casse normale, à l'infinitif pour les actions.

| À écrire | À ne pas écrire |
|---|---|
| Marquer comme revu | Valider · OK |
| Révision enregistrée | Bravo ! · Bien joué 🎉 |
| 3 révisions en retard | ⚠️ Attention, retard ! |
| Rien à revoir aujourd'hui. | Rien ici pour l'instant... |
| Créer l'élément | Soumettre · Enregistrer |
| Élément archivé | Opération réussie |
| Aucune révision planifiée | Oups, c'est vide ! |

Une action garde le même mot du bouton jusqu'au toast : « Archiver » produit « Élément archivé ». Zéro emoji, zéro exclamation, zéro gamification — c'est une exclusion explicite du projet.

Dates : relatif jusqu'à 7 jours (« aujourd'hui », « demain », « il y a 3 jours »), absolu au-delà (« jeudi 6 août »). `date-fns` avec la locale `fr`.

---

## 10. Plancher qualité

À vérifier avant de considérer un écran terminé :

- [ ] Toute cible tactile fait ≥ 44 × 44px
- [ ] Focus clavier visible sur chaque élément interactif, parcours complet au clavier
- [ ] `prefers-reduced-motion` respecté
- [ ] Contrastes conformes au tableau de la section 3
- [ ] Zoom à 200 % sans perte de fonction ni scroll horizontal
- [ ] Écran vérifié à **320px** : aucun scroll horizontal, aucun chevauchement, aucun texte tronqué involontairement
- [ ] `min-width: 0` sur les enfants de grid/flex contenant du texte
- [ ] Le dernier élément de chaque liste reste atteignable sous le FAB
- [ ] Champs de saisie à 16px minimum
- [ ] `100dvh` et non `100vh` ; aucune media query `max-width`
- [ ] Aucun composant ne porte de marge externe
- [ ] `lang="fr"` sur `<html>`, `<title>` propre à chaque page
- [ ] Les compteurs qui changent sont dans une région `aria-live="polite"`
- [ ] La validation d'une révision est annulable pendant 5 secondes
- [ ] `env(safe-area-inset-*)` appliqué sur le FAB et la barre de navigation
- [ ] Aucune ombre portée dans le CSS produit

---

## 11. Interdits

Ombres portées · dégradés · rouge · noir pur · blanc pur · majuscules forcées · emoji · icônes au-delà des 6 nécessaires (plus, calendrier, coche, chevron, archive, corbeille — en SVG inline, aucune librairie) · Shadcn/UI · Lucide · thème sombre · toute animation hors des trois autorisées · plus d'une cellule `--accent` pleine par écran · le bento ailleurs que sur le tableau de bord.

Seule dérogation à la palette : les huit teintes de matière de la section 3 bis, et sous les trois conditions qui y sont posées.

---

## 12. `tokens.css`

```css
:root {
  /* Couleurs */
  --papier: #FAF9F6;
  --surface: #FDFCF8;
  --surface-survol: #F3F1EA;
  --trait: #E6E2D9;
  --encre: #2C2A26;
  --encre-2: #6B665D;
  --accent: #52796F;
  --accent-doux: #F1F4F2;
  --retard: #B0763A;
  --retard-texte: #8A5A28;
  --fait: #6A8F6B;
  --fait-texte: #4F6E50;

  /* Typographie */
  --police-titre: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  --police-ui: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --t-champ: 16px;
  --t-xl: 28px;
  --t-lg: 20px;
  --t-md: 17px;
  --t-base: 15px;
  --t-sm: 13px;
  --t-xs: 12px;

  /* Espacement */
  --e-1: 4px;
  --e-2: 8px;
  --e-3: 12px;
  --e-4: 16px;
  --e-5: 24px;
  --e-6: 32px;
  --e-7: 48px;

  /* Formes */
  --r-carte: 12px;
  --r-pilule: 999px;
  --bordure: 1px solid var(--trait);

  /* Mouvement */
  --duree-court: 120ms;
  --duree-moyen: 200ms;
  --courbe: cubic-bezier(0.2, 0, 0, 1);

  /* Cibles et pile du bas */
  --cible: 44px;
  --bas-securise: env(safe-area-inset-bottom, 0px);
  --h-fab: 56px;
  --bas-fab: calc(var(--e-4) + var(--bas-securise));
  --bas-toast: calc(var(--bas-fab) + var(--h-fab) + var(--e-3));
  --purge-liste: calc(var(--bas-fab) + var(--h-fab) + var(--e-5));

  color-scheme: light;
}

/* Teintes de matière — section 3 bis. */
:root {
  --cat-ardoise: #4A6572;
  --cat-prune: #6B5B7B;
  --cat-olive: #5A6B3C;
  --cat-terre: #7A5B45;
  --cat-bleu: #3F6389;
  --cat-teal: #3E6B68;
  --cat-mauve: #7A5470;
  --cat-ocre: #75632A;
}
```
