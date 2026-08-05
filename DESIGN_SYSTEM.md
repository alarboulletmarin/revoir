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

Où elle apparaît : fiche d'un sujet (grande, avec libellés), ligne de liste (miniature de 24px de haut, sans libellés), prévisualisation du formulaire d'ajout (grande, avec dates réelles).

Où elle n'apparaît pas : partout ailleurs. Une signature qui se répète cesse d'en être une.

### Le signe de l'en-tête

Une exception, et une seule : `.appli__signe`, accolé au mot « Revoir ». Ce n'est pas une frise — aucune date ne s'y lit, ses graduations sont figées sur le programme Simple —, c'est le **logotype** : la même forme que l'icône posée sur l'écran d'accueil, à la géométrie près. Il ne compte donc pas parmi les six icônes de la section 11.

Le carré plein `--accent` de l'icône reste à l'icône. Dans l'en-tête, ce serait une seconde surface pleine sur un écran qui en compte déjà une (section 3) : le signe se pose à même le papier, tracé en `--accent`, 48px de large. Sous 32px les deux premières graduations se confondent — c'est le plancher, pas une valeur à ajuster à vue.

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

### 3 bis. Teintes de catégorie

> Extension ajoutée après coup, pour distinguer les catégories. Elle déroge à la règle des huit valeurs ci-dessus, et c'est la seule dérogation admise.

Huit teintes, dans le même registre que la palette : désaturées, aucun rouge. `--retard` et `--fait` restent réservés à leurs états et n'entrent pas dans ce jeu.

Ces huit sont ce que l'application **propose**. Elles ne bornent pas ce que l'utilisateur peut choisir : voir « Couleurs libres » plus bas.

```css
--cat-ardoise: #4A6572;   --cat-prune: #6B5B7B;
--cat-olive:   #5A6B3C;   --cat-terre: #7A5B45;
--cat-bleu:    #3F6389;   --cat-teal:  #3E6B68;
--cat-mauve:   #7A5470;   --cat-ocre:  #75632A;
```

| Contraste sur `--papier` | de 5,54:1 (olive) à 5,99:1 (mauve) — toutes utilisables en texte |
|---|---|

Trois règles, sans exception :

1. **Jamais en surface pleine.** Trait, texte et pastille uniquement. Une catégorie qui remplirait une carte concurrencerait l'unique cellule `--accent` de l'écran, et la hiérarchie retomberait.
2. **La couleur ne porte jamais l'information seule.** Ces huit teintes ont des luminances voisines : elles ne se distinguent pas en niveaux de gris. Le nom de la catégorie est donc toujours écrit à côté de sa pastille.
3. **Sur fond `--accent` plein, la teinte cède.** Une teinte de catégorie y serait illisible : la chip repasse en `--surface`, comme le reste de la cellule héros.

Une catégorie sans couleur choisie en reçoit une, dérivée de son nom par hachage : elle est donc stable d'un appareil à l'autre, et aucune configuration n'est nécessaire pour que l'app soit utilisable. La couleur appartient à la catégorie elle-même, qui est une entité — la renommer une fois la renomme partout.

Une entité que l'on **gère**, et non un sous-produit de la saisie. Elle se crée, se renomme, se recolore et se supprime depuis son écran (section 8.15), et elle survit à zéro sujet. Tant qu'elle naissait du mot tapé dans le formulaire d'un sujet et disparaissait dès que plus aucun ne la portait, on ne pouvait ni la préparer, ni la renommer — retaper le nom en fabriquait une seconde, avec sa propre couleur —, ni la garder vide.

Une base neuve en reçoit six, chacune avec sa teinte **explicite** : laissés au hachage, ces six noms ne produisent que cinq couleurs distinctes, et deux catégories livrées ensemble seraient jumelles dès le premier écran. `teinteParDefaut` garde son rôle pour tout ce qui se crée ensuite. Un test fige les six teintes distinctes, parce que c'est la raison du choix explicite et qu'elle ne se lit pas dans le code.

#### Couleurs libres

Le sélecteur propose un neuvième cercle, marqué d'un « + », qui ouvre le sélecteur de couleurs du système. **La couleur choisie est la couleur retenue.** Elle n'est ni assombrie ni désaturée pour ressembler aux huit : un jaune pâle reste un jaune pâle, sur sa pastille comme dans le sélecteur. Les huit sont ce que l'app *propose* ; une couleur choisie appartient à l'utilisateur.

Deux garde-fous seulement, et aucun n'est affaire de goût — ce sont ceux sans lesquels l'écran cesse de fonctionner.

**Le libellé doit se lire.** La teinte sert d'encre au texte de la chip : un jaune pâle y serait illisible. Les composants lisent donc **deux variables** :

| Variable | Porte | Garantie |
|---|---|---|
| `--teinte` | pastilles, points du calendrier, bordures, pastille du sélecteur | la couleur choisie, telle quelle |
| `--teinte-texte` | libellé de la chip, anneau de sélection | ≥ 4,5:1 sur `--papier` |

Pour les huit intégrées, les deux valent la même chose : elles tiennent déjà 5,5:1. Seule une couleur libre pâle les fait diverger — un rose `#ffb6c1` garde sa bordure rose et écrit son nom en `#a2606c`.

L'encre est dérivée en OKLab, où la clarté est perceptuelle : la teinte et la chroma sont conservées, seule la clarté descend, **et du minimum**. Un rose pâle donne un rose foncé, jamais un brun quelconque.

