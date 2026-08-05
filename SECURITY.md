# Sécurité

## Ce qu'il y a à attaquer

Revoir n'a **ni serveur, ni compte, ni API, ni base distante**. Rien n'est transmis, rien n'est reçu à l'exécution. La surface se limite donc à :

- le code servi au navigateur et les dépendances qu'il embarque ;
- le Service Worker et ses caches ;
- l'import de sauvegarde, seul point d'entrée de données extérieures à l'application ;
- l'hébergement statique, s'il est mal configuré.

Les données vivent dans l'IndexedDB du navigateur, sous la base `revoir`, sur l'appareil et nulle part ailleurs.

## Signaler une faille

**N'ouvrez pas d'issue publique.** Utilisez les [avis de sécurité privés](https://github.com/alarboulletmarin/revoir/security/advisories/new) de GitHub, qui permettent d'en discuter sans que la faille soit visible.

Décrivez ce que vous avez trouvé, comment le reproduire, et ce qu'un attaquant obtiendrait. Un correctif proposé est bienvenu, il n'est pas exigé.

C'est un projet personnel : la réponse est de bonne foi, pas contractuelle. Comptez quelques jours.

## Ce qui n'est pas une faille

- **Les données ne sont pas chiffrées au repos.** Qui a accès à l'appareil déverrouillé a accès aux révisions, comme à n'importe quel site ouvert dans ce navigateur. C'est assumé et documenté : l'application ne stocke ni contenu de cours, ni document, ni information personnelle — un titre, une catégorie, des dates.
- **Un fichier d'import mal formé est refusé, pas exploité.** L'import valide champ par champ, refuse une référence inconnue et remplace l'intégralité des données après confirmation. Si vous trouvez un fichier qui échappe à cette validation, c'est un bug intéressant — signalez-le.
- **L'avis `npm audit` sur `react-router` concernant le mode RSC.** Revoir est une application statique sans rendu serveur ni action serveur : cet avis ne s'y applique pas. Les versions antérieures cumulent bien plus d'avis réellement applicables.
- **Effacer les données du site depuis le navigateur supprime les révisions.** C'est le fonctionnement normal du stockage local, d'où l'export.

## Pour qui héberge Revoir

L'application est un lot de fichiers statiques. Deux points valent d'être vérifiés côté hébergement : servir en HTTPS, et réécrire les routes inconnues vers `index.html` — sans quoi un rechargement sur `/suivi` renvoie un 404 à la première visite.
