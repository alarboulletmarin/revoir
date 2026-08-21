# Revoir — Design System

> Document de référence unique pour l'UI de Revoir. > Toute décision visuelle non couverte ici doit être dérivée des principes de la section 1, pas improvisée.

---

## 1. Intention

Revoir répond à une seule question : **« Qu'est-ce que je dois revoir aujourd'hui ? »**

L'interface est un objet d'établi : une règle graduée, pas un tableau de bord d'analytics. Le registre visuel est celui du papier et de l'instrument de mesure : surfaces crème, traits fins, chiffres nets, aucune ombre portée.

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

- Largeur des segments : `flex-grow` proportionnel à `Math.sqrt(jours_écoulés)`. La racine carrée compresse J+365 sans écraser J+1. Sans compression, le programme Ultime rend les premières graduations illisibles.
- Graduations franches : trait de 1px, hauteur 8px (échéance à venir), 12px (échéance faite). Les deux sont à pleine opacité. L'échéance faite se distingue par sa hauteur et par sa couleur.
- Remplissage : le segment parcouru est tracé en `--accent`, le reste en `--trait`.
- **Le rail et les graduations ne portent pas la même valeur.** `--trait` sur `--surface` tient à 1,2:1, très en dessous des 3:1 que la WCAG demande pour un objet graphique porteur d'information. Ce sont les graduations qui portent l'information, à savoir où tombent les échéances et à quelle distance : elles sont donc tracées en `--encre-2` (5,4:1). Le rail ne fait que les relier et reste en `--trait`, comme la règle graduée dont la frise s'inspire.
- Le curseur « aujourd'hui » est un trait vertical de 16px en `--encre`, seul élément qui dépasse la frise.

Où elle apparaît : fiche d'un sujet (grande, avec libellés), ligne de liste (miniature de 24px de haut, sans libellés), prévisualisation du formulaire d'ajout (grande, avec dates réelles).

Où elle n'apparaît pas : partout ailleurs. Une signature qui se répète cesse d'en être une.

**Elle ne se confond pas avec la règle** (section 8.8), qui porte un axe calendaire et des hauteurs de charge. Deux objets, deux géométries, deux modules : la frise dit *quand reviennent les échéances d'un sujet*, la règle dit *ce que pèsent les quinze jours qui viennent*.

### Le signe de l'en-tête

Une exception, et une seule : `.appli__signe`, accolé au mot « Revoir ». Ce n'est pas une frise — aucune date ne s'y lit, ses graduations sont figées sur le programme Simple —, c'est le **logotype** : la même forme que l'icône posée sur l'écran d'accueil, à la géométrie près. Il ne compte donc pas parmi les neuf icônes de la section 11.

Le carré plein `--accent` de l'icône reste à l'icône. Dans l'en-tête, ce serait une seconde surface pleine sur un écran qui en compte déjà une (section 3) : le signe se pose à même le papier, tracé en `--accent`, 48px de large. Sous 32px les deux premières graduations se confondent : c'est le plancher, pas une valeur à ajuster à vue.

---

## 3. Couleurs

Aucun noir pur, aucun blanc pur. Palette de 8 valeurs, pas une de plus, **par thème**.

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
| `--retard` | 3,7:1 | **jamais en texte** : points, bordures, barres |
| `--fait` | 3,5:1 | **jamais en texte** : points, coches, barres |
| `--retard-texte` | 5,6:1 | texte |
| `--fait-texte` | 5,5:1 | texte |

Sur fond `--accent` plein, le texte est `--surface` (4,6:1) : réservé au poids 500 et à 15px minimum.

### 3 ter. Le thème sombre

> Ajouté après coup. La section 11 l'interdisait ; l'interdit tombe, et voici ce qui le remplace.

**Deux apparences, trois choix.** L'utilisateur choisit *clair*, *sombre* ou *système* ; le CSS ne connaît que les deux premières. « Système » n'est pas une apparence, c'est une délégation : elle est résolue en JavaScript (`state/theme.ts`) avant d'être écrite sur `<html data-theme>`. Une feuille de style qui gérerait les trois écrirait deux fois la même palette : une fois pour le choix explicite, une fois sous `@media (prefers-color-scheme: dark)`.

**Ce n'est pas le thème clair inversé.** Le registre ne change pas : papier et instrument de mesure. Le fond est un noir chaud, jamais un noir pur, et les surfaces s'**éclaircissent** en montant vers l'œil au lieu de s'assombrir.

```css
[data-theme='sombre'] {
  --papier:   #1A1917;  --surface:  #221F1C;
  --surface-survol: #2B2723;  --trait: #3A3630;
  --encre:    #EFECE4;  --encre-2: #98927F;
  --accent:   #7FA89A;  --accent-doux: #23302C;
  --retard:   #B8843F;  --retard-texte: #CF9D64;
  --fait:     #6F9670;  --fait-texte:   #8FB790;
  color-scheme: dark;
}
```

| Couleur | Ratio sur `--papier` sombre | Usage autorisé |
|---|---|---|
| `--encre` | 14,9:1 | tout |
| `--encre-2` | 5,7:1 | texte courant, labels |
| `--accent` | 6,7:1 | texte, icônes, remplissages |
| `--retard` | 5,4:1 | points, bordures, barres |
| `--fait` | 5,3:1 | points, coches, barres |
| `--retard-texte` | 7,2:1 | texte |
| `--fait-texte` | 7,8:1 | texte |

Sur fond `--accent` plein, le texte reste `--surface` : en sombre c'est une encre foncée sur un vert clair, et elle tient 6,2:1.

Trois écritures accompagnent le thème, et aucune n'est décorative :

- `data-theme` sur `<html>` sélectionne la palette ;
- `color-scheme` fait suivre les surfaces que le navigateur peint lui-même : barres de défilement, sélecteur de date, champ de couleur ;
- `<meta name="theme-color">` la barre système d'une application installée, qui resterait crème au-dessus d'un écran de nuit.

Enfin, quelques lignes en clair dans `index.html` posent `data-theme` **avant** que React ne se charge. C'est le seul défaut d'affichage que l'application ne peut pas corriger après coup : un éclair blanc a déjà eu lieu.

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

| Contraste sur `--papier` | de 5,54:1 (olive) à 5,99:1 (mauve), toutes utilisables en texte |
|---|---|

Trois règles, sans exception :

1. **Jamais en surface pleine.** Trait, texte et pastille uniquement. Une catégorie qui remplirait une carte concurrencerait l'unique cellule `--accent` de l'écran, et la hiérarchie retomberait.
2. **La couleur ne porte jamais l'information seule.** Ces huit teintes ont des luminances voisines : elles ne se distinguent pas en niveaux de gris. Le nom de la catégorie est donc toujours écrit à côté de sa pastille.
3. **Sur une surface `--accent` pleine, la teinte cède.** Une teinte de catégorie y serait illisible : la chip repasse en `--surface`, comme le texte qui l'entoure.

Les huit sont redéfinies pour le thème sombre : ce ne sont pas d'autres couleurs, ce sont les mêmes, éclaircies en OKLab — teinte et chroma conservées, seule la clarté monte — jusqu'à retrouver sur le papier de nuit le contraste qu'elles tenaient sur le clair. De 5,50:1 (ocre) à 5,54:1 (ardoise et bleu). Les composants n'en savent rien : ils lisent toujours `--teinte` et `--teinte-texte`, et ce sont les variables `--cat-*` qui changent sous eux.

Une catégorie sans couleur choisie en reçoit une, dérivée de son nom par hachage : elle est donc stable d'un appareil à l'autre, et aucune configuration n'est nécessaire pour que l'app soit utilisable. La couleur appartient à la catégorie elle-même, qui est une entité : la renommer une fois la renomme partout.

Une entité que l'on **gère**, et non un sous-produit de la saisie. Elle se crée, se renomme, se recolore et se supprime depuis son écran (section 8.15), et elle survit à zéro sujet. Tant qu'elle naissait du mot tapé dans le formulaire d'un sujet et disparaissait dès que plus aucun ne la portait, on ne pouvait ni la préparer, ni la renommer — retaper le nom en fabriquait une seconde, avec sa propre couleur —, ni la garder vide.

Une base neuve en reçoit six, chacune avec sa teinte **explicite** : laissés au hachage, ces six noms ne produisent que cinq couleurs distinctes, et deux catégories livrées ensemble seraient jumelles dès le premier écran. `teinteParDefaut` garde son rôle pour tout ce qui se crée ensuite. Un test fige les six teintes distinctes, parce que c'est la raison du choix explicite et qu'elle ne se lit pas dans le code.

#### Couleurs libres

Le sélecteur propose un neuvième cercle, marqué d'un « + », qui ouvre le sélecteur de couleurs du système. **La couleur choisie est la couleur retenue.** Elle n'est ni assombrie ni désaturée pour ressembler aux huit : un jaune pâle reste un jaune pâle, sur sa pastille comme dans le sélecteur. Les huit sont ce que l'app *propose* ; une couleur choisie appartient à l'utilisateur.

Deux garde-fous seulement, et aucun n'est affaire de goût : ce sont ceux sans lesquels l'écran cesse de fonctionner.

**Le libellé doit se lire.** La teinte sert d'encre au texte de la chip : un jaune pâle y serait illisible. Les composants lisent donc **deux variables** :

| Variable | Porte | Garantie |
|---|---|---|
| `--teinte` | pastilles, points du calendrier, bordures, pastille du sélecteur | la couleur choisie, telle quelle |
| `--teinte-texte` | libellé de la chip, anneau de sélection | ≥ 4,5:1 sur `--papier` |

Pour les huit intégrées, les deux valent la même chose : elles tiennent déjà 5,5:1. Seule une couleur libre pâle les fait diverger : un rose `#ffb6c1` garde sa bordure rose et écrit son nom en `#a2606c`.

L'encre est dérivée en OKLab, où la clarté est perceptuelle : la teinte et la chroma sont conservées, seule la clarté bouge, **et du minimum**. Un rose pâle donne un rose foncé, jamais un brun quelconque.

