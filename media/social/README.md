# Visuels de présentation

Six visuels qui présentent l'application, chacun dans deux formats — et deux
mises en page, pas un dessin et son recadrage.

Le **16:9** (1920 × 1080) est une planche : on la lit posée, de gauche à droite,
et elle a la place de montrer trois écrans côte à côte ou une frise étirée. Elle
sert les fils larges — LinkedIn, X, l'aperçu d'un lien.

Le **9:16** (1080 × 1920) est une **story Instagram** : tenue à bout de bras,
lue en cinq secondes, avec le nom du compte en haut et la barre de réponse en
bas. Elle est donc écrite autrement — un titre qui prend le tiers de la hauteur,
une seule idée, un seul objet à regarder, et rien d'utile dans les bandes que
l'interface recouvre. Trois différences de fond en découlent : la frise s'y
dresse et descend l'écran au lieu de traverser un bandeau ; les trois vues
cèdent la place à **un seul écran montré en grand**, dont la barre du bas nomme
les deux autres ; les paragraphes deviennent des listes.

| Visuel | Ce qu'il dit |
| --- | --- |
| `revoir-question` | La question à laquelle l'application répond |
| `revoir-principe` | La répétition espacée, montrée par la frise |
| `revoir-vues` | Aujourd'hui, le calendrier, le suivi |
| `revoir-geste` | Cocher en un tap, annuler, recaler |
| `revoir-ne-fait-pas` | Ce que Revoir ne fait pas — sur le papier de nuit |
| `revoir-fin` | Le nom, l'icône, où le trouver |

Ils ne sont pas dessinés à la main puis importés : ils sont **rendus depuis le
design system**, comme les icônes. La palette vient de `src/styles/tokens.css`,
la géométrie de la frise de `src/lib/frise.ts`, et les phrases du dictionnaire
français de `src/i18n/fr.ts`. Une valeur qui change dans l'application change
ici au prochain rendu.

```bash
npm run social
```

Le rendu se fait par le Chromium déjà présent pour les tests, à la taille
finale — aucune image n'est remise à l'échelle. Si le binaire n'est pas trouvé,
renseignez `CHROME_BIN`.

Ces fichiers ne partent pas dans le build : ils vivent dans `media/`, et non
dans `public/`, parce qu'ils n'ont rien à faire dans l'application installée.