**La pastille doit se voir.** Un blanc cassé sur du papier crème est un point invisible, pas un choix. Sous 1,4:1 la couleur est descendue jusqu'à ce seuil, et pas d'un pas de plus. Ce plancher est très en deçà des 3:1 que la WCAG demande d'un objet graphique porteur d'information — la pastille n'en porte aucune, le nom de la catégorie est toujours écrit à côté (règle 2 ci-dessus).

`lib/couleurs.ts` est le seul endroit qui connaît ces nombres, et `retenirTeinte` dans `lib/categories.ts` le seul point de passage : sélecteur, import et migration l'empruntent tous.

---

## 4. Typographie

Deux rôles, deux familles.

```css
--police-titre: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
--police-ui:    ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

- **Instrument Sans** (variable, woff2 sous-ensemble latin, ~25 ko, auto-hébergée dans `/public/fonts`) : chiffres du bento, titres de page, titres de sujets. Grotesque légèrement condensée, chiffres tabulaires très lisibles en grand.
- **Pile système** : tout le reste. Zéro octet, rendu natif, et l'app reste utilisable si la police ne charge pas (`font-display: swap`).

Si tu veux zéro dépendance de police, retire Instrument Sans et passe tout en pile système : le design tient, il perd juste un peu de caractère dans les grands chiffres.

### Échelle

| Token | Taille / interligne | Usage |
|---|---|---|
| `--t-champ` | 16px / 1,4 | **valeur plancher des champs de saisie** (anti-zoom iOS) |
| `--t-xl` | 28px / 1,15 | chiffres des cellules, titre de la cellule du jour |
| `--t-lg` | 20px / 1,3 | titre de page, titre de fiche |
| `--t-md` | 17px / 1,4 | titre de sujet dans une liste |
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

L'en-tête de l'application est en **haut** et collant : la navigation y porte
les trois vues — Aujourd'hui, Calendrier, Suivi — et rien de plus. Les réglages
se tiennent dans la barre de marque, face au logotype : à 320px un quatrième
libellé ferait déborder la barre, et ce n'est pas une vue.

C'est le **seul lien de l'app réduit à son signe** (section 8.14). Partout
ailleurs, ce qui n'a pas d'icône s'écrit.

### 7.1 Points de rupture

```css
@media (min-width: 480px)  { }  /* grands mobiles */
@media (min-width: 768px)  { }  /* tablette : le bento passe à 4 colonnes */
@media (min-width: 1024px) { }  /* bureau : max-width 960px, marges --e-6 */
```

Largeurs de test obligatoires : **320, 375, 414, 768, 1024, 1280**. Le 320 n'est pas optionnel, c'est lui qui révèle tous les chevauchements.

Hauteurs : `dvh`, jamais `vh` — la barre d'URL mobile fausse `100vh` et fait dépasser le contenu sous le pli. Écran plein : `min-height: 100dvh`.

### 7.2 Grille bento

Réservée au **tableau de bord**. Le calendrier, le suivi, la fiche d'un sujet et le formulaire utilisent une colonne simple — étendre le bento partout le banaliserait.

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

Les six stats de la spec initiale sont volontairement réduites à trois chiffres visibles. Le reste vit dans la fiche d'un sujet et dans le suivi.

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

- Toute liste scrollable se termine par `padding-bottom: calc(var(--bas-fab) + var(--h-fab) + var(--e-5))`. Sans ça, la dernière ligne est inatteignable sous le FAB — le bug le plus fréquent de ce type d'app.
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
| Double barre de défilement | Un seul conteneur à défilement **vertical** par écran. Le défilement **horizontal** appartient au tableau de suivi (section 8.13), et à lui seul — jamais à la page. |

---

## 8. Composants

### 8.1 Cellule bento

```
.cellule            fond --surface, 1px --trait, --r-carte, padding --e-4
.cellule--accent    fond --accent, texte --surface, pas de bordure
.cellule--action    cliquable : :hover → fond #F3F1EA, :active → scale(0.995)
```

Structure interne, toujours dans cet ordre : chiffre → label → contenu. Le chiffre d'abord, parce que c'est ce qu'on vient chercher.

### 8.2 Ligne de révision (le composant le plus important de l'app)

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

Classes : `.ligne-revision`, `.ligne-revision--faite`, `.ligne-revision--compact`, `.ligne-revision__case`, `.ligne-revision__cercle`, `.ligne-revision__coche`.

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

**Champ de choix** (`.champ-select`). Un `<select>` natif, habillé aux mêmes bordure, rayon, fond et 48px. Le contrôle du système reste — liste roulante iOS, clavier, recherche à la frappe : même parti pris que le champ date et que la pipette du sélecteur de teinte, et pour la même raison.

`appearance: none` est nécessaire, sans quoi iOS repeint le champ à sa façon par-dessus la bordure ; il emporte la flèche native au passage. Elle est donc **redessinée** : le chevron des sept icônes, pivoté de 90°, en `--encre-2` au bord droit — aucun signe nouveau (section 11). Sans elle, le champ n'est qu'une boîte de 48px sans le moindre indice qu'elle s'ouvre.

Une pastille de teinte peut être peinte dans le champ, à gauche de la valeur (`.champ-select--pastille`) : la liste déroulée appartient au système et un `<option>` ne se colore pas de la même façon d'un navigateur à l'autre. Elle est `aria-hidden` et le nom reste écrit — section 3 bis, règle 2. Pastille et chevron sont `pointer-events: none` : c'est le `<select>` entier qui reste la cible.

Aucun `font-size` ici : le reset le pose sur tous les `select`, et le plancher anti-zoom iOS ne se redéclare jamais plus bas (section 7.4).

### 8.7 Sélecteur de programme

Des cartes empilées, chacune affichant **sa frise en miniature** — on choisit un rythme, pas un mot. Sélection : bordure 1,5px `--accent` + fond `#F1F4F2`. Pas de radio natif visible.

