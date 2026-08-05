# Revoir

> Application PWA minimaliste pour planifier ses révisions par répétition espacée, sans stocker le contenu à apprendre.

Revoir ne conserve ni vos cours, ni vos fiches, ni vos documents. Vous indiquez seulement **ce que** vous voulez revoir — un titre, une catégorie, une date de départ, un programme — et l'application calcule les dates de révision. Elle répond à une seule question :

> Qu'est-ce que je dois revoir aujourd'hui ?

Aucun compte, aucun serveur, aucune synchronisation, aucune publicité, aucun tracking. Toutes les données restent dans le navigateur de l'appareil.

## Le vocabulaire

Trois mots, choisis pour ne pas enfermer l'application dans le contexte scolaire.

```
Catégorie
└── Sujet
    ├── Révisions espacées
    └── Pratique
```

Une **catégorie** regroupe des sujets : Mathématiques, Anglais, React, Certification AWS, Code de la route, Piano. Un **sujet** est ce qu'on veut revoir : les dérivées, les hooks React, le vocabulaire du voyage, les accords majeurs, les règles de priorité. Ses **révisions** sont les échéances que le programme calcule.

La **pratique** est le pendant des révisions : pour un cours ce sont des exercices, pour le piano c'est la répétition, pour une langue une conversation, pour le code de la route une série de questions. C'est un état — à faire, en cours, terminée — et non une date : elle vit dans la colonne du tableau de suivi et sur la fiche du sujet.

## Trois vues

- **Aujourd'hui** — une grille bento : les révisions du jour cochables sur place, les retards, puis une carte de synthèse — ce qu'il reste à faire en tout et la charge des quatorze prochains jours. Sous le bento, les prochaines échéances.
- **Calendrier** — la répartition dans le temps : nombre de révisions par jour lu en un à trois points, navigation au clavier, et le détail du jour dans une feuille glissant du bas.
- **Suivi** — un tableau par catégorie : les sujets en lignes, les étapes de révision en colonnes, la pratique en dernière colonne.

## Fonctionnalités

- **Fiche d'un sujet** : la frise en grand, liste complète des échéances, progression, pratique, modification, archivage, suppression.
- **Trois programmes** de répétition espacée :
  - Simple — J+1, J+3, J+7, J+14, J+30
  - Poussé — J+1, J+2, J+4, J+7, J+14, J+30, J+60
  - Ultime — J+1, J+2, J+4, J+7, J+14, J+30, J+60, J+90, J+180, J+365
- **Programmes personnalisés** : un rythme se compose en touchant des graduations, pas en tapant des nombres.
- **Couleurs de catégorie** : huit teintes, ou n'importe quelle couleur. Une catégorie jamais configurée reçoit une teinte dérivée de son nom, identique d'un appareil à l'autre.
- **Sauvegarde locale** : export et import de la totalité des données au format JSON.
- **PWA** : installable, fonctionne hors ligne, se met à jour via Service Worker avec un toast de confirmation.

### La frise

Une frise graduée représente le programme d'un sujet : chaque graduation est une échéance, et l'écart entre deux graduations est proportionnel à l'écart réel entre les dates, compressé en racine carrée. L'espacement de la répétition espacée devient visible. Elle apparaît à trois endroits — fiche d'un sujet, ligne de liste, aperçu du formulaire — et nulle part ailleurs. Dans la feuille du calendrier, où chaque entrée tient sur deux lignes, elle cède la place à la même information écrite : « Révision 2 sur 5 · Prochaine : 8 août ».

### Le tableau de suivi

C'est un vrai tableau, y compris sur un téléphone. Le replier en cartes ferait perdre ce qu'on vient y chercher : comparer les sujets verticalement, les étapes horizontalement, et voir les trous. La réponse au petit écran n'est donc pas de supprimer le défilement horizontal mais de le rendre lisible — colonne du sujet figée, en-tête figé, aperçu de la colonne suivante, et une phrase quand le tableau déborde.

Deux modes de colonnes. **Intervalles** les nomme par leur écart — J+1, J+3, J+7 — à partir de l'union des écarts de la catégorie ; une étape absente d'un programme s'y lit par un tiret. **Compact** les numérote — R1, R2, R3 — et tient dans 44px par colonne, ce qui le rend praticable sur un téléphone. Le mode suit la largeur tant que rien n'a été choisi, puis c'est le choix qui vaut.

Cinq états, cinq formes : effectuée, à effectuer aujourd'hui, en retard, à venir, hors programme. Elles se distinguent en niveaux de gris — la couleur ne porte jamais l'information seule — et chaque case dit son état en toutes lettres pour les lecteurs d'écran. Toucher une cellule ouvre un panneau qui permet de valider, d'annuler une validation ou d'ouvrir le sujet.

### Recalage après retard

Valider une révision en retard recale les échéances suivantes sur la date réelle de validation, en conservant les écarts du programme : une J+7 validée avec trois jours de retard place la J+14 sept jours après la validation, pas quatre. Sans ce recalage, rattraper une semaine de retard ferait tomber toutes les échéances suivantes le même jour.

### Valider, puis annuler

Marquer une révision comme revue se fait en un tap depuis n'importe quelle liste — et depuis n'importe quelle cellule du tableau de suivi —, sans ouvrir de fiche et sans confirmation : l'affichage change tout de suite, l'écriture suit, et un toast propose « Annuler » pendant cinq secondes. La suppression est la seule action qui demande une confirmation.

