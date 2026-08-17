# Contribuer à Revoir

Merci de regarder. Ce document dit ce qu'il faut savoir avant d'écrire une ligne, surtout ce que le projet refuse, qui ne se devine pas.

## Le projet en trois phrases

Revoir répond à une seule question : **qu'est-ce que je dois revoir aujourd'hui ?** Il ne stocke jamais le contenu à apprendre, seulement ce qu'on veut revoir et quand. Il n'a ni serveur, ni compte, ni synchronisation : tout vit dans l'IndexedDB du navigateur.

Une proposition qui contredit une de ces trois phrases sera refusée, même bien écrite.

## Lire le design system d'abord

[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) est la référence unique de l'interface. Ce n'est pas un document d'intention : le code s'y réfère section par section, et une décision visuelle qui n'en découle pas est un défaut, pas un choix.

Sa **section 11** liste des interdits. Ils ne se négocient pas dans une pull request : ombres portées, dégradés, rouge, noir pur, blanc pur, majuscules forcées, emoji, icônes au-delà des sept existantes, bibliothèques de composants, thème sombre.

Le projet exclut aussi, explicitement et pour de bon :

- **la gamification** : aucune série à tenir, aucun score, aucun badge, aucun « Bravo ! » ;
- **les notifications** : l'application ne réclame rien ;
- **l'algorithme adaptatif** : pas de SM-2, pas de note de difficulté : le programme est choisi, pas calculé ;
- **toute mesure d'audience**, tout appel réseau à l'exécution, toute police ou script servi par un CDN ;
- **le stockage du contenu à apprendre** : c'est le cœur du projet, pas une limite technique.

Si une idée vous tient à cœur et figure dans cette liste, ouvrez une issue pour en parler : la réponse sera probablement non, mais elle sera argumentée.

## Démarrer

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires
npm run typecheck  # vérification TypeScript
npm run build      # notices + types + build de production
npm run preview    # sert le build (Service Worker actif)
```

Le Service Worker est désactivé en développement ; pour tester le mode hors ligne et l'installation, passez par `build` puis `preview`.

## Où va le code

```
src/lib/         logique métier pure — ni React, ni DOM. Testée.
src/db/          accès IndexedDB
src/state/       contextes React et hooks partagés
src/pages/       une page par route
src/components/  composants d'interface partagés
src/styles/      tokens.css, reset.css, base.css, composants.css, ecrans.css
```

Trois règles qui découlent de ce découpage :

1. **Toute décision métier va dans `src/lib/`**, sous forme de fonction pure, et arrive avec ses tests. « Que se passe-t-il quand on valide en retard », « quelles colonnes a cette catégorie », « cette sauvegarde est-elle valide » : ce sont des questions qui se testent sans navigateur, et le projet les teste toutes.
2. **Aucune valeur de couleur, de taille ou d'espacement n'est écrite en dur** hors de `src/styles/tokens.css`.
3. **Aucun composant ne porte de marge externe.** C'est le conteneur qui espace.

## Ce qu'on attend d'une pull request

- `npm run typecheck` et `npm test` passent.
- La logique métier ajoutée est testée. Le reste ne l'est pas encore automatiquement : vérifiez à la main, et dites-le dans la description.
- L'écran touché passe le **plancher qualité** de la section 10 du design system : cible tactile de 44px, focus visible, `prefers-reduced-motion`, contrastes, zoom à 200 %, et vérification à **320px** de large.
- Les commentaires expliquent **pourquoi**, pas quoi. Le code dit déjà ce qu'il fait ; ce qu'on relit six mois plus tard, c'est la raison d'un choix et le piège qu'il évite. C'est le style du projet, tenez-le.
- Le vocabulaire de l'interface est celui de la section 9 : français, casse normale, infinitif pour les actions, zéro emoji, zéro exclamation.

Les messages de commit sont en français et disent ce que le changement fait pour la personne qui utilise l'application, pas quel fichier a bougé.

## Signaler un bug

Passez par les [issues](https://github.com/alarboulletmarin/revoir/issues). Le gabarit demande le navigateur et si l'application tournait installée ou dans un onglet : les comportements d'IndexedDB, de `<dialog>` et du Service Worker divergent assez pour que la réponse en dépende.

Pour une faille de sécurité, ne passez pas par une issue publique : voir [SECURITY.md](SECURITY.md).

## Licence

En contribuant, vous acceptez que votre contribution soit distribuée sous la [licence AGPL-3.0](LICENSE) du projet.

Concrètement : votre code reste libre, et personne ne pourra l'enfermer dans un produit fermé. En contrepartie, qui héberge une version modifiée de Revoir doit en publier les sources. Les fichiers source portent l'en-tête `// SPDX-License-Identifier: AGPL-3.0-only` : gardez-le sur les fichiers existants, ajoutez-le sur ceux que vous créez.