Les trois programmes intégrés (Simple / Poussé / Ultime) viennent en premier, puis les programmes créés par l'utilisateur, dans l'ordre de création.

#### Programmes personnalisés

Un programme est un nom et une suite d'écarts. Il se compose sur son propre écran, `/programmes/nouveau`, comme un sujet se crée sur le sien.

**Un rythme ne se tape pas, il se touche.** Une grille de graduations, une par écart proposé, chacune basculable d'un doigt. Demander « 1 3 7 14 30 » dans un champ texte suppose de savoir déjà ce qu'est un rythme de répétition espacée — c'est exactement ce que l'écran doit apprendre.

L'échelle proposée : `1 2 3 4 5 6 7 10 14 21 30 60 90 120 180 270 365`. Ce ne sont pas des nombres ronds au hasard — **au-delà de dix jours, chaque valeur tombe juste dans son unité** et porte ce nom sur sa graduation : « 1 sem. », « 3 sem. », « 1 mois », « 9 mois », « 1 an ». Jamais un « 45 j » que personne ne sait situer. Le libellé complet — « 30 jours après le départ » — reste lu par les lecteurs d'écran, en jours, la seule unité qui ne demande aucune conversion.

`J+n` n'apparaît nulle part sur cet écran. C'est la notation de l'app, pas celle d'un débutant ; elle revient sur la carte du programme, une fois créé.

Trois appuis complètent la grille :

- **Partir d'un rythme connu** — Simple, Poussé, Ultime chargent le leur d'un geste. L'écran s'ouvre d'ailleurs sur celui de Simple, jamais sur du vide : personne n'invente un rythme depuis rien, on part de ce qui marche et on l'ajuste. Corollaire tenu par un test : **tout écart des trois programmes intégrés figure dans l'échelle**, sans quoi l'un d'eux serait chargeable mais irreproductible.
- **La frise**, redessinée à chaque geste — c'est elle qui montre l'espacement, ce qu'une liste de nombres ne dit pas.
- **Le compte et la portée** en une ligne : « 7 révisions · sur trois mois ».

La portée est dérivée du dernier écart, dans les mêmes mots que les trois intégrés. En deçà de 25 jours elle s'écrit en jours : vingt jours ne sont pas un mois.

Deux règles tiennent le modèle :

1. **Le nom se change toujours, le rythme seulement tant qu'il est libre.** Les révisions d'un sujet sont écrites à sa création ; rejouer un rythme déjà entamé déplacerait des échéances que l'utilisateur a en tête. Dès qu'un sujet suit le programme, la grille cède la place à la frise du rythme figé et à son explication — le champ du nom, lui, reste ouvert.
2. **Un programme suivi ne se supprime pas.** Sa carte l'annonce — « Suivi par 3 sujets » — et le bouton disparaît. Sans cela, une fiche n'aurait plus de rythme à nommer.

Un rythme venu d'un import peut porter un écart absent de l'échelle : sa graduation vient se ranger à sa place plutôt que de le rendre immodifiable.

### 8.8 Barres de charge

14 barres, largeur `1fr` chacune, gap 3px, `border-radius: 2px`, hauteur proportionnelle au nombre de révisions (min 3px pour un jour vide). Opacité `--accent` de 0,25 à 1 selon la densité. La barre du jour porte un trait `--encre` de 2px à sa base — sa hauteur peut être celle d'un jour vide.

La hauteur ne porte jamais l'information seule : les barres forment une `<ul>` dont chaque `<li>` contient un texte `.invisible` — « aujourd'hui, 3 révisions », « ven. 7 août, aucune révision ». Sous l'axe, trois repères seulement — « Auj. », la date médiane, la dernière —, calés par `space-between` sur la première et la dernière barre : quatorze dates tiendraient sur seize pixels chacune à 320px.

À zéro sur les quatorze jours, les barres cèdent la place à une phrase.

### 8.9 États vides

**L'état vide « rien aujourd'hui » est l'écran le plus fréquent de l'app.** Il mérite le meilleur traitement, pas un gris triste.

```
Aucune révision prévue aujourd'hui
Prochaine révision : jeu. 6 août, 3 sujets.
```

Il reste dans la cellule héros, fond `--accent` plein. La deuxième ligne est une information utile, pas un encouragement. Aucune illustration, aucun emoji.

Une journée bouclée n'est pas une journée vide, et les deux ne se disent pas pareil : **« Tout est terminé pour aujourd'hui »** quand quelque chose était prévu, **« Aucune révision prévue aujourd'hui »** quand rien ne l'était. Sans rien à annoncer non plus, la seconde ligne devient « Les prochaines révisions apparaîtront ici. »

**Le vide du tout premier jour est un cas à part** : il n'y a pas de tableau de bord à rendre, il y a un projet à expliquer. Voir section 8.17.

### 8.10 Toast

Ancré en bas, au-dessus du FAB, largeur limitée à 480px. Fond `--encre`, texte `--papier`, `--r-carte`.