**Le sens dépend du fond.** Sur le papier crème, une couleur trop pâle s'assombrit ; sur le papier de nuit, la même couleur se lit déjà et c'est un bleu marine qui doit être éclairci. Assombrir dans les deux cas rendrait le thème sombre illisible pile là où le clair l'était enfin.

**La pastille doit se voir.** Un blanc cassé sur du papier crème est un point invisible, pas un choix, et un bleu marine sur du papier de nuit non plus. Sous 1,4:1 la couleur est ramenée jusqu'à ce seuil, et pas d'un pas de plus. Ce plancher est très en deçà des 3:1 que la WCAG demande d'un objet graphique porteur d'information : la pastille n'en porte aucune, le nom de la catégorie est toujours écrit à côté (règle 2 ci-dessus).

**Ce qui est enregistré ne dépend pas du thème.** L'ajustement au fond a lieu au rendu, jamais à l'écriture : `retenirTeinte` mesure toujours sur le papier clair, sinon la même catégorie vaudrait deux valeurs selon l'écran où on l'a créée, et un export ne se rejouerait plus à l'identique.

`lib/couleurs.ts` est le seul endroit qui connaît ces nombres, `retenirTeinte` dans `lib/categories.ts` le seul point de passage à l'écriture, et `components/teinte.ts` le seul à l'affichage : chip, pastille, point de calendrier et sélecteur ne peuvent pas diverger.

---

## 4. Typographie

Trois rôles, deux familles.

```css
--police-titre:    Arial, Helvetica, sans-serif;
--police-ui:       Arial, Helvetica, sans-serif;
--police-chiffres: ui-monospace, SFMono-Regular, Menlo, monospace;
```

- **`--police-titre`** : titres d'écran, de page, de section, titres de sujets, logotype.
- **`--police-ui`** : tout le reste.
- **`--police-chiffres`** : chiffres, dates, compteurs, décalages `J+n`.

**Zéro octet téléchargé, et aucun appel réseau.** C'est la contrainte du projet, pas une préférence, et elle n'a pas bougé.

Cette section a longtemps décrit une autre réalité : « Instrument Sans, variable, woff2 sous-ensemble latin, auto-hébergée dans `/public/fonts` ». Ce dossier n'a jamais existé. La question s'est reposée à la refonte — embarquer un woff2 local, ou tenir la pile système — et la réponse est restée la seconde. Ce qui change, c'est que le caractère ne se cherche plus dans un fichier de police : il vient d'**Arial nommée en tête de pile**, de **deux graisses tenues** et de **chasses réglées**.

**Pourquoi Arial et non `system-ui`.** `system-ui` n'est pas un dessin, c'est un renvoi : SF Pro sur un appareil, Roboto sur un autre, Segoe UI sur un troisième. Trois dessins qui ne portent pas le même titre à −0,035 em, et un design qu'on ne peut ni régler ni vérifier. Arial est présente partout sauf sur Linux, où le repli tombe sur Liberation Sans, dessinée à ses chasses exactes. Rien n'est téléchargé : c'est un nom, pas un fichier.

**Pourquoi une chasse fixe pour les chiffres.** Ils se lisent en colonne dans cette application — les quinze jours de la règle, les échéances d'une fiche, les comptes au bout des rangées —, et une chasse variable les décale les uns par rapport aux autres. La pile système suffit : son dessin change d'un système à l'autre, sa chasse fixe est garantie partout, et c'est elle qu'on vient chercher. Le rôle est posé à deux endroits, jamais recopié ailleurs : `time, output` dans le reset, et l'utilitaire `.chiffres` pour ce qui n'est ni l'un ni l'autre. Les deux réaffirment `font-size: 1em`, sans quoi le générique `monospace` ferait appliquer au texte la taille par défaut du navigateur — 13 px chez la plupart.

### Échelle

Deux échelles, et elles ne servent pas la même chose. Celle du corps de texte est nommée par son rang, celle des titres par son rôle : un titre ne se choisit pas par sa place dans une suite mais par ce qu'il ouvre.

| Token | Taille / interligne | Usage |
|---|---|---|
| `--t-ecran` | 34px / 1,08 | titre d'une des trois vues |
| `--t-page` | 30px / 1,1 | titre d'une page qui a un retour |
| `--t-section` | 22px / 1,2 | titre d'un bloc dans une page |
| `--t-marque` | 14px / 1 | le logotype, et lui seul |
| `--t-champ` | 16px / 1,4 | **valeur plancher des champs de saisie** (anti-zoom iOS) |
| `--t-xl` | 28px / 1,15 | grands chiffres |
| `--t-lg` | 20px / 1,3 | titre secondaire |
| `--t-md` | 17px / 1,4 | titre de sujet dans une liste |
| `--t-base` | 15px / 1,5 | texte courant |
| `--t-sm` | 13px / 1,45 | métadonnées |
| `--t-xs` | 12px / 1,4 | sur-titres, graduations, catégories |

**12px est un plancher absolu**, jamais franchi vers le bas.

Un écran ne porte jamais deux titres du même cran : c'est ce qui rend sa hiérarchie lisible sans qu'aucune couleur n'ait à s'en mêler.

### Graisses

