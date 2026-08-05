# Revoir

> Application PWA minimaliste pour planifier ses révisions par répétition espacée, sans stocker le contenu à apprendre.

Revoir ne conserve ni vos cours, ni vos fiches, ni vos documents. Vous indiquez seulement **ce que** vous voulez revoir — un titre, une catégorie, une date de départ, un programme — et l'application calcule les dates de révision. Elle répond à une seule question :

> Qu'est-ce que je dois revoir aujourd'hui ?

Aucun compte, aucun serveur, aucune synchronisation, aucune publicité, aucun tracking. Toutes les données restent dans le navigateur de l'appareil.

## Fonctionnalités

- **Tableau de bord** en grille bento : révisions du jour cochables sur place, retards, progression, charge des quatorze prochains jours, prochaines échéances. Sous le bento, les éléments regroupés **par matière**, chaque groupe repliable.
- **Calendrier mensuel** : nombre de révisions par jour lu en un à trois points, navigation au clavier, et le détail du jour dans une feuille glissant du bas.
- **Fiche d'élément** : la frise en grand, liste complète des échéances, progression, modification, archivage, suppression.
- **Trois programmes** de répétition espacée :
  - Simple — J+1, J+3, J+7, J+14, J+30
  - Poussé — J+1, J+2, J+4, J+7, J+14, J+30, J+60
  - Ultime — J+1, J+2, J+4, J+7, J+14, J+30, J+60, J+90, J+180, J+365
- **Couleurs de matière** : huit teintes, choisies dans les réglages ou au formulaire. Une matière jamais configurée reçoit une teinte dérivée de son nom, identique d'un appareil à l'autre.
- **Sauvegarde locale** : export et import de la totalité des données au format JSON.
- **PWA** : installable, fonctionne hors ligne, se met à jour via Service Worker avec un toast de confirmation.

### La frise

Une frise graduée représente le programme d'un élément : chaque graduation est une échéance, et l'écart entre deux graduations est proportionnel à l'écart réel entre les dates, compressé en racine carrée. L'espacement de la répétition espacée devient visible. Elle apparaît à trois endroits — fiche d'un élément, item de liste, aperçu du formulaire — et nulle part ailleurs. Dans la feuille du calendrier, où chaque entrée tient sur deux lignes, elle cède la place à la même information écrite : « Révision 2 sur 5 · Prochaine : 8 août ».

### Recalage après retard

Valider une révision en retard recale les échéances suivantes sur la date réelle de validation, en conservant les écarts du programme : une J+7 validée avec trois jours de retard place la J+14 sept jours après la validation, pas quatre. Sans ce recalage, rattraper une semaine de retard ferait tomber toutes les échéances suivantes le même jour.

### Matières et couleurs

La couleur appartient à la matière, pas à l'élément : la changer quelque part la change partout. Elle ne sert jamais seule — le nom est toujours écrit à côté — et jamais en surface pleine, pour ne pas concurrencer la cellule du jour. Les huit teintes et leurs contraintes sont décrites en section 3 bis du design system.

### Valider, puis annuler

Marquer une révision comme revue se fait en un tap depuis n'importe quelle liste, sans ouvrir de fiche et sans confirmation : l'affichage change tout de suite, l'écriture suit, et un toast propose « Annuler » pendant cinq secondes. La suppression est la seule action qui demande une confirmation.

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
│                 calendrier, matières, teintes, statistiques, sauvegarde
├── pages/        une page par route
├── state/        contextes React (éléments, toast) et hooks partagés
└── styles/       tokens.css, reset.css, base.css, composants.css, ecrans.css
scripts/
└── generate-icons.mjs   génération des icônes PNG, sans dépendance
```

La logique métier de `src/lib/` ne dépend ni de React ni du DOM, ce qui la rend directement testable : `npm test` couvre la génération des dates, le recalage après retard, la géométrie de la frise, le regroupement par matière, l'attribution des teintes, les statistiques, le formatage et la validation des sauvegardes.

Toute décision visuelle vient de [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), et toute valeur de couleur, taille ou espacement passe par une variable de `src/styles/tokens.css`.

## Format d'export

L'export produit un fichier `revoir-AAAA-MM-JJ.json` :

```json
{
  "app": "revoir",
  "version": 2,
  "exporteLe": "2026-03-14T10:00:00.000Z",
  "teintes": { "développement": "bleu" },
  "items": [
    {
      "id": "…",
      "title": "Hooks React",
      "category": "Développement",
      "startDate": "2026-03-01",
      "schedule": "simple",
      "reviews": [
        { "offset": 1, "date": "2026-03-02", "done": true, "doneAt": "2026-03-02T09:00:00.000Z" }
      ],
      "archived": false,
      "createdAt": "2026-03-01T09:00:00.000Z",
      "updatedAt": "2026-03-02T09:00:00.000Z"
    }
  ]
}
```

À l'import, le fichier est validé champ par champ et **remplace** l'intégralité des données existantes ; une confirmation est demandée au préalable. Les sauvegardes en version 1, qui n'ont pas de champ `teintes`, restent importables : les matières y retrouvent la teinte dérivée de leur nom.

## Vie privée

Il n'y a pas de serveur : rien ne quitte l'appareil. Les données vivent dans l'IndexedDB du navigateur, sous la base `revoir`. Effacer les données du site depuis le navigateur supprime donc toutes les révisions — d'où l'intérêt d'exporter régulièrement.

## Technologies

React 19, TypeScript, Vite, vite-plugin-pwa, React Router, IndexedDB via `idb`, date-fns, CSS natif. Aucune bibliothèque d'interface ni de graphiques : les six icônes du projet sont des composants SVG écrits à la main.

> Note sur les dépendances : `react-router-dom` est maintenu en dernière version. `npm audit` y signale un avis concernant le mode RSC, que cette application n'utilise pas — c'est une SPA statique, sans action serveur. Les versions antérieures cumulent bien plus d'avis réellement applicables.

## Licence

MIT — voir [LICENSE](LICENSE).