**Le toast porte les gestes annulables, et rien d'autre.** C'est le pendant exact de la règle 2 de la section 1 : on annule, on ne confirme pas — alors ce qui ne se confirme pas doit pouvoir s'annuler quelque part, et cet endroit est le toast. Quatre emplois, pas un de plus :

| Geste | Texte | Seconde ligne |
|---|---|---|
| valider une révision | Révision enregistrée | « Prochaines dates ajustées » si le recalage a déplacé quelque chose |
| reporter une échéance | Révision reportée | la nouvelle date |
| archiver un sujet | Sujet archivé | — |
| supprimer un programme | Programme supprimé | son nom |

Plus un cinquième cas qui n'est pas un geste : une nouvelle version mise en cache par le Service Worker, avec une durée nulle — le toast attend une décision au lieu de s'effacer.

Ce n'est pas un canal de notification : rien qui ne s'annule n'y a sa place. Une suppression **confirmée** — un sujet, une catégorie — reste une bannière `role="status"` : elle a déjà eu son écran, et il n'y a plus rien à défaire.

La première fois qu'un recalage déplace des échéances, la seconde ligne dit ce qui vient de se passer — « Les suivantes gardent leurs écarts, à partir d'aujourd'hui » — puis reprend sa forme courte. Personne ne peut deviner qu'« ajustées » veut dire « en conservant les écarts du programme », et des dates qui bougent sans explication ressemblent à une erreur de l'application. Une explication relue à chaque fois, elle, cesse d'être lue.

### 8.11 Calendrier

Cases de 44px minimum — la case entière, pas le chiffre. Densité indiquée par 1 à 3 points de 4px sous le numéro (jamais plus de 3, même à 12 révisions), et sous eux le reste du compte : « +4 » en `--t-xs` `--encre-2` pour un jour à sept révisions. Trois points ne doivent pas laisser croire qu'il y a trois révisions. Le bloc points + reste garde sa hauteur qu'il soit plein ou vide, pour que les chiffres du mois tiennent tous la même ligne.

Chaque point prend la teinte de sa catégorie, comme la chip et la pastille (section 3 bis) — c'est le seul endroit où deux révisions d'un même jour se distinguaient d'un coup d'œil. Repli sur `--accent` pour un sujet sans catégorie. Journée soldée : les points passent en `--fait`, un état l'emportant toujours sur une identité.

La couleur ne porte rien seule : l'étiquette du bouton donne la date, « aujourd'hui » s'il y a lieu, le nombre **réel** de révisions, « toutes faites », puis les catégories du jour — trois au plus.

Deux états, deux moyens : **aujourd'hui** se marque d'un anneau `--accent`, le **jour sélectionné** d'un disque `--accent` plein. Les deux ensemble : le disque, plus un anneau posé à 2px. La bordure transparente est réservée sur toutes les cases pour qu'aucun changement d'état ne décale la grille.

Clavier : un seul jour tabulable, les flèches déplacent le focus d'un jour ou d'une semaine, Origine et Fin bornent la semaine, Page préc./suiv. changent de mois. Un jour d'un mois voisin reste cliquable et cale le calendrier sur son mois.

**Feuille du jour** (`.feuille`) : `<dialog>` ancré en bas, coins hauts en `--r-carte`, poignée de 32×4px centrée, `::backdrop` à 20 % de `--encre` pour laisser voir le mois. Hauteur suivant le contenu, plafonnée à 78dvh ; seule la liste défile. Quatre sorties : le bouton — un libellé `--t-sm` en `--encre-2`, pas une action —, Échap, le fond, et le glissement vers le bas depuis l'en-tête. Le focus entre dans la feuille à l'ouverture et revient au jour consulté à la fermeture.

**Où le focus entre, au juste.** Une feuille qu'on **lit** vise son corps : l'anneau ne doit pas se poser sur « Fermer », qui est une sortie et non une action. L'argument tombe pour une feuille qui n'existe que pour qu'on y **écrive** — l'y laisser imposerait un geste de plus avant d'atteindre le premier champ. D'où `cibleFocus`, que l'appelant fournit ou non. La visée a lieu après `showModal()` : le `<dialog>` est monté bien avant de s'ouvrir, `autoFocus` y aurait tiré à blanc.

Les révisions y sont listées en `.ligne-revision--compact` : trait de séparation plutôt que carte, et la position dans le programme écrite — « Révision 2 sur 5 · Prochaine : 8 août » — plutôt que la frise. C'est la seule liste où la frise cède la place : sur 44px de haut, quatre traits verticaux ne se lisent pas.

### 8.12 Boîte de confirmation

`<dialog>` centré (`.dialogue`), 400px au plus, `::backdrop` à 40 % de `--encre`. Trois emplois, et une règle qui les réunit plutôt qu'un compte à tenir : **une action qu'aucun geste inverse ne rebâtirait**. Supprimer un sujet, remplacer les données par un import, supprimer une catégorie. Le reste s'annule, ne se confirme pas (section 1).

La suppression d'une catégorie y a sa place parce qu'elle en touche d'autres : ses sujets rejoignent « Sans catégorie », et « Annuler » d'un toast rejoue une écriture — il ne rendrait pas leur catégorie à *n* sujets sans les avoir mémorisés. La boîte annonce donc leur nombre, et qu'aucun n'est supprimé.