Quatre, et pas une de plus : 400 (courant), 500 (labels, boutons), 600 (chiffres, états actifs), **700 (titres et logotype, et rien d'autre)**.

Le 700 était interdit, et l'interdit disait quelque chose de juste : une graisse de plus est une nuance de plus à distinguer, et un écran qui compte quatre poids n'en hiérarchise aucun. Il tombe pour une raison plus forte. La refonte fait porter la voix de l'écran à un seul titre — plus de cellule pleine, plus de carte en couleur —, et à 34 px resserré à −0,035 em, c'est le poids du titre qui tient le bloc. Le 600 d'Arial y rend un titre mou, qui ne dit pas qu'il est le premier objet de l'écran. Le 700 ne se répand pas pour autant : il est réservé aux trois crans de titre et au logotype, et il est absent de tout ce qui n'est pas un titre.

### Chasses

```css
--chasse-titre:    -0.035em;   /* les trois crans de titre */
--chasse-surtitre:  0.14em;    /* sur-titres, 12px, capitales */
--chasse-marque:    0.24em;    /* le logotype */
```

Les titres se resserrent parce qu'à 34 px l'espacement par défaut d'Arial creuse les mots et fait perdre au titre sa tenue de bloc. Les sur-titres et le logotype s'ouvrent au contraire : ils sont courts, petits et en capitales, trois raisons de laisser respirer.

### Capitales

**La casse forcée reste proscrite dans le texte**, et pour la raison d'origine : le français accentué en capitales est laid et moins lisible. Les labels, les libellés de boutons, les titres et les métadonnées s'écrivent en casse normale.

Elle est admise à deux endroits, tous deux hors du texte :

1. **Le logotype.** Six lettres sans accent, une fois par écran, une marque et non une phrase. Le DOM garde « Revoir » en casse normale : c'est le mot que lit un lecteur d'écran, pas six lettres épelées.
2. **Les sur-titres**, à 12 px, en `--encre-2`, ouverts à 0,14 em : « vendredi 21 août », « les quinze jours », « ensuite ». Ce sont des étiquettes de section de quelques mots, pas des phrases, et l'ouverture de la chasse compense très largement ce que la capitale coûte en lisibilité à cette taille. Un sur-titre ne porte jamais d'information qu'on ne retrouve pas dessous.

Hors de ces deux emplois, `text-transform: uppercase` est un défaut.

**Tous les chiffres, dates et compteurs** portent `font-variant-numeric: tabular-nums`, en plus de la chasse fixe. Non négociable : la chasse fixe aligne les colonnes, les chiffres tabulaires empêchent un compteur de sauter quand il change.

---

## 5. Espacement, rayons, traits

Base 4px.

```css
--e-1:  4px;   --e-2:  8px;   --e-3: 12px;   --e-4: 16px;
--e-5: 24px;   --e-6: 32px;   --e-7: 48px;
```

- Padding intérieur des cellules : `--e-4` (mobile), `--e-5` (≥ 768px)
- Marge de page : `--e-4`, avec `max-width: 960px` centré

Deux rayons :

```css
--r-carte:  12px;   /* champs, boutons, dialogues */
--r-pilule: 999px;  /* badges, chips de catégorie */
```

Traits : `1px solid var(--trait)`. C'est le seul mécanisme de séparation.

---

## 6. Élévation et mouvement

**Aucune ombre portée. Jamais.** La profondeur vient du gap qui laisse voir le `--papier` entre les cellules, et de la bordure 1px. Une ombre dans cette app est un bug.

```css
--duree-court: 120ms;
--duree-moyen: 200ms;
--duree-regle: 320ms;
--courbe: cubic-bezier(0.2, 0, 0, 1);
```

**Trois animations autorisées, pas une de plus :**

1. La coche de validation (`--duree-court`, opacité + `scale` 0.9 → 1)
2. La graduation du jour, sur la règle (`--duree-regle`, `scaleY` 0 → 1, une seule fois à l'ouverture de l'écran)
3. Le toast (`--duree-moyen`, opacité + 8px de translation)

La deuxième a changé d'objet : c'était la translation du panneau du jour dans le calendrier, qui est devenu une page (section 8.11) et n'a plus rien à faire glisser. La règle hérite de sa place, et c'est la seule animation de l'application qui **explique** quelque chose au lieu d'accompagner un geste — elle se joue une fois, et rien ne la rejoue. Elle est aussi la plus lente du projet, pour la même raison.

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

**Mobile first sans exception.** Chaque écran est écrit d'abord pour 320px, puis élargi. Aucune media query `max-width` dans le projet, uniquement des `min-width`. Si tu te surprends à écrire un `max-width`, c'est que le design de base a été pensé pour le bureau.

La coque a **deux barres**, et chacune a son emploi.

En **bas**, fixe, la navigation : les trois vues — Aujourd'hui, Calendrier, Suivi —, l'icône au-dessus de son mot (section 8.18). En bas parce que c'est là que le pouce arrive : l'application s'installe et se tient d'une main, et le geste central — cocher — se fait justement du pouce.

**Elle s'efface là où une barre d'action fixe prend le relais** (section 8.22) : les trois vues ne changent ni de nombre, ni d'ordre, ni de comportement, elles ne s'empilent simplement pas sous une seconde barre. Empiler 52 px d'action sur 58 px de navigation et la marge système, ce sont cent vingt pixels de chrome sous le pouce et deux réponses à « comment je sors d'ici ? ». Ces écrans-là sont un parcours à sortir, pas une vue à quitter : ils ont un retour en haut et une sortie écrite en bas à gauche.

En **haut**, collant, la coque : à gauche le logotype sur une vue, le retour partout ailleurs (section 8.19) ; à droite l'aide et les réglages. Ce sont les **deux seuls liens de l'app réduits à leur signe** (sections 8.14 et 8.16). Ni l'un ni l'autre n'est une vue, et une quatrième part dans la barre du bas ferait tomber chaque libellé sous 72px à 320px.

Une seule chose à gauche de l'en-tête, jamais deux : la marque et le retour mènent tous deux en arrière — l'une vers la racine, l'autre vers l'écran précédent — et les afficher ensemble donnerait deux réponses à la même question. La barre du bas, elle, reste là dans les deux cas : c'est ce qui rend l'effacement de la marque sans conséquence.

### 7.1 Points de rupture

```css
@media (min-width: 480px)  { }  /* grands mobiles */
@media (min-width: 768px)  { }  /* tablette */
@media (min-width: 1024px) { }  /* bureau : max-width 960px, marges --e-6 */
```

Largeurs de test obligatoires : **320, 375, 414, 768, 1024, 1280**. Le 320 n'est pas optionnel, c'est lui qui révèle tous les chevauchements.

Hauteurs : `dvh`, jamais `vh`. La barre d'URL mobile fausse `100vh` et fait dépasser le contenu sous le pli. Écran plein : `min-height: 100dvh`.

### 7.2 Une colonne, partout

**Il n'y a plus de grille.** Tous les écrans sont une colonne simple.

Le tableau de bord avait un bento : trois cellules de même poids — la journée, le retard, la charge — posées côte à côte, et il fallait choisir laquelle répondait à la question de la section 1. Trois blocs pour une seule question, dont deux qui la reformulaient. La règle des quatorze jours (section 8.8) les remplace tous les trois : le retard s'y lit sous l'axe, la charge est l'axe lui-même, et la journée est écrite en toutes lettres au-dessus, en titre.

Ce qui disparaît avec le bento : `.bento`, `.cellule` et ses variantes, la cellule héros à fond `--accent` plein, la cellule « retard », la cellule « synthèse », le mini-mois de tablette. Les six stats de la spécification initiale n'ont pas migré ailleurs : elles vivent dans la fiche d'un sujet et dans le suivi, où on va les chercher.

**L'écran n'a donc plus d'unique cellule `--accent` pleine**, et la hiérarchie ne tient plus à une surface de couleur. Elle tient au titre, à son cran, à sa graisse et à sa place — première chose écrite, seule de son cran sur l'écran (section 4). C'est ce déplacement qui a fait tomber l'interdit du 700.

Une conséquence à ne pas perdre : la marge latérale appartient au **contenu**, plus au conteneur. La règle et les lignes réglées traversent le papier d'un bord à l'autre, et ce sont leurs contenus qui se retirent de `--marge-page`. Un filet qui s'arrête à seize pixels du bord ressemble à une carte sans en être une.

### 7.3 La pile du bas — source n°1 de chevauchement

Quatre éléments se disputent le bas de l'écran : la barre de navigation, le FAB, le toast et la zone système iOS. Ils sont empilés par des variables, **jamais par des valeurs en dur**, et chacune est dérivée de la précédente : c'est la seule façon d'empêcher qu'un jour l'une passe sous l'autre.

```css
:root {
  --bas-securise: env(safe-area-inset-bottom, 0px);
  --h-fab: 56px;
  --h-nav: 58px;
  --pile-nav: calc(var(--h-nav) + var(--bas-securise));
  --bas-fab: calc(var(--pile-nav) + var(--e-3));
  --bas-toast: calc(var(--bas-fab) + var(--h-fab) + var(--e-3));
  --purge-liste: calc(var(--bas-fab) + var(--h-fab) + var(--e-5));
}
```

- Toute liste scrollable se termine par `padding-bottom: var(--purge-liste)`. Sans ça, la dernière ligne est inatteignable sous la barre du bas et le FAB, le bug le plus fréquent de ce type d'app.
- La barre de navigation porte `padding-bottom: var(--bas-securise)`. Sans lui, elle passe sous la barre d'accueil iOS en mode autonome, et ses trois libellés deviennent intouchables.
- Le panneau du jour du calendrier porte `padding-bottom: var(--bas-securise)`. C'est une surface modale : elle couvre la barre du bas, elle ne s'empile pas dessus.
- Le FAB s'efface (opacité + `translateY`) dès qu'un panneau ou une feuille modale s'ouvre. Il ne flotte jamais par-dessus.

### 7.4 Pièges d'espacement et de chevauchement

| Piège | Règle |
|---|---|
| Un titre long élargit son conteneur et pousse la page | `min-width: 0` sur **tout** enfant de grid ou de flex contenant du texte. C'est le bug n°1 des mises en page en flex. |
| Le titre écrase la coche ou le chip de catégorie | Titre : `flex: 1; min-width: 0`. Coche et chip : `flex-shrink: 0`. |
| Un mot long déborde de la carte | `overflow-wrap: anywhere` sur tout texte saisi par l'utilisateur, plus `-webkit-line-clamp: 2` sur les titres de liste |
| Les libellés de la frise se chevauchent (J+1 / J+2) | Libellés masqués sous 480px, et affichés uniquement si le segment mesure plus de 32px |
| Le calendrier déborde à 320px | 7 × 44px = 308px : sous 380px la grille annule la marge de page et utilise `repeat(7, 1fr)` + `aspect-ratio: 1` |
| iOS zoome au focus d'un champ | `font-size: 16px` minimum sur `input`, `select`, `textarea` : c'est le rôle de `--t-champ` |
| Marges qui s'additionnent ou fusionnent | **Aucun composant ne porte de marge externe.** L'espacement vient exclusivement du `gap` du conteneur et de son `padding`. |
| Paysage mobile écrasé | `@media (min-height: 560px)` pour aérer, jamais l'inverse |
| Double barre de défilement | Un seul conteneur à défilement **vertical** par écran. Le défilement **horizontal** appartient au tableau de suivi (section 8.13), et à lui seul, jamais à la page. |

---

## 8. Composants

### 8.1 Liste réglée

Le composant de liste du projet, depuis que la carte a disparu (section 7.2).

```
.liste-reglee       colonne ; chaque enfant porte un filet 1px --trait en bas
```

Des lignes séparées par un filet, pas des cartes. Une carte par révision mettait autant de bordures que d'items sur un écran qui n'en demande qu'une : la liste est **un seul objet**, réglé comme une page de cahier, et c'est le filet qui sépare — le seul mécanisme de séparation du projet (section 5).

Le filet est porté par l'enfant et non par le conteneur : une ligne qui sort de la liste au moment d'être validée emporte son trait avec elle, sans laisser un filet orphelin le temps de l'animation.

Les lignes traversent le papier d'un bord à l'autre ; c'est leur contenu qui se retire de `--marge-page`.

### 8.2 Ligne de révision (le composant le plus important de l'app)

```
┌────────────────────────────────────────────┐
│ ○   Hooks React                            │
│     Développement · ├─┬──┬────┬──────┤     │
└────────────────────────────────────────────┘
  ↑ 44×44px, cible de tap dédiée
```

- Cible de validation : **44 × 44px minimum**, séparée de la zone qui ouvre la fiche.
- Case : cercle 24px, bordure 1,5px. Coché : fond `--fait`, coche `--surface`.
- Sur la **liste du jour** (variante `--passage`), le cercle passe à `--cercle-passage` (26px) et sa bordure à `--accent` : c'est le geste central de l'application, sa cible ne se voit pas, et seul le cercle dit où viser. La cible garde ses 44px et se replie dans la hauteur de la ligne au lieu de l'étirer.
- Ligne de métadonnées : catégorie en `--encre-2` + frise miniature. Sur la liste du jour, la chip encadrée cède la place à une pastille suivie de son nom — une bordure de moins sur une ligne qui en porte déjà une — et « 3ᵉ passage sur 5 » dit où en est le programme. Le décalage `J+n` tient sa propre colonne au bout de la ligne, à chasse fixe : dans la méta, il se serait aligné sur le texte qui le précède et aurait changé de place d'une ligne à l'autre.
- État en retard : mention « il y a 3 jours » en `--retard-texte`, et rien d'autre. **Aucune bande de couleur en bord de ligne** : elle alourdit la liste sans rien dire que la mention ne dise déjà, et la section 1 demande que le retard n'accuse pas.
- Validation : mise à jour optimiste immédiate, ligne barrée 200ms, puis retrait de la liste. Toast avec « Annuler ».

Classes : `.ligne-revision`, `.ligne-revision--faite`, `.ligne-revision--compact`, `.ligne-revision--passage`, `.ligne-revision__case`, `.ligne-revision__cercle`, `.ligne-revision__coche`, `.ligne-revision__decalage`.

**Une échéance à venir n'est pas une ligne de révision** (`.ligne-echeance`) : la date d'abord, à chasse fixe, puis le sujet, puis sa catégorie — et aucune case. « Ensuite » se lit, il ne s'actionne pas : cocher y solderait une échéance de la semaine prochaine d'un geste de trop. La rangée ouvre la fiche, et « Tout voir » mène à la liste complète, qui coche.

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

**Champ de choix** (`.champ-select`). Un `<select>` natif, habillé aux mêmes bordure, rayon, fond et 48px. Le contrôle du système reste : liste roulante iOS, clavier, recherche à la frappe. Même parti pris que le champ date et que la pipette du sélecteur de teinte, et pour la même raison.

`appearance: none` est nécessaire, sans quoi iOS repeint le champ à sa façon par-dessus la bordure ; il emporte la flèche native au passage. Elle est donc **redessinée** : le chevron des neuf icônes, pivoté de 90°, en `--encre-2` au bord droit, aucun signe nouveau (section 11). Sans elle, le champ n'est qu'une boîte de 48px sans le moindre indice qu'elle s'ouvre.

Une pastille de teinte peut être peinte dans le champ, à gauche de la valeur (`.champ-select--pastille`) : la liste déroulée appartient au système et un `<option>` ne se colore pas de la même façon d'un navigateur à l'autre. Elle est `aria-hidden` et le nom reste écrit, section 3 bis, règle 2. Pastille et chevron sont `pointer-events: none` : c'est le `<select>` entier qui reste la cible.

Aucun `font-size` ici : le reset le pose sur tous les `select`, et le plancher anti-zoom iOS ne se redéclare jamais plus bas (section 7.4).

### 8.7 Sélecteur de programme

Des cartes empilées, chacune affichant **sa frise en miniature** : on choisit un rythme, pas un mot. Sélection : bordure 1,5px `--accent` + fond `#F1F4F2`. Pas de radio natif visible.

Les trois programmes intégrés (Simple / Poussé / Ultime) viennent en premier, puis les programmes créés par l'utilisateur, dans l'ordre de création.

#### Programmes personnalisés

Un programme est un nom et une suite d'écarts. Il se compose sur son propre écran, `/programmes/nouveau`, comme un sujet se crée sur le sien.

**Un rythme ne se tape pas, il se touche.** Une grille de graduations, une par écart proposé, chacune basculable d'un doigt. Demander « 1 3 7 14 30 » dans un champ texte suppose de savoir déjà ce qu'est un rythme de répétition espacée. C'est exactement ce que l'écran doit apprendre.

L'échelle proposée : `1 2 3 4 5 6 7 10 14 21 30 60 90 120 180 270 365`. Ce ne sont pas des nombres ronds au hasard. **Au-delà de dix jours, chaque valeur tombe juste dans son unité** et porte ce nom sur sa graduation : « 1 sem. », « 3 sem. », « 1 mois », « 9 mois », « 1 an ». Jamais un « 45 j » que personne ne sait situer. Le libellé complet — « 30 jours après le départ » — reste lu par les lecteurs d'écran, en jours, la seule unité qui ne demande aucune conversion.

`J+n` n'apparaît nulle part sur cet écran. C'est la notation de l'app, pas celle d'un débutant ; elle revient sur la carte du programme, une fois créé.

Trois appuis complètent la grille :

- **Partir d'un rythme connu** : Simple, Poussé, Ultime chargent le leur d'un geste. L'écran s'ouvre d'ailleurs sur celui de Simple, jamais sur du vide : personne n'invente un rythme depuis rien, on part de ce qui marche et on l'ajuste. Corollaire tenu par un test : **tout écart des trois programmes intégrés figure dans l'échelle**, sans quoi l'un d'eux serait chargeable mais irreproductible.
- **La frise**, redessinée à chaque geste : c'est elle qui montre l'espacement, ce qu'une liste de nombres ne dit pas.
- **Le compte et la portée** en une ligne : « 7 révisions · sur trois mois ».

La portée est dérivée du dernier écart, dans les mêmes mots que les trois intégrés. En deçà de 25 jours elle s'écrit en jours : vingt jours ne sont pas un mois.

Deux règles tiennent le modèle :

1. **Le nom se change toujours, le rythme seulement tant qu'il est libre.** Les révisions d'un sujet sont écrites à sa création ; rejouer un rythme déjà entamé déplacerait des échéances que l'utilisateur a en tête. Dès qu'un sujet suit le programme, la grille cède la place à la frise du rythme figé et à son explication. Le champ du nom, lui, reste ouvert.
2. **Un programme suivi ne se supprime pas.** Sa carte l'annonce — « Suivi par 3 sujets » — et le bouton disparaît. Sans cela, une fiche n'aurait plus de rythme à nommer.

Un rythme venu d'un import peut porter un écart absent de l'échelle : sa graduation vient se ranger à sa place plutôt que de le rendre immodifiable.

### 8.8 La règle

**C'est la structure de l'écran « Aujourd'hui », pas une illustration posée dessus.** Elle remplace à elle seule les trois blocs qui se disputaient la même réponse : la cellule du jour, la carte « en retard » et les barres de charge.

Une bande pleine largeur, entre deux filets `--trait`, sur `--surface`. Elle traverse l'écran au lieu de s'y loger : c'est une règle graduée, et une règle ne s'arrête pas au bord d'une carte.

**Quatorze cellules `flex: 1 1 0`**, une par jour à partir d'aujourd'hui. Deux semaines pleines, donc le même jour de la semaine aux deux bouts, et une cellule qui reste au-dessus de 20px à 320px.

Un axe de 1px `--encre` traverse la bande à `--regle-base` du bas. Les graduations montent depuis lui, les dates se posent dessous ; la hauteur totale est dérivée de ces deux bandes, jamais mesurée à part.

**Quatre paliers de hauteur, pas une échelle continue :**

| Charge | Hauteur | Couleur |
|---|---|---|
| 0 | `--regle-vide` (6px) | `--trait` |
| 1 | `--regle-faible` (12px) | `--encre-2` |
| 2 | `--regle-moyen` (18px) | `--encre-2` |
| 3 et plus | `--regle-fort` (22px) | `--encre` |
| aujourd'hui | `--regle-jour` (24px), épaisseur `--regle-trait-jour` | `--accent` |

Une hauteur proportionnelle dirait « deux fois plus » là où l'œil ne lit qu'« un peu plus », et se réétalonnerait à chaque changement du maximum : la même journée à trois révisions monterait ou descendrait selon ce qui l'entoure. Quatre paliers fixes gardent la même journée à la même hauteur d'un jour à l'autre. Au-delà de trois, ce qui compte n'est plus le compte exact mais le fait que la journée est chargée — et le nombre reste écrit pour qui veut le lire.

**Une journée vide garde sa graduation.** Sans elle, la règle deviendrait une suite de bâtons isolés dont on ne saurait plus compter les jours qui les séparent.

**Le nombre s'écrit au-dessus de sa graduation, centré dans sa cellule.** Jamais à côté : à côté, deux journées voisines et chargées donneraient quatre nombres sur une ligne sans qu'on sache lequel va avec lequel.

**Trois repères de date sous l'axe** — aujourd'hui, le milieu, le dernier jour —, chacun **centré dans sa cellule**, une rangée de cellules vides servant de gabarit. Répartis en `space-between`, ils se caleraient sur les bords de la règle et ne désigneraient plus aucune graduation. Trois et pas quatorze : à 320px, quatorze dates disposeraient de vingt pixels chacune.

**Aujourd'hui porte trois signaux, pas un** : la seule graduation en `--accent`, la seule plus épaisse, la seule qui dépasse les autres. Un jour qui doit se trouver sans être cherché.

**Le retard suit la règle**, sur une ligne en `--retard-texte` précédée d'une pastille : « 1 révision en retard — la rattraper ». Il se constate et propose le geste qui le solde ; il n'accuse pas (section 1). La pastille redouble le texte, elle ne le remplace pas.

**La couleur ne porte rien seule** : la charge se lit à la hauteur, s'écrit en chiffres au-dessus, et chaque jour est un `<li>` dont le texte `.invisible` donne sa date et son effectif en toutes lettres — « aujourd'hui, 3 révisions », « ven. 7 août, aucune révision ».

**Animation** : la graduation du jour se dresse une fois à l'ouverture (`--duree-regle`, `scaleY`), et rien ne la rejoue. C'est l'animation n°2 de la section 6.

**La règle n'est pas la frise.** La frise porte un axe en racine carrée où l'abscisse est une échéance et l'écart entre deux graduations vaut l'écart réel entre deux dates (section 2). La règle porte un axe calendaire à pas constant où l'ordonnée est un effectif. Les deux viennent du même objet et ne se lisent pas pareil : fondre les deux géométries dans un composant coûterait à la frise ce qui en fait la signature. Elles vivent dans deux modules, `lib/frise.ts` et `lib/regle.ts`, et dans deux composants.

### 8.9 États vides

**L'état vide « rien aujourd'hui » est l'écran le plus fréquent de l'app.** Il mérite le meilleur traitement, pas un gris triste.

```
Aucune révision prévue aujourd'hui
Prochaine révision : jeu. 6 août, 3 sujets.
```

Il s'écrit en titre d'écran, à la place de la phrase qu'il remplace — il n'y a plus de cellule héros à faire basculer (section 7.2). La deuxième ligne est une information utile, pas un encouragement, et elle n'apparaît que là : une journée qui a encore des révisions n'a pas besoin qu'on lui annonce la suivante. Aucune illustration, aucun emoji.

**Une journée bouclée ne se solde pas sur un écran vide.** Ce qui vient d'être coché reste sous la main, sous « revu aujourd'hui », chaque ligne barrée gardant son « Annuler ». Le « Annuler » du toast expire au bout de cinq secondes, celui-ci dure autant que la journée.

Une journée bouclée n'est pas une journée vide, et les deux ne se disent pas pareil : **« Tout est terminé pour aujourd'hui »** quand quelque chose était prévu, **« Aucune révision prévue aujourd'hui »** quand rien ne l'était. Sans rien à annoncer non plus, la seconde ligne devient « Les prochaines révisions apparaîtront ici. »

**Le vide du tout premier jour est un cas à part** : il n'y a pas de tableau de bord à rendre, il y a un projet à expliquer. Voir section 8.17.

### 8.10 Toast

Ancré en bas, au-dessus du FAB, largeur limitée à 480px. Fond `--encre`, texte `--papier`, `--r-carte`.

**Le toast porte les gestes annulables, et rien d'autre.** C'est le pendant exact de la règle 2 de la section 1 : on annule, on ne confirme pas. Alors ce qui ne se confirme pas doit pouvoir s'annuler quelque part, et cet endroit est le toast. Quatre emplois, pas un de plus :

| Geste | Texte | Seconde ligne |
|---|---|---|
| valider une révision | Révision enregistrée | « Prochaines dates ajustées » si le recalage a déplacé quelque chose |
| reporter une échéance | Révision reportée | la nouvelle date |
| archiver un sujet | Sujet archivé | — |
| supprimer un programme | Programme supprimé | son nom |

Plus un cinquième cas qui n'est pas un geste : une nouvelle version mise en cache par le Service Worker, avec une durée nulle. Le toast attend une décision au lieu de s'effacer.

Ce n'est pas un canal de notification : rien qui ne s'annule n'y a sa place. Une suppression **confirmée** — un sujet, une catégorie — reste une bannière `role="status"` : elle a déjà eu son écran, et il n'y a plus rien à défaire.

La première fois qu'un recalage déplace des échéances, la seconde ligne dit ce qui vient de se passer — « Les suivantes gardent leurs écarts, à partir d'aujourd'hui » — puis reprend sa forme courte. Personne ne peut deviner qu'« ajustées » veut dire « en conservant les écarts du programme », et des dates qui bougent sans explication ressemblent à une erreur de l'application. Une explication relue à chaque fois, elle, cesse d'être lue.

### 8.11 Calendrier

Cases de 44px minimum : la case entière, pas le chiffre. Densité indiquée par 1 à 3 points de 4px sous le numéro (jamais plus de 3, même à 12 révisions), et sous eux le reste du compte : « +4 » en `--t-xs` `--encre-2` pour un jour à sept révisions. Trois points ne doivent pas laisser croire qu'il y a trois révisions. Le bloc points + reste garde sa hauteur qu'il soit plein ou vide, pour que les chiffres du mois tiennent tous la même ligne.

Chaque point prend la teinte de sa catégorie, comme la chip et la pastille (section 3 bis). C'est le seul endroit où deux révisions d'un même jour se distinguaient d'un coup d'œil. Repli sur `--accent` pour un sujet sans catégorie. Journée soldée : les points passent en `--fait`, un état l'emportant toujours sur une identité.

La couleur ne porte rien seule : l'étiquette du bouton donne la date, « aujourd'hui » s'il y a lieu, le nombre **réel** de révisions, « toutes faites », puis les catégories du jour, trois au plus.

Deux états, deux moyens : **aujourd'hui** se marque d'un anneau `--accent`, le **jour sélectionné** d'un disque `--accent` plein. Les deux ensemble : le disque, plus un anneau posé à 2px. La bordure transparente est réservée sur toutes les cases pour qu'aucun changement d'état ne décale la grille.

Clavier : un seul jour tabulable, les flèches déplacent le focus d'un jour ou d'une semaine, Origine et Fin bornent la semaine, Page préc./suiv. changent de mois. Un jour d'un mois voisin reste cliquable et cale le calendrier sur son mois.

**Ouvrir un jour ouvre une page**, `/jour/:date`, et non plus une feuille glissante.

C'est une décision produit, pas une préférence de mise en page. Une feuille n'a pas d'adresse : on ne peut ni la partager, ni la poser sur un écran d'accueil, ni y revenir par le retour arrière du navigateur. Elle se referme d'un glissement du pouce, ce qui est exactement le geste qu'on fait en parcourant une liste. Et changer de jour y demandait de la refermer, de viser une autre case et de la rouvrir.

La page : un retour vers le calendrier, le jour en titre, « 2 révisions · 0 faite » sous lui, la liste réglée, puis deux gestes — « Tout marquer comme revu » et « Reporter à demain ». Deux chevrons passent au jour voisin ; ils vivent avec le titre et non dans l'en-tête de l'application, qui porte déjà le retour — trois flèches sur une même rangée, dont une seule sort de la page, ne se distingueraient pas.

**Les gestes groupés ne sont pas des boucles.** Chaque validation en retard recale les échéances suivantes du même sujet : deux validations parties du même état s'écraseraient, et le recalage de la première disparaîtrait. La cascade vit dans `lib/recalage.ts` (`validerPlusieurs`, `reporterPlusieurs`), avec ses tests, et le contexte n'écrit qu'une fois par sujet touché. Un seul toast suit le geste, et il dit **combien** : « Révision enregistrée » après avoir coché toute une journée laisserait croire qu'une seule l'a été. Son « Annuler » restaure tous les sujets touchés, jamais la moitié.

**`FeuilleBas` reste** — c'est le panneau d'une cellule du tableau de suivi qui s'en sert (section 8.13). C'est la feuille *du jour* qui disparaît, pas le composant.

Ce qu'était la feuille du jour, pour mémoire : `<dialog>` ancré en bas, poignée centrée, `::backdrop` à 20 % de `--encre`, quatre sorties dont le glissement. Son animation de translation était la deuxième des trois autorisées ; c'est la graduation du jour de la règle qui a pris sa place (section 6).

**Où le focus entre, au juste.** Une feuille qu'on **lit** vise son corps : l'anneau ne doit pas se poser sur « Fermer », qui est une sortie et non une action. L'argument tombe pour une feuille qui n'existe que pour qu'on y **écrive** : l'y laisser imposerait un geste de plus avant d'atteindre le premier champ. D'où `cibleFocus`, que l'appelant fournit ou non. La visée a lieu après `showModal()` : le `<dialog>` est monté bien avant de s'ouvrir, `autoFocus` y aurait tiré à blanc.

Les révisions y sont listées en `.ligne-revision--compact` : trait de séparation plutôt que carte, et la position dans le programme écrite — « Révision 2 sur 5 · Prochaine : 8 août » — plutôt que la frise. C'est la seule liste où la frise cède la place : sur 44px de haut, quatre traits verticaux ne se lisent pas.

### 8.12 Boîte de confirmation

`<dialog>` centré (`.dialogue`), 400px au plus, `::backdrop` à 40 % de `--encre`. Trois emplois, et une règle qui les réunit plutôt qu'un compte à tenir : **une action qu'aucun geste inverse ne rebâtirait**. Supprimer un sujet, remplacer les données par un import, supprimer une catégorie. Le reste s'annule, ne se confirme pas (section 1).

La suppression d'une catégorie y a sa place parce qu'elle en touche d'autres : ses sujets rejoignent « Sans catégorie », et « Annuler » d'un toast rejoue une écriture. Il ne rendrait pas leur catégorie à *n* sujets sans les avoir mémorisés. La boîte annonce donc leur nombre, et qu'aucun n'est supprimé.

Le reset pose `* { margin: 0 }`, qui écrase le `margin: auto` du navigateur : **`inset: 0` et `margin: auto` sont écrits explicitement**, sans quoi la boîte se colle en haut de l'écran. Sa hauteur est plafonnée à `calc(100dvh - var(--e-6))` et son contenu défile : un titre de sujet très long ne doit pas pousser les boutons hors écran.

Les deux boutons se partagent la largeur à parts égales sous 480px, puis reprennent leur largeur naturelle, alignés à droite. Ils ne se replient jamais l'un sous l'autre. « Annuler » est toujours à gauche.

`showModal()` viserait « Annuler », qui s'ouvrirait cerclé de son anneau de focus alors que personne n'a tabulé : c'est le corps, `tabindex="-1"`, qui prend le focus. Le lecteur d'écran lit le titre par `aria-labelledby`, et la première tabulation mène aux boutons. Ces réceptacles — celui-ci et la feuille du bas — sont les deux seuls éléments du projet à porter `outline: none` : ils ne sont pas atteignables au clavier, leur anneau ne signalerait donc aucun parcours.

Trois sorties, toutes non destructrices : le bouton « Annuler », Échap et un clic sur le fond. C'est l'état de la page qui referme, jamais le navigateur seul. Et comme toute surface modale, elle efface le FAB (section 7.3).

---

### 8.13 Tableau de suivi

**C'est un tableau, et il le reste sur un téléphone.** Le replier en cartes sous 480px ferait perdre exactement ce qu'on vient y chercher : comparer les sujets verticalement, les étapes horizontalement, et voir les trous. La réponse au petit écran n'est pas de supprimer le défilement horizontal, c'est de le rendre lisible.

Un tableau par catégorie, chacun dans un `<details>` repliable (`.suivi__groupe`), **une seule catégorie ouverte par défaut**, la première. En-tête du groupe : la pastille, le nom, et trois chiffres, pas un de plus.

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

Cinq états, **cinq formes** : elles doivent se distinguer en niveaux de gris, la couleur ne portant jamais l'information seule. Tout est dessiné en CSS : la section 11 arrête la liste des icônes à sept, et la coche, qui en fait partie, est la seule reprise ici.

| État | Marque | Couleur |
|---|---|---|
| effectuée | disque 20px + coche 12px | `--fait`, coche `--surface` |
| à effectuer aujourd'hui | anneau 20px, trait 1,5px | `--accent` |
| en retard | anneau 20px + point plein 6px au centre | `--retard` |
| à venir | point 4px | `--encre-2` |
| hors programme | filet 8 × 1px | `--trait` |

C'est le vocabulaire déjà en place : le disque coché est celui de la section 8.2, l'anneau et le disque sont ceux du calendrier (section 8.11). Chaque case porte en plus un texte `.invisible` complet — « Dérivées, révision à 1 semaine, en retard depuis le 3 août » — parce qu'une forme ne se lit pas.

La marque fait 16 à 20px, mais c'est la **cellule entière** qui se touche : `min-height` et `min-width` à `var(--cible)`. Une case hors programme n'est pas un bouton : il n'y a rien à ouvrir, et une cible tactile qui ne fait rien est pire que pas de cible.

**Une légende dit ce que les formes veulent dire** (`.legende`, composant `LegendeSuivi`). Le texte `.invisible` de chaque case n'aide que les lecteurs d'écran ; l'œil, lui, devait deviner qu'un anneau au point central veut dire « en retard ». Elle est repliée dans un `<details>` au-dessus des tableaux : une légende sert une fois, et huit lignes au-dessus du tableau à chaque visite feraient payer aux habitués ce que les nouveaux venus lisent une seule fois. Le même composant est déplié sur la page d'aide (section 8.16).

#### Deux modes de colonnes

**Intervalles** nomme les étapes par leur écart — J+1, J+3, J+7 —, à partir de l'**union** des écarts de la catégorie. Un tableau par ligne interdirait la comparaison verticale ; l'union la préserve, et une étape absente d'un programme s'y lit « hors programme ». Plus informatif, mais une catégorie mêlant Simple et Ultime compte jusqu'à dix-sept colonnes.

**Compact** les numérote — R1, R2, R3 —, et un en-tête tient alors dans 44px. C'est la condition pour que le tableau reste un tableau sur un téléphone, pas un repli esthétique.

Tant que rien n'a été choisi, le mode suit la largeur : compact sous 768px, intervalles au-delà. Dès qu'on choisit, c'est le choix qui vaut, et il est retenu en `localStorage`, comme le pli des catégories. Ce sont des préférences d'affichage : elles ne s'exportent pas et ne valent que pour cet appareil.

#### Colonne figée, en-tête figé

La première colonne reste visible pendant le défilement horizontal (`position: sticky; left: 0`). Sans elle, glisser vers la droite fait perdre la ligne qu'on lisait. La cellule d'angle porte les **deux** classes de collage, faute de quoi le mot « Sujet » file vers la gauche pendant que les titres de ligne restent en place.

Deux contraintes que le CSS impose, et qu'il faut connaître avant d'y toucher :

- **`border-collapse: separate` est obligatoire.** Avec `collapse`, les bordures des cellules collantes ne se peignent pas au défilement. Chaque cellule ne porte donc qu'un trait bas — et la colonne figée, un trait droit —, sans quoi deux bordures voisines feraient 2px.
- **Un élément qui défile horizontalement devient sa propre zone de défilement dans les deux sens.** `overflow-y: visible` n'existe plus à côté d'un `overflow-x: auto` : il vaut `auto`. Un `<thead>` collant s'y cale donc sur le cadre et non sur la page. D'où `top: 0` et un plafond de hauteur, `calc(100dvh - var(--h-entete) - var(--e-5))` : l'en-tête colle au haut du tableau, et le cadre ne défile verticalement que pour un tableau plus haut qu'un écran. En deçà, la page reste le seul conteneur qui défile.

#### Dire le défilement, sans ombre ni dégradé

Les deux sont interdits (section 11). Quatre moyens, tous conformes, et aucun masquage silencieux :

1. le trait vertical `--trait` en bord de colonne figée ;
2. des colonnes de 44px, telles que la suivante est toujours entamée à l'écran ;
3. `scrollbar-width: thin` : une barre visible sur ordinateur ;
4. une phrase, `--t-sm` en `--encre-2` : « Faites glisser pour voir la suite. » Elle ne s'affiche que si le tableau déborde vraiment. Le composant le mesure plutôt que de le supposer.

Le cadre porte `role="region"`, `tabindex="0"` et un `aria-label` : un conteneur qui défile doit être atteignable au clavier, sans quoi il n'existe que pour la souris et le doigt. La table porte une `<caption>` en `.invisible`, les en-têtes un `scope="col"`, et la cellule du sujet un `<th scope="row">` : c'est elle qui nomme sa ligne.

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

La septième icône, ajoutée après coup. Elle mérite sa justification.

**Des curseurs, pas un engrenage.** L'engrenage est le signe générique de l'interface logicielle : il dirait « logiciel » là où toute l'app dit « papier et instrument de mesure » (section 1). Deux rails gradués que l'on fait coulisser disent la même chose et rappellent la frise, qui est la signature (section 2). Le registre tient jusque dans l'en-tête.

**Le mot ne disparaît pas, il change de place.** `aria-label` le porte pour les lecteurs d'écran, `title` l'affiche au survol. Une icône sans nom n'est pas une icône, c'est une devinette, et celle-ci est le seul lien de l'app à ne pas écrire le sien.

Le signe fait 20px, sa cible 44 (`min-width: var(--cible)`) : c'est le carré qui se touche, pas le dessin. Repos `--encre-2`, actif `--accent` sur `--accent-doux`, comme un lien de navigation.

---

### 8.15 Catégories

**On désigne une catégorie, on ne la tape pas.** Le formulaire d'un sujet portait un champ libre doublé d'un `datalist` : une faute de frappe y créait une catégorie de plus, avec sa propre couleur, et rien ne permettait de la corriger. Retaper le nom en fabriquait une troisième. La catégorie existe maintenant avant le sujet, et le formulaire la choisit dans un champ de choix (section 8.6).

La pastille de la catégorie retenue est peinte dans le champ et suit la sélection. Le nom reste écrit, dans le champ comme dans chaque option : la couleur ne porte jamais l'information seule.

**Le raccourci de création est un bouton sous le champ**, pas une option de la liste. Une option qui n'est pas une valeur est annoncée comme une valeur par un lecteur d'écran, et laisserait le champ dans un état incohérent si l'on renonce.

Il ouvre une **feuille**, pas une navigation : le titre, la date et le programme déjà saisis sont derrière elle et l'attendent. Partir sur `/categories` reviendrait à abandonner la saisie en cours pour ranger ses étiquettes. La feuille ne porte que le nom et la couleur — c'est un raccourci, pas le formulaire complet —, et la catégorie créée devient aussitôt celle du sujet : c'est le geste qu'on venait faire. Le focus revient alors au champ, et non au bouton où `<dialog>.close()` le renvoie, sans quoi rien n'apprendrait au lecteur d'écran que la valeur a changé.

Cette feuille est rendue au milieu du formulaire du sujet : elle ne porte donc **pas** de `<form>`. Un `<form>` dans un `<form>` est interdit, et le navigateur s'y perd : il soumet pour de bon, et la page se recharge en emportant la saisie. Entrée valide quand même, mais depuis le champ de texte seul : sur une pastille de couleur, elle n'a rien à déclencher.

**L'écran** : `/categories`, atteint depuis Réglages, qui n'en garde qu'un aperçu en chips et un lien. Une carte par catégorie, sur le gabarit d'un programme créé (section 8.7) : la pastille, le nom, le nombre de sujets, puis Modifier et Supprimer. Une base neuve arrive avec six catégories (section 3 bis) ; l'état vide propose de les ajouter, pour les installations antérieures que le semis ne touche pas.

**Une catégorie portée se supprime toujours**, et c'est l'inverse d'un programme suivi, qui refuse de l'être. Le contraste n'est pas un caprice : sans rythme, une fiche n'aurait plus rien à nommer, alors qu'un sujet sans catégorie est un état normal du modèle. Ses sujets rejoignent donc « Sans catégorie », aucun n'est supprimé, et la boîte de confirmation le dit (section 8.12).

Le retour après suppression est une bannière `role="status"`, pas un toast : la section 8.10 n'en compte que deux usages, et une suppression confirmée n'est pas annulable.

---

### 8.16 Le signe de l'aide, et la page qu'il ouvre

**Un point d'interrogation, pas une icône de plus.** La section 11 arrête la liste des signes dessinés, et elle n'a pas à s'allonger ici : un « ? » est une lettre. Il est cerclé au trait, à 20px comme le signe des réglages, et sa cible fait 44px : c'est le carré qui se touche, pas le caractère. Repos `--encre-2`, actif `--accent` sur `--accent-doux`, comme un lien de navigation.

Les deux signes vivent côte à côte au bout de l'en-tête (`.appli__outils`), à l'opposé du logotype. Deux cibles de 44px y tiennent encore à 320px, où la navigation occupe désormais le bas de l'écran. Comme les réglages, l'aide porte son nom en `aria-label` et en `title` : un signe sans nom est une devinette.

**La page** : `/aide`, six sections, dans l'ordre où les questions se posent : le vocabulaire, les programmes, le retard et le recalage, lire le tableau de suivi, se déplacer dans l'application, vos données. Elle emprunte le bloc des réglages (`.aide__bloc`) : deux écrans de texte long n'ont aucune raison de se dessiner différemment.

Elle est **hors ligne comme le reste** : aucun lien sortant, aucune capture d'écran. Ce sont les composants de l'application qui l'illustrent : la frise pour les programmes, la légende des cinq marques pour le tableau. Une capture vieillit dès la première retouche du CSS ; un composant, non.

Ce n'est pas un doublon du README. Le README s'adresse à qui regarde le dépôt : vocabulaire du modèle, format d'export, choix d'architecture. La page d'aide s'adresse à qui utilise l'application, sur un téléphone, éventuellement sans réseau.

---

### 8.17 Le premier écran

**L'écran de premier usage est la page de présentation.** Ce sont volontairement le même écran, et il est rendu par le tableau de bord tant qu'aucun sujet n'existe, donc à la même adresse, `/`.

L'application vit à la racine : `start_url` et `scope` valent « / », et des raccourcis posés sur des écrans d'accueil y pointent déjà. La déplacer sous `/app` pour loger une vitrine à sa place casserait ces installations. C'est exactement ce que les redirections de `/element/:id` évitent par ailleurs. Il n'y avait de toute façon rien à arbitrer : qui arrive sans données ne veut pas une grille de zéros, il veut savoir ce que fait ce site ; qui vient d'installer l'application veut savoir par où commencer. Une seule page répond aux deux.

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

### 8.18 La barre de navigation

**En bas, fixe, trois parts égales.** L'application s'installe et se tient d'une main : une navigation en haut d'un grand téléphone demande de changer de prise à chaque changement de vue, et le geste central de l'app — cocher — se fait justement du pouce.

**L'icône et le mot, jamais l'icône seule.** Aucun des trois signes ne se devine : « Aujourd'hui » et « Suivi » n'ont pas de pictogramme convenu, et même le calendrier, seul, ne dirait pas s'il ouvre une vue ou un sélecteur de date. Le mot dit la destination, le signe la rend reconnaissable au coup d'œil suivant. Le signe fait 22px, le mot 12px sous lui, et la part entière fait 58px de haut, cible largement au-delà des 44px.

**L'état actif se lit sur la couleur *et* sur le poids.** À 12px, une nuance de teinte seule ne se voit pas, et elle ne se voit pas du tout en niveaux de gris : `--accent` **et** graisse 600. Aucune pastille, aucune surface pleine : la hiérarchie de l'écran appartient à l'unique cellule `--accent` du tableau de bord (section 3).

Trois entrées, et trois seulement : les trois vues. Aide et réglages ne sont pas des vues, ils vivent au bout de l'en-tête ; une quatrième part ferait tomber chaque libellé sous 72px à 320px.

`env(safe-area-inset-bottom)` est indispensable : sans lui, la barre passe sous la barre d'accueil iOS en mode autonome. Le libellé se coupe en points de suspension plutôt que d'élargir sa part : une traduction plus longue ne doit pas pouvoir emporter la page en défilement horizontal.

---

### 8.19 Le retour

**Il est là partout où l'on n'est pas sur une vue.** Une application installée n'a pas de bouton « précédent » : ni barre de navigateur, ni — sur iOS en mode autonome — geste système. Un formulaire ouvert depuis une fiche s'y terminait en impasse, avec pour seule sortie la barre du bas, qui ramène à une vue et non d'où l'on vient.

**Un chevron *et* le mot « Retour ».** La navigation s'écrit en toutes lettres (section 11), et un signe seul dans un coin d'écran est une devinette. Le chevron est celui des sept, pivoté : aucun signe nouveau.

**Il prend la place de la marque**, il ne s'ajoute pas à elle (section 7). Deux chemins vers l'arrière côte à côte donneraient deux réponses à la même question, et coûteraient au retour la place de son mot à 320px.

Deux chemins, dans cet ordre :

1. **L'historique**, quand il y a quelque chose derrière. C'est le seul retour exact : il rend la position dans une longue liste, ce qu'aucune adresse ne saurait faire.
2. **Le parent**, sinon. Une fiche ouverte depuis un lien partagé ou un raccourci d'écran d'accueil n'a rien derrière elle : `navigate(-1)` en sortirait de l'application, ce qui n'est pas un retour, c'est un départ. La hiérarchie est écrite dans `state/useRetour.ts` : la modification d'un sujet remonte à sa fiche, un programme aux réglages qui le listent.

Le « Annuler » d'un formulaire emprunte le même chemin : un formulaire abandonné doit reposer là où le retour aurait reposé.

---

### 8.20 L'export calendrier

**Deux boutons, deux endroits, et la différence est le sujet.**

L'export de **tous** les sujets vit dans les Réglages, sous son propre titre, à côté de la sauvegarde JSON : c'est la même question, « comment je sors mes données d'ici ? », et la réponse n'est pas la même, ce qui mérite deux blocs plutôt qu'un. La vue Calendrier répond à « quand ? » ; ce n'est pas un écran d'outils, et le tableau de bord n'est pas davantage l'endroit d'un bouton de fichier.

L'export d'**un** sujet vit sur sa fiche, dans le bloc Actions, entre « Dupliquer » et « Archiver » : c'est là qu'on l'a en tête, et c'est là que sont déjà ses autres verbes. Il porte le signe du calendrier — pas un dessin de plus — et son mot, « Exporter (.ics) ».

Le `.ics` n'est pas une sauvegarde, et l'interface le dit : seul le JSON se réimporte. C'est une copie figée versée dans un agenda, jamais une synchronisation : il n'y a pas de serveur.

Trois décisions de contenu, et chacune découle du projet plutôt que du format :

| Décision | Pourquoi |
|---|---|
| Journées entières, pas des rendez-vous | Une révision a un jour, pas une heure. `DTSTART;VALUE=DATE` évite du même coup toute question de fuseau. |
| Ce qui reste à faire, et rien d'autre | Une révision effectuée n'est plus une échéance. L'app répond à « qu'est-ce que je dois revoir aujourd'hui ? », pas à « qu'ai-je révisé ». |
| Aucune alarme | `VALARM` ferait sonner un téléphone, et l'app ne notifie pas, c'est écrit sur son premier écran. Qui veut un rappel le règle dans son agenda. |

Un export qui ne contient rien n'est pas une erreur, c'est un fait : la bannière le dit plutôt que de livrer un fichier vide, qu'un agenda importerait sans un mot.

---

### 8.21 Thème et langue, dans les réglages

Ce sont les deux premiers blocs de l'écran : ils changent l'écran sous les doigts, et ce sont les seuls réglages qu'on vienne chercher sans savoir où ils sont.

Chacun est une **bascule** : le gabarit de radios natifs habillés en segments qu'avait inauguré le sélecteur de pratique (`components/Bascule.tsx`). Tous les choix sont visibles à la fois ; jamais un cycle au toucher. Trois valeurs pour le thème — Système, Clair, Sombre —, deux pour la langue.

**Chaque langue se nomme dans sa propre langue** : « Français », « English ». Quelqu'un qui ouvre l'application dans une langue qu'il ne lit pas doit pouvoir y reconnaître la sienne.

Ni l'un ni l'autre n'appartient aux données : ils ne s'exportent pas, ne s'importent pas, ne se synchronisent pas. Un fichier de sauvegarde décrit des révisions, pas l'écran sur lequel on les lit. Ils vivent dans `localStorage`, et une écriture qui échoue n'est pas une erreur : en navigation privée l'application marche, elle oublie simplement le choix d'une visite à l'autre. Les deux blocs le disent.

---

### 8.22 La création, en trois pages

**Une question par écran, et rien d'écrit avant la dernière.**

Le formulaire d'un seul écran demandait quatre choses à la fois — un titre, une catégorie, une date, un programme — à quelqu'un qui, la première fois, n'en connaît aucune. Trois pages posent les questions dans l'ordre où elles se répondent, et chacune tient dans un écran sans défilement.

Adresses : `/nouveau/titre`, `/nouveau/categorie`, `/nouveau/rythme`. `/nouveau` reste valide et ouvre la première — le bouton « + » y mène, et des raccourcis d'écran d'accueil peuvent y pointer.

| Étape | Question | Sortie | Action |
|---|---|---|---|
| 1 | Qu'est-ce que vous voulez revoir ? | « Plus tard », vers Aujourd'hui | Continuer |
| 2 | Dans quelle catégorie ? | « Passer », vers l'étape 3 | Continuer |
| 3 | À quel rythme ? | — | Créer le sujet |

**La deuxième a une sortie parce que la catégorie est facultative** : un sujet sans catégorie est un état normal, pas un oubli à réparer. « Passer » mène à l'étape suivante et non hors du parcours — sauter une question n'est pas abandonner. La troisième n'a pas de sortie : il n'y a plus rien à sauter, et un « Passer » y voudrait dire « créer », ce que le bouton dit déjà. L'action reste à droite dans les deux cas, pour ne pas changer de place d'un écran à l'autre du même parcours.

**Trois segments de 2px** en haut, pas une barre de progression : on ne mesure pas un avancement en pourcentage quand il y a trois questions, on les compte. Le compte est aussi écrit dans l'en-tête, à la place de l'aide et des réglages — ouvrir les réglages au milieu d'une saisie abandonnerait le parcours, et le retour de gauche suffit à en sortir.

**Le brouillon vit dans le `sessionStorage`**, pas dans un contexte React. Ces pages ont des adresses, et une adresse se recharge : un onglet rafraîchi au milieu de l'étape 2 perdrait le titre saisi à l'étape 1 sans que rien ne l'annonce. Il meurt avec l'onglet — la durée de vie exacte d'un brouillon, et la raison pour laquelle ce n'est pas `localStorage` : un sujet abandonné il y a trois semaines n'a pas à ressurgir dans un formulaire vide. La validation de ce qu'on en relit vit dans `lib/brouillon.ts`, avec ses tests : ce qui sort d'un stockage est une donnée extérieure.

**L'étape 3 se garde elle-même.** Ouverte sans titre — un favori, un onglet restauré —, elle renvoie à la question qui manque plutôt que d'offrir un bouton qui échouerait.

**Ce qui n'est pas passé aux trois pages** : la modification d'un sujet et la duplication gardent le formulaire d'un seul écran. Dérouler trois pages pour changer un titre serait une régression, et une duplication arrive déjà remplie.

**La barre d'action est fixe, et la barre du bas s'efface** (section 7.3). La sortie est un lien souligné à gauche, jamais un bouton gris : sortir doit être aussi lisible qu'avancer, et une sortie qu'on ne trouve pas est une impasse.

---

### 8.23 Les états d'un écran

Deux, parce qu'il n'y en a que deux : la lecture est en cours, ou elle a échoué. Il n'y a ni réseau, ni requête à retenter en boucle, ni chargement progressif — la base est locale et répond en quelques dizaines de millisecondes.

**Le gabarit d'attente** (`.gabarit`) : des blocs `--surface-survol` arrondis à `--r-gabarit`, à la forme de l'écran — un sur-titre, un titre, la règle, des lignes. Il réserve la place, et la page ne saute pas quand les données arrivent.

Pas de tourniquet. Une roue n'aurait le temps que d'apparaître, et sa rotation dirait « c'est long » là où il ne se passe rien. Pas de pouls non plus : ce serait une quatrième animation, et la section 6 en autorise trois.

Il est entièrement masqué aux lecteurs d'écran — ce sont des rectangles, ils n'ont rien à dire. C'est la région qui l'entoure qui porte `aria-busy` et le mot « Chargement ».

**L'erreur de lecture** (`.erreur`) : un encadré `--trait-alerte` en `--retard`, le message de `i18n.erreurs.lecture`, et « Réessayer ». Elle **prend la place du contenu** au lieu de se glisser en bannière au-dessus de lui : sans données, l'écran qui suivrait serait vide, et un tableau de bord à zéro se lit « vous n'avez rien » et non « je n'ai pas pu lire ».

Le message dit trois choses, dans cet ordre : ce qui s'est passé, que rien n'est perdu, quoi faire. La deuxième est la plus importante — les données sont locales, et « impossible de lire » se lit sinon comme « tout a disparu ». « Réessayer » rejoue la lecture initiale : un stockage indisponible ne l'est pas toujours pour toujours, et proposer de réessayer coûte moins qu'expliquer comment recharger une page.

**Ce que ces états ne couvrent pas**, et qui vit ailleurs : l'état vide d'un écran (section 8.9), la mise à jour du Service Worker (section 8.10), et l'adresse inconnue, qui est une page — « Cette adresse ne correspond à aucune page de Revoir », avec un retour vers Aujourd'hui, jamais une impasse.

---

## 9. Écriture

L'interface est en **français et en anglais**, en casse normale, à l'infinitif pour les actions.

| À écrire | À ne pas écrire |
|---|---|
| Marquer comme revu | Valider · OK |
| Révision enregistrée | Bravo ! · Bien joué 🎉 |
| 3 révisions en retard | ⚠️ Attention, retard ! |
| Rien à revoir aujourd'hui. | Rien ici pour l'instant... |
| Créer le sujet | Soumettre · Enregistrer |
| Sujet archivé | Opération réussie |
| Aucune révision planifiée | Oups, c'est vide ! |

Une action garde le même mot du bouton jusqu'au toast : « Archiver » produit « Sujet archivé ». Zéro emoji, zéro exclamation, zéro gamification, c'est une exclusion explicite du projet.

Dates : relatif jusqu'à 7 jours (« aujourd'hui », « demain », « il y a 3 jours »), absolu au-delà (« jeudi 6 août »). `date-fns` avec la locale de la langue active.