Il n'y a volontairement aucun algorithme adaptatif, aucune notification, aucun thème sombre et aucune gamification.

## Démarrage

```bash
npm install
npm run dev        # serveur de développement
```

Le Service Worker est désactivé en développement ; pour tester le mode hors ligne et l'installation :

```bash
npm run build
npm run preview
```

## Scripts

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification des types puis build de production dans `dist/` |
| `npm run preview` | Sert le build de production (Service Worker actif) |
| `npm run typecheck` | Vérification TypeScript seule |
| `npm test` | Tests unitaires de la logique métier (Vitest) |
| `npm run icons` | Régénère les icônes PNG de `public/` |

## Structure

```
src/
├── components/   composants d'interface partagés
├── db/           accès IndexedDB (idb)
├── lib/          logique métier pure : programmes, dates, recalage, frise,
│                 calendrier, catégories, teintes, statistiques, suivi,
│                 migration, sauvegarde
├── pages/        une page par route
├── state/        contextes React (données, toast) et hooks partagés
└── styles/       tokens.css, reset.css, base.css, composants.css, ecrans.css
scripts/
└── generate-icons.mjs   génération des icônes PNG, sans dépendance
```

La logique métier de `src/lib/` ne dépend ni de React ni du DOM, ce qui la rend directement testable : `npm test` couvre la génération des dates, le recalage après retard, la géométrie de la frise, le regroupement par catégorie, l'attribution des teintes, les statistiques, le modèle du tableau de suivi, la migration des anciennes données, le formatage et la validation des sauvegardes.

Toute décision visuelle vient de [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), et toute valeur de couleur, taille ou espacement passe par une variable de `src/styles/tokens.css`.

## Modèle de données

Trois entités liées par identifiant, plus les programmes personnalisés.

```ts
type Category = { id, name, tint, createdAt, updatedAt }
type Topic    = { id, categoryId, title, startDate, scheduleId,
                  practiceStatus, status, createdAt, updatedAt }
type Review   = { id, topicId, position, intervalInDays, dueDate, completedAt }
```

`categoryId` peut être `null` : un sujet sans catégorie est un état normal, et « Sans catégorie » est un groupe d'affichage, pas une ligne de la base. Une révision est faite si et seulement si `completedAt` n'est pas nul — il n'y a pas de drapeau à côté qui pourrait le contredire. Le tableau de suivi ne stocke rien : il n'est qu'une projection des sujets et de leurs révisions.

## Format d'export

L'export produit un fichier `revoir-AAAA-MM-JJ.json` :

```json
{
  "app": "revoir",
  "version": 4,
  "exporteLe": "2026-03-14T10:00:00.000Z",
  "categories": [
    { "id": "c1", "name": "Développement", "tint": "bleu",
      "createdAt": "2026-03-01T09:00:00.000Z", "updatedAt": "2026-03-01T09:00:00.000Z" }
  ],
  "topics": [
    { "id": "a1", "categoryId": "c1", "title": "Hooks React",
      "startDate": "2026-03-01", "scheduleId": "simple",
      "practiceStatus": "todo", "status": "active",
      "createdAt": "2026-03-01T09:00:00.000Z", "updatedAt": "2026-03-02T09:00:00.000Z" }
  ],
  "reviews": [
    { "id": "r1", "topicId": "a1", "position": 1, "intervalInDays": 1,
      "dueDate": "2026-03-02", "completedAt": "2026-03-02T09:00:00.000Z" }
  ],
  "programmes": []
}
```

À l'import, le fichier est validé champ par champ et **remplace** l'intégralité des données existantes ; une confirmation est demandée au préalable. Un sujet qui désignerait une catégorie absente du fichier, ou une révision un sujet absent, fait échouer l'import : c'est l'intégrité que le modèle plat n'avait pas à défendre.

Les sauvegardes en version 1 à 3 — qui portaient des « éléments » et une table de teintes indexée par nom — restent importables. Elles passent par la même conversion que la migration de la base, dans `src/lib/migration.ts` : une seule implémentation, deux chemins d'entrée. Deux conversions distinctes finiraient par diverger sur un cas limite, et le cas limite d'une migration, c'est la donnée de quelqu'un.

## Vie privée

Il n'y a pas de serveur : rien ne quitte l'appareil. Les données vivent dans l'IndexedDB du navigateur, sous la base `revoir`. Effacer les données du site depuis le navigateur supprime donc toutes les révisions — d'où l'intérêt d'exporter régulièrement.

## Technologies

React 19, TypeScript, Vite, vite-plugin-pwa, React Router, IndexedDB via `idb`, date-fns, CSS natif.

Une seule dépendance d'interface, et elle est *headless* : [TanStack Table](https://tanstack.com/table) fournit le modèle du tableau de suivi — colonnes, lignes, cellules — et pas une règle de style. Le balisage, le CSS et l'accessibilité sont écrits dans le projet. Aucune bibliothèque de graphiques : les six icônes sont des composants SVG écrits à la main.

> Note sur les dépendances : `react-router-dom` est maintenu en dernière version. `npm audit` y signale un avis concernant le mode RSC, que cette application n'utilise pas — c'est une SPA statique, sans action serveur. Les versions antérieures cumulent bien plus d'avis réellement applicables.

## Licence

MIT — voir [LICENSE](LICENSE).