Le reset pose `* { margin: 0 }`, qui écrase le `margin: auto` du navigateur : **`inset: 0` et `margin: auto` sont écrits explicitement**, sans quoi la boîte se colle en haut de l'écran. Sa hauteur est plafonnée à `calc(100dvh - var(--e-6))` et son contenu défile — un titre de sujet très long ne doit pas pousser les boutons hors écran.

Les deux boutons se partagent la largeur à parts égales sous 480px, puis reprennent leur largeur naturelle, alignés à droite. Ils ne se replient jamais l'un sous l'autre. « Annuler » est toujours à gauche.

`showModal()` viserait « Annuler », qui s'ouvrirait cerclé de son anneau de focus alors que personne n'a tabulé : c'est le corps, `tabindex="-1"`, qui prend le focus — le lecteur d'écran lit le titre par `aria-labelledby`, et la première tabulation mène aux boutons. Ces réceptacles — celui-ci et la feuille du bas — sont les deux seuls éléments du projet à porter `outline: none` : ils ne sont pas atteignables au clavier, leur anneau ne signalerait donc aucun parcours.

Trois sorties, toutes non destructrices : le bouton « Annuler », Échap et un clic sur le fond. C'est l'état de la page qui referme, jamais le navigateur seul. Et comme toute surface modale, elle efface le FAB (section 7.3).

---

### 8.13 Tableau de suivi

**C'est un tableau, et il le reste sur un téléphone.** Le replier en cartes sous 480px ferait perdre exactement ce qu'on vient y chercher : comparer les sujets verticalement, les étapes horizontalement, et voir les trous. La réponse au petit écran n'est pas de supprimer le défilement horizontal, c'est de le rendre lisible.

Un tableau par catégorie, chacun dans un `<details>` repliable (`.suivi__groupe`) — **une seule catégorie ouverte par défaut**, la première. En-tête du groupe : la pastille, le nom, et trois chiffres, pas un de plus.

```
Mathématiques              8 sujets · 3 révisions en retard · 62 % terminé
┌──────────────┬─────┬─────┬─────┬──────┬──────┬──────────┐
│ Sujet        │ J+1 │ J+3 │ J+7 │ J+14 │ J+30 │ Pratique │
├──────────────┼─────┼─────┼─────┼──────┼──────┼──────────┤
│ Dérivées     │  ✓  │  ✓  │  ○  │  ·   │  ·   │  À faire │
│ Probabilités │  ✓  │  ⊙  │  ·  │  ·   │  ·   │  En cours│
└──────────────┴─────┴─────┴─────┴──────┴──────┴──────────┘
```

Le retard à zéro ne s'écrit pas : « 0 en retard » rappellerait un problème à qui n'en a aucun (section 1, règle 3). Aucun graphique, aucun score, aucun classement, aucune comparaison entre catégories.

#### Les cinq marques

Cinq états, **cinq formes** — elles doivent se distinguer en niveaux de gris, la couleur ne portant jamais l'information seule. Tout est dessiné en CSS : la section 11 arrête la liste des icônes à sept, et la coche, qui en fait partie, est la seule reprise ici.

| État | Marque | Couleur |
|---|---|---|
| effectuée | disque 20px + coche 12px | `--fait`, coche `--surface` |
| à effectuer aujourd'hui | anneau 20px, trait 1,5px | `--accent` |
| en retard | anneau 20px + point plein 6px au centre | `--retard` |
| à venir | point 4px | `--encre-2` |
| hors programme | filet 8 × 1px | `--trait` |

C'est le vocabulaire déjà en place : le disque coché est celui de la section 8.2, l'anneau et le disque sont ceux du calendrier (section 8.11). Chaque case porte en plus un texte `.invisible` complet — « Dérivées, révision à 1 semaine, en retard depuis le 3 août » — parce qu'une forme ne se lit pas.

La marque fait 16 à 20px, mais c'est la **cellule entière** qui se touche : `min-height` et `min-width` à `var(--cible)`. Une case hors programme n'est pas un bouton — il n'y a rien à ouvrir, et une cible tactile qui ne fait rien est pire que pas de cible.

**Une légende dit ce que les formes veulent dire** (`.legende`, composant `LegendeSuivi`). Le texte `.invisible` de chaque case n'aide que les lecteurs d'écran ; l'œil, lui, devait deviner qu'un anneau au point central veut dire « en retard ». Elle est repliée dans un `<details>` au-dessus des tableaux : une légende sert une fois, et huit lignes au-dessus du tableau à chaque visite feraient payer aux habitués ce que les nouveaux venus lisent une seule fois. Le même composant est déplié sur la page d'aide (section 8.16).

#### Deux modes de colonnes

**Intervalles** nomme les étapes par leur écart — J+1, J+3, J+7 —, à partir de l'**union** des écarts de la catégorie. Un tableau par ligne interdirait la comparaison verticale ; l'union la préserve, et une étape absente d'un programme s'y lit « hors programme ». Plus informatif, mais une catégorie mêlant Simple et Ultime compte jusqu'à dix-sept colonnes.

**Compact** les numérote — R1, R2, R3 —, et un en-tête tient alors dans 44px. C'est la condition pour que le tableau reste un tableau sur un téléphone, pas un repli esthétique.

Tant que rien n'a été choisi, le mode suit la largeur : compact sous 768px, intervalles au-delà. Dès qu'on choisit, c'est le choix qui vaut, et il est retenu en `localStorage` — comme le pli des catégories. Ce sont des préférences d'affichage : elles ne s'exportent pas et ne valent que pour cet appareil.