### 9.1 Deux langues

Le français reste la langue de référence : `src/i18n/fr.ts` **définit la forme** du dictionnaire, et l'anglais ne compile que s'il la respecte au champ près. Un écran nouveau ne peut donc pas oublier une traduction : c'est la compilation qui le dit, pas une relecture.

Ce que la traduction touche, et qui n'est pas seulement des mots :

| | Français | Anglais |
|---|---|---|
| Date longue | 14 mars 2026 | March 14, 2026 |
| Début de semaine | lundi | dimanche |
| Décalage | J+7 | D+7 |
| Pluriel à zéro | 0 révision | 0 reviews |
| Espace avant `%` et `:` | oui | non |

Les pluriels et les accords sont donc des **fonctions** dans le dictionnaire, pas des gabarits à trous : « 3 révisions effectuées » et « 3 reviews done » ne s'accordent pas aux mêmes endroits. Les gabarits de date en font partie : c'est l'ordre des champs qui change, pas seulement les mots.

**Ce que l'utilisateur a écrit ne se traduit jamais** : titres de sujets, noms de catégories, noms de programmes créés. Les six catégories livrées prennent la langue active *au moment où elles sont créées*, et pas ensuite : traduire après coup renommerait des données qu'on a pu modifier.

Une seule langue est active à la fois dans un onglet ; elle vit donc dans un module (`src/i18n/index.ts`) plutôt que d'être portée en argument à travers une quinzaine de fonctions pures qui n'ont rien à décider. Les composants passent par `useTextes()`, qui les abonne au changement ; les modules `lib/` par `textes()`, qui ne réveille personne, ils ne sont pas des composants.

