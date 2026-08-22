# Visuels de présentation

Six visuels qui présentent l'application, chacun dans deux formats : **16:9**
(1920 × 1080) pour les fils larges — LinkedIn, X, l'aperçu d'un lien — et
**9:16** (1080 × 1920) pour les formats debout — stories, Reels, TikTok. Lus
dans l'ordre, ils forment un carrousel ; pris isolément, chacun se suffit.

| # | Visuel | Ce qu'il dit |
| --- | --- | --- |
| 01 | `revoir-1-question` | La question à laquelle l'application répond |
| 02 | `revoir-2-principe` | La répétition espacée, montrée par la frise |
| 03 | `revoir-3-vues` | Aujourd'hui, le calendrier, le suivi |
| 04 | `revoir-4-geste` | Cocher en un tap, annuler, recaler |
| 05 | `revoir-5-ne-fait-pas` | Ce que Revoir ne fait pas — sur le papier de nuit |
| 06 | `revoir-6-fin` | Le nom, l'icône, où le trouver |

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