#### Colonne figée, en-tête figé

La première colonne reste visible pendant le défilement horizontal (`position: sticky; left: 0`). Sans elle, glisser vers la droite fait perdre la ligne qu'on lisait. La cellule d'angle porte les **deux** classes de collage, faute de quoi le mot « Sujet » file vers la gauche pendant que les titres de ligne restent en place.

Deux contraintes que le CSS impose, et qu'il faut connaître avant d'y toucher :

- **`border-collapse: separate` est obligatoire.** Avec `collapse`, les bordures des cellules collantes ne se peignent pas au défilement. Chaque cellule ne porte donc qu'un trait bas — et la colonne figée, un trait droit —, sans quoi deux bordures voisines feraient 2px.
- **Un élément qui défile horizontalement devient sa propre zone de défilement dans les deux sens.** `overflow-y: visible` n'existe plus à côté d'un `overflow-x: auto` : il vaut `auto`. Un `<thead>` collant s'y cale donc sur le cadre et non sur la page. D'où `top: 0` et un plafond de hauteur — `calc(100dvh - var(--h-entete) - var(--e-5))` : l'en-tête colle au haut du tableau, et le cadre ne défile verticalement que pour un tableau plus haut qu'un écran. En deçà, la page reste le seul conteneur qui défile.

#### Dire le défilement, sans ombre ni dégradé

Les deux sont interdits (section 11). Quatre moyens, tous conformes, et aucun masquage silencieux :

1. le trait vertical `--trait` en bord de colonne figée ;
2. des colonnes de 44px, telles que la suivante est toujours entamée à l'écran ;
3. `scrollbar-width: thin` — une barre visible sur ordinateur ;
4. une phrase, `--t-sm` en `--encre-2` : « Faites glisser pour voir la suite. » Elle ne s'affiche que si le tableau déborde vraiment — le composant le mesure plutôt que de le supposer.

Le cadre porte `role="region"`, `tabindex="0"` et un `aria-label` : un conteneur qui défile doit être atteignable au clavier, sans quoi il n'existe que pour la souris et le doigt. La table porte une `<caption>` en `.invisible`, les en-têtes un `scope="col"`, et la cellule du sujet un `<th scope="row">` — c'est elle qui nomme sa ligne.

L'anneau de focus passe en `outline-offset: -2px` **dans le tableau seulement** : posé à l'extérieur, il serait rogné par le cadre. C'est un déplacement de l'anneau, pas sa suppression.

#### Toucher une cellule

Une feuille du bas (section 8.11), **une par page et non une par case** : un tableau de deux cents cases ne peut pas porter deux cents feuilles.

| État | Contenu |
|---|---|
| aujourd'hui, en retard | « Révision 3 sur 7 · prévue le 12 août » · **Marquer comme effectuée** · **Reporter à demain** · **Voir le sujet** |
| à venir | « prévue le 12 août » · **Marquer comme effectuée** · **Reporter d'un jour** · **Voir le sujet** |
| effectuée | « effectuée le 12 août » · **Annuler la validation** · **Voir le sujet** |
| Pratique | les trois états, en radios. **Jamais un cycle au toucher** : un changement accidentel serait trop facile |

Une révision à venir se valide comme les autres. Elle l'était déjà depuis la feuille du calendrier, depuis « Prochaines révisions » et depuis la fiche : le panneau était le seul écran à la refuser, ce qui ne se lisait pas comme une règle mais comme une case morte. Réviser en avance est un usage, pas une erreur.

La validation passe par `useValidation`, jamais par le contexte directement : c'est ce qui fait hériter du toast « Annuler » de cinq secondes (section 1, règle 2).

#### La colonne Pratique

Elle porte du texte — « À faire », « En cours », « Terminée » — et non une sixième marque. La pratique n'est pas une étape de programme mais un état, et lui inventer une forme brouillerait le vocabulaire des cinq autres. Elle est la dernière colonne, là où la largeur coûte le moins.

---

### 8.14 Le signe des réglages

La septième icône, et la seule ajoutée après coup. Elle mérite sa justification.

**Des curseurs, pas un engrenage.** L'engrenage est le signe générique de
l'interface logicielle : il dirait « logiciel » là où toute l'app dit « papier
et instrument de mesure » (section 1). Deux rails gradués que l'on fait
coulisser disent la même chose et rappellent la frise, qui est la signature
(section 2). Le registre tient jusque dans l'en-tête.

**Le mot ne disparaît pas, il change de place.** `aria-label` le porte pour les
lecteurs d'écran, `title` l'affiche au survol. Une icône sans nom n'est pas une
icône, c'est une devinette — et celle-ci est le seul lien de l'app à ne pas
écrire le sien.

Le signe fait 20px, sa cible 44 (`min-width: var(--cible)`) : c'est le carré
qui se touche, pas le dessin. Repos `--encre-2`, actif `--accent` sur
`--accent-doux`, comme un lien de navigation.

---

### 8.15 Catégories

**On désigne une catégorie, on ne la tape pas.** Le formulaire d'un sujet portait un champ libre doublé d'un `datalist` : une faute de frappe y créait une catégorie de plus, avec sa propre couleur, et rien ne permettait de la corriger — retaper le nom en fabriquait une troisième. La catégorie existe maintenant avant le sujet, et le formulaire la choisit dans un champ de choix (section 8.6).

La pastille de la catégorie retenue est peinte dans le champ et suit la sélection. Le nom reste écrit, dans le champ comme dans chaque option : la couleur ne porte jamais l'information seule.