`<html lang>` suit, et le tri des chaînes aussi : `localeCompare` sans étiquette suivrait la locale du navigateur, qui n'est pas forcément celle de l'interface, et deux appareils afficheraient la même liste dans deux ordres.

---

## 10. Plancher qualité

À vérifier avant de considérer un écran terminé :

- [ ] Toute cible tactile fait ≥ 44 × 44px
- [ ] Focus clavier visible sur chaque élément interactif, parcours complet au clavier
- [ ] `prefers-reduced-motion` respecté
- [ ] Contrastes conformes aux tableaux de la section 3, **dans les deux thèmes**
- [ ] Écran vérifié en clair et en sombre, et dans les deux langues
- [ ] Zoom à 200 % sans perte de fonction ni scroll horizontal **de page** ; celui du tableau de suivi, à l'intérieur de son cadre, est prévu
- [ ] Écran vérifié à **320px** : aucun scroll horizontal, aucun chevauchement, aucun texte tronqué involontairement
- [ ] `min-width: 0` sur les enfants de grid/flex contenant du texte
- [ ] La dernière ligne de chaque liste reste atteignable sous le FAB
- [ ] Champs de saisie à 16px minimum
- [ ] `100dvh` et non `100vh` ; aucune media query `max-width`
- [ ] Aucun composant ne porte de marge externe
- [ ] `<html lang>` suit la langue choisie, `<title>` propre à chaque page
- [ ] Aucune chaîne écrite en dur dans un composant : tout passe par le dictionnaire
- [ ] Les compteurs qui changent sont dans une région `aria-live="polite"`
- [ ] La validation d'une révision est annulable pendant 5 secondes
- [ ] `env(safe-area-inset-*)` appliqué sur le FAB et sur la barre de navigation du bas
- [ ] Un retour est atteignable sur tout écran qui n'est pas une des trois vues
- [ ] Une navigation remonte en haut de page, sauf le retour arrière, où le navigateur restaure la position
- [ ] Aucune ombre portée dans le CSS produit

