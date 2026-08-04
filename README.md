# Revoir

> Application PWA minimaliste pour planifier ses révisions par répétition espacée, sans stocker le contenu à apprendre.

Revoir ne conserve ni vos cours, ni vos fiches, ni vos documents. Vous indiquez seulement **ce que** vous voulez revoir — un titre, une catégorie, une date de départ, un programme — et l'application calcule les dates de révision. Elle répond à une seule question :

> Qu'est-ce que je dois revoir aujourd'hui ?

Aucun compte, aucun serveur, aucune synchronisation, aucune publicité, aucun tracking. Toutes les données restent dans le navigateur de l'appareil.

## Fonctionnalités

- **Tableau de bord** : révisions du jour, retards, prochaines échéances, statistiques et charge des sept prochains jours.
- **Calendrier mensuel** : nombre de révisions par jour, détail au clic sur une date.
- **Fiche d'élément** : programme utilisé, liste complète des révisions, progression, modification, archivage, suppression.
- **Trois programmes** de répétition espacée :
  - Simple — J+1, J+3, J+7, J+14, J+30
  - Poussé — J+1, J+2, J+4, J+7, J+14, J+30, J+60
  - Ultime — J+1, J+2, J+4, J+7, J+14, J+30, J+60, J+90, J+180, J+365
- **Sauvegarde locale** : export et import de la totalité des données au format JSON.
- **PWA** : installable, fonctionne hors ligne, se met à jour via Service Worker avec un toast de confirmation.

Les dates sont figées à la création d'un élément : cocher une révision en retard ne décale jamais les suivantes. Il n'y a volontairement aucun algorithme adaptatif, aucune notification et aucun thème sombre.

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
├── lib/          logique métier pure : programmes, dates, statistiques, sauvegarde
├── pages/        une page par route
├── state/        contexte React des éléments
└── styles/       CSS natif : reset, thème, feuille principale
scripts/
└── generate-icons.mjs   génération des icônes PNG, sans dépendance
```

La logique métier de `src/lib/` ne dépend ni de React ni du DOM, ce qui la rend directement testable : `npm test` couvre la génération des dates, les statistiques, le formatage et la validation des sauvegardes.

## Format d'export

L'export produit un fichier `revoir-AAAA-MM-JJ.json` :

```json
{
  "app": "revoir",
  "version": 1,
  "exportedAt": "2026-03-14T10:00:00.000Z",
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

À l'import, le fichier est validé champ par champ et **remplace** l'intégralité des données existantes ; une confirmation est demandée au préalable.

## Vie privée

Il n'y a pas de serveur : rien ne quitte l'appareil. Les données vivent dans l'IndexedDB du navigateur, sous la base `revoir`. Effacer les données du site depuis le navigateur supprime donc toutes les révisions — d'où l'intérêt d'exporter régulièrement.

## Technologies

React 19, TypeScript, Vite, vite-plugin-pwa, React Router, IndexedDB via `idb`, date-fns, CSS natif. Aucune bibliothèque d'interface : les quelques icônes sont des composants SVG écrits à la main.

> Note sur les dépendances : `react-router-dom` est maintenu en dernière version. `npm audit` y signale un avis concernant le mode RSC, que cette application n'utilise pas — c'est une SPA statique, sans action serveur. Les versions antérieures cumulent bien plus d'avis réellement applicables.

## Licence

MIT — voir [LICENSE](LICENSE).