**Le raccourci de création est un bouton sous le champ**, pas une option de la liste. Une option qui n'est pas une valeur est annoncée comme une valeur par un lecteur d'écran, et laisserait le champ dans un état incohérent si l'on renonce.

Il ouvre une **feuille**, pas une navigation : le titre, la date et le programme déjà saisis sont derrière elle et l'attendent. Partir sur `/categories` reviendrait à abandonner la saisie en cours pour ranger ses étiquettes. La feuille ne porte que le nom et la couleur — c'est un raccourci, pas le formulaire complet —, et la catégorie créée devient aussitôt celle du sujet : c'est le geste qu'on venait faire. Le focus revient alors au champ, et non au bouton où `<dialog>.close()` le renvoie, sans quoi rien n'apprendrait au lecteur d'écran que la valeur a changé.

Cette feuille est rendue au milieu du formulaire du sujet : elle ne porte donc **pas** de `<form>`. Un `<form>` dans un `<form>` est interdit, et le navigateur s'y perd — il soumet pour de bon, et la page se recharge en emportant la saisie. Entrée valide quand même, mais depuis le champ de texte seul : sur une pastille de couleur, elle n'a rien à déclencher.

**L'écran** — `/categories`, atteint depuis Réglages, qui n'en garde qu'un aperçu en chips et un lien. Une carte par catégorie, sur le gabarit d'un programme créé (section 8.7) : la pastille, le nom, le nombre de sujets, puis Modifier et Supprimer. Une base neuve arrive avec six catégories (section 3 bis) ; l'état vide propose de les ajouter, pour les installations antérieures que le semis ne touche pas.

**Une catégorie portée se supprime toujours** — et c'est l'inverse d'un programme suivi, qui refuse de l'être. Le contraste n'est pas un caprice : sans rythme, une fiche n'aurait plus rien à nommer, alors qu'un sujet sans catégorie est un état normal du modèle. Ses sujets rejoignent donc « Sans catégorie », aucun n'est supprimé, et la boîte de confirmation le dit (section 8.12).

Le retour après suppression est une bannière `role="status"`, pas un toast : la section 8.10 n'en compte que deux usages, et une suppression confirmée n'est pas annulable.

---

### 8.16 Le signe de l'aide, et la page qu'il ouvre

**Un point d'interrogation, pas une huitième icône.** La section 11 arrête la liste des signes dessinés à sept, et elle n'a pas à s'allonger ici : un « ? » est une lettre. Il est cerclé au trait, à 20px comme le signe des réglages, et sa cible fait 44px — c'est le carré qui se touche, pas le caractère. Repos `--encre-2`, actif `--accent` sur `--accent-doux`, comme un lien de navigation.

Les deux signes vivent côte à côte au bout de l'en-tête (`.appli__outils`), à l'opposé du logotype. Deux cibles de 44px y tiennent encore à 320px, où la navigation occupe déjà sa propre ligne. Comme les réglages, l'aide porte son nom en `aria-label` et en `title` : un signe sans nom est une devinette.

**La page** — `/aide`, cinq sections, dans l'ordre où les questions se posent : le vocabulaire, les programmes, le retard et le recalage, lire le tableau de suivi, vos données. Elle emprunte le bloc des réglages (`.aide__bloc`) : deux écrans de texte long n'ont aucune raison de se dessiner différemment.

Elle est **hors ligne comme le reste** : aucun lien sortant, aucune capture d'écran. Ce sont les composants de l'application qui l'illustrent — la frise pour les programmes, la légende des cinq marques pour le tableau. Une capture vieillit dès la première retouche du CSS ; un composant, non.

Ce n'est pas un doublon du README. Le README s'adresse à qui regarde le dépôt — vocabulaire du modèle, format d'export, choix d'architecture. La page d'aide s'adresse à qui utilise l'application, sur un téléphone, éventuellement sans réseau.

---

### 8.17 Le premier écran

**L'écran de premier usage est la page de présentation.** Ce sont volontairement le même écran, et il est rendu par le tableau de bord tant qu'aucun sujet n'existe — donc à la même adresse, `/`.

L'application vit à la racine : `start_url` et `scope` valent « / », et des raccourcis posés sur des écrans d'accueil y pointent déjà. La déplacer sous `/app` pour loger une vitrine à sa place casserait ces installations — c'est exactement ce que les redirections de `/element/:id` évitent par ailleurs. Il n'y avait de toute façon rien à arbitrer : qui arrive sans données ne veut pas une grille de zéros, il veut savoir ce que fait ce site ; qui vient d'installer l'application veut savoir par où commencer. Une seule page répond aux deux.

Cinq temps, dans cet ordre :

1. **La question**, en titre : « Qu'est-ce que je dois revoir aujourd'hui ? » C'est la section 1, écrite telle quelle.
2. **La frise en grand**, dans sa carte. C'est l'argument, pas une illustration : elle montre en une ligne ce que trois paragraphes expliqueraient mal.
3. **Trois temps numérotés** — noter, calculer, cocher —, le troisième disant le recalage après retard.
4. **Ce que Revoir ne fait pas.** Ni compte, ni serveur, ni publicité, ni notification, ni série à tenir. C'est la moitié du projet, et personne ne la devine.
5. **Un bouton**, « Créer un sujet », et un lien texte vers l'aide. Une seule `.btn--primaire` par écran (section 8.4).