---

## 11. Interdits

Ombres portées · dégradés · rouge · noir pur · blanc pur · majuscules forcées dans le texte · emoji · icônes au-delà des 9 nécessaires (plus, calendrier, coche, chevron, archive, corbeille, réglages, jour, suivi, en SVG inline, aucune librairie) · Shadcn/UI · Lucide · toute animation hors des trois autorisées · plus d'une surface `--accent` pleine par écran · le bento, qui n'existe plus (section 7.2).

Le « ? » de l'aide (section 8.16) n'entame pas le compte : c'est une lettre cerclée, pas un signe dessiné. La règle vise les dessins qu'il faut apprendre à lire, et l'alphabet n'en fait pas partie.

**Quatre interdits sont tombés, et il faut dire pourquoi.**

Le **thème sombre** était interdit pour une bonne raison — une palette de huit valeurs se double, se remesure et se maintient en double — et pour une mauvaise : l'application s'installe et s'ouvre le soir, sur un appareil que son propriétaire a déjà réglé en sombre, et lui répondre par un écran crème est une décision prise à sa place. Il est donc autorisé sous les conditions de la section 3 ter : deux apparences seulement, contrastes remesurés, et la même palette de huit valeurs, pas une de plus.

La **graisse 700** entre, pour les titres et le logotype seuls (section 4). L'interdit tenait tant que la voix de l'écran était portée par une cellule pleine `--accent` : le titre n'avait pas à crier, la couleur le faisait pour lui. La refonte retire cette cellule et fait porter la hiérarchie à un seul titre, à 34 px resserré ; à ce format, le 600 d'Arial rend un titre mou, qui ne dit pas qu'il est le premier objet de l'écran. Le 700 ne va nulle part ailleurs : ni bouton, ni label, ni métadonnée.

