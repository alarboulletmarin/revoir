# Revoir

[![Licence : AGPL-3.0-only](https://img.shields.io/badge/licence-AGPL--3.0--only-blue.svg)](LICENSE)

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

Une **catégorie** regroupe des sujets : Mathématiques, Anglais, React, Certification AWS, Code de la route, Piano. C'est ce qu'on gère, non ce qu'on tape : elle existe avant ses sujets, qui la désignent. Un **sujet** est ce qu'on veut revoir : les dérivées, les hooks React, le vocabulaire du voyage, les accords majeurs, les règles de priorité. Ses **révisions** sont les échéances que le programme calcule.

La **pratique** est le pendant des révisions : pour un cours ce sont des exercices, pour le piano c'est la répétition, pour une langue une conversation, pour le code de la route une série de questions. C'est un état — à faire, en cours, terminée — et non une date : elle vit dans la colonne du tableau de suivi et sur la fiche du sujet.

## Trois vues

- **Aujourd'hui** — une grille bento : les révisions du jour cochables sur place, les retards, puis une carte de synthèse — ce qu'il reste à faire en tout et la charge des quatorze prochains jours. Sous le bento, les prochaines échéances.
- **Calendrier** : la répartition dans le temps : nombre de révisions par jour lu en un à trois points, navigation au clavier, et le détail du jour dans une feuille glissant du bas.
- **Suivi** : un tableau par catégorie : les sujets en lignes, les étapes de révision en colonnes, la pratique en dernière colonne.

Elles vivent dans une barre fixée en **bas** de l'écran — l'icône au-dessus du mot —, là où le pouce arrive : l'application s'installe et se tient d'une main. En haut, la coque porte le logotype à gauche, l'aide et les réglages à droite ; partout où l'on n'est pas sur une vue, le logotype cède sa place à un **retour**. Une application installée n'a pas de bouton « précédent », et un formulaire sans sortie est une impasse.

Plus deux écrans qui ne sont pas des vues : les **réglages**, et une page d'**aide**, avec le vocabulaire, les programmes, le recalage, la lecture du tableau, le sort de vos données. Elle s'ouvre par le « ? » de l'en-tête et fonctionne hors ligne, comme le reste.

Tant qu'aucun sujet n'existe, « Aujourd'hui » présente le projet plutôt qu'une grille de zéros : la question, la frise en grand, trois temps, et ce que Revoir ne fait pas.

## Les six règles

Le code s'y réfère par leur numéro ; les voici en toutes lettres.

1. **Le recalage après retard.** Valider une révision en retard recale les échéances suivantes sur la date réelle de validation, en conservant les écarts du programme.
2. **On annule, on ne confirme pas.** Valider se fait en un tap, sans confirmation ; un toast propose « Annuler » pendant cinq secondes.
3. **La suppression est la seule exception** : elle demande une confirmation, et elle seule.
4. **L'aperçu montre la charge.** Avant de créer un sujet, on voit combien de révisions sont déjà prévues sur chacune des dates générées.
5. **Un sujet archivé reste dans l'export.** Archiver n'est pas supprimer.
6. **Reporter ne déplace que l'échéance visée.** Un report ne dit rien du rythme réel, il dit « pas aujourd'hui ».

## Fonctionnalités

- **Fiche d'un sujet** : la frise en grand, liste complète des échéances, progression, pratique, duplication, modification, archivage, suppression.
- **Trois programmes** de répétition espacée :
  - Simple : J+1, J+3, J+7, J+14, J+30
  - Poussé : J+1, J+2, J+4, J+7, J+14, J+30, J+60
  - Ultime : J+1, J+2, J+4, J+7, J+14, J+30, J+60, J+90, J+180, J+365
- **Programmes personnalisés** : un rythme se compose en touchant des graduations, pas en tapant des nombres.
- **Catégories** : elles se créent, se renomment, se recolorent et se suppriment depuis leur écran, et vivent sans aucun sujet. Six sont livrées à la première installation, chacune avec sa couleur. Sur la fiche d'un sujet, on en choisit une dans une liste, avec un raccourci pour en créer une sans quitter le formulaire. Supprimer une catégorie ne supprime aucun sujet : les siens passent « Sans catégorie ».
- **Couleurs de catégorie** : huit teintes, ou n'importe quelle couleur. Une catégorie créée sans choix reçoit une teinte dérivée de son nom, identique d'un appareil à l'autre.
- **Report d'une échéance** : « pas aujourd'hui, demain ». Voir plus bas.
- **Duplication d'un sujet** : le formulaire de création s'ouvre avec la catégorie, le programme et le titre du sujet d'origine, la date au jour. Rien n'est écrit tant qu'il n'est pas soumis.
- **Sauvegarde locale** : export et import de la totalité des données au format JSON.
- **Export calendrier** : un fichier `.ics` — tous les sujets depuis les réglages, un seul depuis sa fiche — à importer dans Google Agenda, Apple Calendrier, Outlook ou Thunderbird. Voir plus bas.
- **Thème clair, sombre ou système**, et **interface en français ou en anglais**. Les deux sont des préférences d'appareil : elles ne partent pas dans l'export.
- **PWA** : installable, fonctionne hors ligne, se met à jour via Service Worker avec un toast de confirmation.

### La frise

Une frise graduée représente le programme d'un sujet : chaque graduation est une échéance, et l'écart entre deux graduations est proportionnel à l'écart réel entre les dates, compressé en racine carrée. L'espacement de la répétition espacée devient visible. Elle apparaît à trois endroits — fiche d'un sujet, ligne de liste, aperçu du formulaire — et nulle part ailleurs. Dans la feuille du calendrier, où chaque entrée tient sur deux lignes, elle cède la place à la même information écrite : « Révision 2 sur 5 · Prochaine : 8 août ».

### Le tableau de suivi

C'est un vrai tableau, y compris sur un téléphone. Le replier en cartes ferait perdre ce qu'on vient y chercher : comparer les sujets verticalement, les étapes horizontalement, et voir les trous. La réponse au petit écran n'est donc pas de supprimer le défilement horizontal mais de le rendre lisible : colonne du sujet figée, en-tête figé, aperçu de la colonne suivante, et une phrase quand le tableau déborde.

Deux modes de colonnes. **Intervalles** les nomme par leur écart — J+1, J+3, J+7 — à partir de l'union des écarts de la catégorie ; une étape absente d'un programme s'y lit par un tiret. **Compact** les numérote — R1, R2, R3 — et tient dans 44px par colonne, ce qui le rend praticable sur un téléphone. Le mode suit la largeur tant que rien n'a été choisi, puis c'est le choix qui vaut.

Cinq états, cinq formes : effectuée, à effectuer aujourd'hui, en retard, à venir, hors programme. Elles se distinguent en niveaux de gris — la couleur ne porte jamais l'information seule — et chaque case dit son état en toutes lettres pour les lecteurs d'écran. Toucher une cellule ouvre un panneau qui permet de valider, d'annuler une validation ou d'ouvrir le sujet.

### Recalage après retard

Valider une révision en retard recale les échéances suivantes sur la date réelle de validation, en conservant les écarts du programme : une J+7 validée avec trois jours de retard place la J+14 sept jours après la validation, pas quatre. Sans ce recalage, rattraper une semaine de retard ferait tomber toutes les échéances suivantes le même jour.

### Reporter, qui n'est pas recaler

Une échéance peut reculer d'un jour, depuis la fiche d'un sujet ou depuis le panneau d'une cellule du tableau. **Elle seule bouge.** Le recalage déplace les suivantes parce qu'une validation dit quelque chose du rythme réel : elle a eu lieu, et le programme repart de là. Un report ne dit rien de tel, il dit « pas aujourd'hui » : le programme n'a pas changé, les échéances suivantes non plus.

Une révision en retard se reporte à demain, et non au lendemain de sa date passée : sinon le report ne ferait que déplacer le retard d'un jour.

### Valider, puis annuler

Marquer une révision comme revue se fait en un tap depuis n'importe quelle liste — et depuis n'importe quelle cellule du tableau de suivi —, sans ouvrir de fiche et sans confirmation : l'affichage change tout de suite, l'écriture suit, et un toast propose « Annuler » pendant cinq secondes. La suppression est la seule action qui demande une confirmation.

### L'export calendrier

Une seconde sortie, à côté du JSON, et pour un usage différent. Le JSON est une **sauvegarde** : il se réimporte, il porte tout, y compris les sujets archivés. Le `.ics` est une **copie versée dans un agenda** : on l'ouvre ailleurs, et rien n'en revient jamais. Ce n'est pas une synchronisation : il n'y a pas de serveur, et il faut réexporter après avoir ajouté des sujets.

Trois décisions, et chacune découle du projet plutôt que du format. **Des journées entières, pas des rendez-vous** : une révision a un jour, pas une heure, et `DTSTART;VALUE=DATE` évite du même coup toute question de fuseau. **Ce qui reste à faire, et rien d'autre** : une révision effectuée n'est plus une échéance, et la verser dans un agenda y remplirait des semaines de rappels périmés. **Aucune alarme** : `VALARM` ferait sonner un téléphone, et l'application ne notifie pas. Qui veut un rappel le règle dans son agenda, où ce choix lui appartient.

Le bouton global vit dans les réglages, à côté de la sauvegarde ; celui d'un sujet sur sa fiche, parmi ses autres actions. Un export vide n'est pas produit : l'application le dit plutôt que de livrer un fichier qu'un agenda importerait sans un mot.

### Deux langues, deux thèmes

L'interface se lit en français ou en anglais, et se rend en clair, en sombre, ou selon le système. Les deux choix se règlent en tête des réglages et valent pour cet appareil : ils ne sont pas dans les données, donc ni dans l'export ni dans un éventuel import.

Le français est la langue de référence : `src/i18n/fr.ts` définit la forme du dictionnaire, et l'anglais ne compile que s'il la respecte au champ près. Un écran nouveau ne peut pas oublier une traduction. La traduction ne touche pas que des mots : l'ordre des champs d'une date, le premier jour de la semaine, le « J+7 » qui devient « D+7 », le pluriel à zéro. Ce que l'utilisateur a écrit, lui, n'est jamais traduit.

Le thème sombre n'est pas le clair inversé : le registre reste celui du papier et de l'instrument, le fond est un noir chaud, et les huit teintes de catégorie y sont éclaircies en OKLab jusqu'à retrouver le contraste qu'elles tenaient sur le papier crème. Une couleur libre est ajustée au fond réellement rendu, mais ce qui est enregistré ne dépend jamais du thème.

Il n'y a volontairement aucun algorithme adaptatif, aucune notification et aucune gamification.

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
| `npm run icons` | Régénère les icônes PNG et l'image de partage de `public/` |
| `npm run social` | Régénère les visuels de présentation de `media/social/` |
| `npm run notices` | Régénère `public/THIRD-PARTY.txt`, joué par `build` |

## Structure

```
src/
├── components/   composants d'interface partagés
├── db/           accès IndexedDB (idb)
├── i18n/         les deux dictionnaires et la langue active
├── lib/          logique métier pure : programmes, dates, recalage, frise,
│                 calendrier, catégories, teintes, statistiques, suivi,
│                 migration, sauvegarde, export calendrier
├── pages/        une page par route
├── state/        contextes React (préférences, données, toast) et hooks
└── styles/       tokens.css, reset.css, base.css, composants.css, ecrans.css
scripts/
├── generate-icons.mjs     icônes PNG et image de partage, sans dépendance
├── generate-notices.mjs   licences des composants tiers, sans dépendance
└── generate-social.mjs    visuels de présentation, rendus par Chromium
media/
└── social/                les six visuels, en 16:9 et en 9:16
```

La logique métier de `src/lib/` ne dépend ni de React ni du DOM, ce qui la rend directement testable : `npm test` couvre la génération des dates, le recalage après retard, la géométrie de la frise, le regroupement par catégorie, l'attribution des teintes dans les deux thèmes, les catégories proposées et le détachement des sujets d'une catégorie supprimée, les statistiques, le modèle du tableau de suivi, la migration des anciennes données, le formatage et la validation des sauvegardes, la sérialisation du calendrier `.ics`, et l'accord des deux dictionnaires.

Toute décision visuelle vient de [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), et toute valeur de couleur, taille ou espacement passe par une variable de `src/styles/tokens.css`.

## Modèle de données

Trois entités liées par identifiant, plus les programmes personnalisés.

```ts
type Category = { id, name, tint, createdAt, updatedAt }
type Topic    = { id, categoryId, title, startDate, scheduleId,
                  practiceStatus, status, createdAt, updatedAt }
type Review   = { id, topicId, position, intervalInDays, dueDate, completedAt }
```

`categoryId` peut être `null` : un sujet sans catégorie est un état normal, et « Sans catégorie » est un groupe d'affichage, pas une ligne de la base. C'est aussi là que retombent les sujets d'une catégorie supprimée : la suppression détache, elle n'emporte rien. Symétriquement, une catégorie survit à zéro sujet : elle se prépare avant d'en avoir un, et rien ne la ramasse dans son dos. Une révision est faite si et seulement si `completedAt` n'est pas nul. Il n'y a pas de drapeau à côté qui pourrait le contredire. Le tableau de suivi ne stocke rien : il n'est qu'une projection des sujets et de leurs révisions.

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

La version reste 4 : la forme des entités n'a pas changé. Le tableau `categories` peut en revanche contenir des catégories qu'aucun sujet ne référence — elles existent à part entière — et l'import les conserve.

À l'import, le fichier est validé champ par champ et **remplace** l'intégralité des données existantes ; une confirmation est demandée au préalable. Un sujet qui désignerait une catégorie absente du fichier, ou une révision un sujet absent, fait échouer l'import : c'est l'intégrité que le modèle plat n'avait pas à défendre. La vérification va du sujet vers la catégorie, jamais l'inverse.

Les sauvegardes en version 1 à 3 — qui portaient des « éléments » et une table de teintes indexée par nom — restent importables. Elles passent par la même conversion que la migration de la base, dans `src/lib/migration.ts` : une seule implémentation, deux chemins d'entrée. Deux conversions distinctes finiraient par diverger sur un cas limite, et le cas limite d'une migration, c'est la donnée de quelqu'un.

Le fichier `.ics` est un format **de sortie seulement** : il n'a pas d'import, et il ne remplace pas la sauvegarde. Il produit un `revoir-AAAA-MM-JJ.ics` — ou `revoir-<sujet>-AAAA-MM-JJ.ics` pour un sujet seul —, un `VEVENT` en journée entière par échéance restante, l'identifiant de la révision en `UID` pour qu'un réimport écrase l'ancien plutôt que de le doubler.

## Vie privée

Il n'y a pas de serveur : rien ne quitte l'appareil. Les données vivent dans l'IndexedDB du navigateur, sous la base `revoir`. Effacer les données du site depuis le navigateur supprime donc toutes les révisions, d'où l'intérêt d'exporter régulièrement.

## Technologies

React 19, TypeScript, Vite, vite-plugin-pwa, React Router, IndexedDB via `idb`, date-fns, CSS natif.

Une seule dépendance d'interface, et elle est *headless* : [TanStack Table](https://tanstack.com/table) fournit le modèle du tableau de suivi — colonnes, lignes, cellules — et pas une règle de style. Le balisage, le CSS et l'accessibilité sont écrits dans le projet. Aucune bibliothèque de graphiques : les neuf icônes sont des composants SVG écrits à la main. Aucune bibliothèque d'internationalisation non plus : deux dictionnaires typés l'un contre l'autre, et les pluriels sont des fonctions.

Aucune police téléchargée : la pile système, et rien d'autre. Aucun CDN, aucun appel réseau à l'exécution. Une application qui promet que rien ne quitte l'appareil ne peut pas aller chercher une police ailleurs.

> Note sur les dépendances : `react-router-dom` est maintenu en dernière version. `npm audit` y signale un avis concernant le mode RSC, que cette application n'utilise pas : c'est une SPA statique, sans action serveur. Les versions antérieures cumulent bien plus d'avis réellement applicables.

## Contribuer

Les contributions sont bienvenues. [`CONTRIBUTING.md`](CONTRIBUTING.md) dit ce qu'il faut savoir avant d'écrire une ligne, en particulier ce que le projet refuse par principe, qui ne se devine pas : gamification, notifications, algorithme adaptatif, thème sombre, mesure d'audience, stockage du contenu à apprendre.

Toute décision visuelle vient de [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), qui est la référence et non un document d'intention.

Pour signaler une faille de sécurité, ne passez pas par une issue publique : voir [`SECURITY.md`](SECURITY.md). Les échanges dans le projet suivent le [code de conduite](CODE_OF_CONDUCT.md).

Le journal des versions est dans [`CHANGELOG.md`](CHANGELOG.md).

## Licence

**AGPL-3.0-only**, voir [LICENSE](LICENSE). Copyright (c) 2026 Andréa Larboullet Marin.

C'est une licence libre à copyleft fort. En clair :

- **Utiliser Revoir, l'installer, l'héberger, le modifier pour vous : librement**, y compris dans un cadre professionnel ou commercial. La licence ne discrimine aucun usage.
- **Redistribuer Revoir, ou l'héberger pour d'autres, après l'avoir modifié : vous devez publier vos sources modifiées sous AGPL-3.0.** L'article 13 l'exige même quand le logiciel n'est qu'accessible par le réseau, et c'est bien le cas ici, puisque servir l'application, c'est en distribuer le code au navigateur.
- **L'intégrer dans un produit fermé : non**, sauf accord séparé avec l'auteur.

L'intention n'est pas d'empêcher qui que ce soit de gagner sa vie avec Revoir, c'est d'empêcher qu'on le referme. Ce qui part d'ici reste libre.

Si vous hébergez Revoir, l'application affiche déjà dans ses réglages un lien vers le code source et la version exacte servie : c'est ce que demande l'article 13. Si vous en publiez une version modifiée, faites pointer ce lien vers **votre** dépôt.

Les bibliothèques embarquées dans le build sont sous licences permissives (MIT, ISC), compatibles avec l'AGPL, et leurs mentions voyagent avec l'application : `public/THIRD-PARTY.txt` est régénéré à chaque build par `scripts/generate-notices.mjs`, servi en ligne et hors ligne, et accessible depuis les réglages. La MIT demande que sa mention de copyright accompagne toute portion substantielle du logiciel : le bundle contient leur code, il doit donc contenir leurs licences.