Une dernière ligne mentionne les six catégories livrées : elles existent avant le premier sujet, et les découvrir sans les avoir demandées serait une surprise.

Aucune illustration, aucun emoji, aucun témoignage, aucune section « fonctionnalités » en trois colonnes. Ce serait le premier écran du projet à trahir sa propre section 1.

Les balises `og:` de `index.html` vont avec : sans elles, un lien collé dans une conversation n'affiche qu'une adresse nue. L'image de partage est la frise, produite par le même script que les icônes (`npm run icons`).

---

## 9. Écriture

L'interface est en français, en casse normale, à l'infinitif pour les actions.

| À écrire | À ne pas écrire |
|---|---|
| Marquer comme revu | Valider · OK |
| Révision enregistrée | Bravo ! · Bien joué 🎉 |
| 3 révisions en retard | ⚠️ Attention, retard ! |
| Rien à revoir aujourd'hui. | Rien ici pour l'instant... |
| Créer le sujet | Soumettre · Enregistrer |
| Sujet archivé | Opération réussie |
| Aucune révision planifiée | Oups, c'est vide ! |

Une action garde le même mot du bouton jusqu'au toast : « Archiver » produit « Sujet archivé ». Zéro emoji, zéro exclamation, zéro gamification — c'est une exclusion explicite du projet.

Dates : relatif jusqu'à 7 jours (« aujourd'hui », « demain », « il y a 3 jours »), absolu au-delà (« jeudi 6 août »). `date-fns` avec la locale `fr`.

---

## 10. Plancher qualité

À vérifier avant de considérer un écran terminé :

- [ ] Toute cible tactile fait ≥ 44 × 44px
- [ ] Focus clavier visible sur chaque élément interactif, parcours complet au clavier
- [ ] `prefers-reduced-motion` respecté
- [ ] Contrastes conformes au tableau de la section 3
- [ ] Zoom à 200 % sans perte de fonction ni scroll horizontal **de page** — celui du tableau de suivi, à l'intérieur de son cadre, est prévu
- [ ] Écran vérifié à **320px** : aucun scroll horizontal, aucun chevauchement, aucun texte tronqué involontairement
- [ ] `min-width: 0` sur les enfants de grid/flex contenant du texte
- [ ] La dernière ligne de chaque liste reste atteignable sous le FAB
- [ ] Champs de saisie à 16px minimum
- [ ] `100dvh` et non `100vh` ; aucune media query `max-width`
- [ ] Aucun composant ne porte de marge externe
- [ ] `lang="fr"` sur `<html>`, `<title>` propre à chaque page
- [ ] Les compteurs qui changent sont dans une région `aria-live="polite"`
- [ ] La validation d'une révision est annulable pendant 5 secondes
- [ ] `env(safe-area-inset-*)` appliqué sur le FAB et la barre de navigation
- [ ] Une navigation remonte en haut de page — sauf le retour arrière, où le navigateur restaure la position
- [ ] Aucune ombre portée dans le CSS produit

---

## 11. Interdits

Ombres portées · dégradés · rouge · noir pur · blanc pur · majuscules forcées · emoji · icônes au-delà des 7 nécessaires (plus, calendrier, coche, chevron, archive, corbeille, réglages — en SVG inline, aucune librairie) · Shadcn/UI · Lucide · thème sombre · toute animation hors des trois autorisées · plus d'une cellule `--accent` pleine par écran · le bento ailleurs que sur le tableau de bord.

Le « ? » de l'aide (section 8.16) n'entame pas le compte : c'est une lettre cerclée, pas un signe dessiné. La règle vise les dessins qu'il faut apprendre à lire, et l'alphabet n'en fait pas partie.

Seule dérogation à la palette : les huit teintes de catégorie de la section 3 bis, et sous les trois conditions qui y sont posées.

Seule dérogation au défilement : le tableau de suivi défile horizontalement dans son cadre (section 8.13). Le replier en cartes sous 480px lui retirerait sa raison d'être — comparer les sujets verticalement et les étapes horizontalement —, et c'est justement ce qu'on vient y chercher. La page, elle, ne défile jamais horizontalement.

Une seule dépendance d'interface, et elle est *headless* : `@tanstack/react-table` fournit le modèle du tableau de suivi — colonnes, lignes, cellules — et pas une règle de style. Le balisage, le CSS et l'accessibilité restent écrits ici.

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

  /*
   * Hauteur de l'en-tête de l'application, qui est collant. Le tableau de
   * suivi s'y décale (section 8.13). C'est de l'arithmétique sur le gabarit
   * de l'en-tête, pas une mesure : elle change avec lui, et rien ne le
   * signalera d'autre que l'écran. 125px + zone sûre sous 480px, 69px au-delà.
   */
  --h-entete: calc(var(--e-3) + var(--haut-securise) + var(--cible)
                 + var(--e-3) + var(--cible) + var(--e-3) + 1px);   /* 125px */
  /* Largeur de la colonne figée du tableau de suivi. */
  --suivi-sujet: 120px;

  color-scheme: light;
}

/* Dès 480px, l'en-tête tient sur une ligne et la colonne du sujet s'élargit. */
@media (min-width: 480px) {
  :root {
    --h-entete: calc(var(--e-3) + var(--haut-securise) + var(--cible)
                   + var(--e-3) + 1px);                              /* 69px */
    --suivi-sujet: 180px;
  }
}

/* Teintes de catégorie — section 3 bis. */
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