Les **majuscules forcées** entrent au logotype et aux sur-titres, et nulle part ailleurs (section 4). La raison de l'interdit — le français accentué en capitales se lit mal — vaut pour du texte : elle ne vaut pas pour un mot de six lettres sans accent, ni pour une étiquette de section de 12 px ouverte à 0,14 em qui ne porte aucune information absente de ce qu'elle surmonte. Dans le texte, la casse forcée reste un défaut.

Les **icônes** passent de sept à neuf, et pas d'une de plus. Les deux ajoutées — jour et suivi — servent la barre du bas, où les trois vues portent leur signe au-dessus de leur mot (section 8.18). Elles ne remplacent aucun libellé : le mot reste écrit sous chacune. Ce qui n'est toujours pas dans la liste s'écrit en toutes lettres.

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
  --police-titre: Arial, Helvetica, sans-serif;
  --police-ui: Arial, Helvetica, sans-serif;
  --police-chiffres: ui-monospace, SFMono-Regular, Menlo, monospace;
  --t-ecran: 34px;
  --t-page: 30px;
  --t-section: 22px;
  --t-marque: 14px;
  --chasse-titre: -0.035em;
  --chasse-surtitre: 0.14em;
  --chasse-marque: 0.24em;
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
  --h-nav: 58px;
  --pile-nav: calc(var(--h-nav) + var(--bas-securise));
  --bas-fab: calc(var(--pile-nav) + var(--e-3));
  --bas-toast: calc(var(--bas-fab) + var(--h-fab) + var(--e-3));
  --purge-liste: calc(var(--bas-fab) + var(--h-fab) + var(--e-5));

  /*
   * Hauteur de l'en-tête de l'application, qui est collant. Le tableau de
   * suivi s'y décale (section 8.13). C'est de l'arithmétique sur le gabarit
   * de l'en-tête, pas une mesure : elle change avec lui, et rien ne le
   * signalera d'autre que l'écran. Une seule rangée à toutes les largeurs
   * depuis que la navigation est passée en bas.
   */
  --h-entete: calc(var(--e-3) + var(--haut-securise) + var(--cible)
                 + var(--e-3) + 1px);                                /* 69px */
  /* Largeur de la colonne figée du tableau de suivi. */
  --suivi-sujet: 120px;

  color-scheme: light;
}

/* Dès 480px, la colonne du sujet s'élargit. */
@media (min-width: 480px) {
  :root {
    --suivi-sujet: 180px;
  }
}

/* Le thème sombre — section 3 ter. Une seule apparence de plus, résolue en JS. */
[data-theme='sombre'] {
  --papier: #1A1917;
  --surface: #221F1C;
  --surface-survol: #2B2723;
  --trait: #3A3630;
  --encre: #EFECE4;
  --encre-2: #98927F;
  --accent: #7FA89A;
  --accent-doux: #23302C;
  --retard: #B8843F;
  --retard-texte: #CF9D64;
  --fait: #6F9670;
  --fait-texte: #8FB790;

  color-scheme: dark;
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

/* Les mêmes huit, éclaircies pour le papier de nuit. */
[data-theme='sombre'] {
  --cat-ardoise: #7895A2;
  --cat-prune: #9A8AAC;
  --cat-olive: #849766;
  --cat-terre: #AB8A72;
  --cat-bleu: #6E94BC;
  --cat-teal: #6A9995;
  --cat-mauve: #AD84A1;
  --cat-ocre: #A18F56;
}
```
