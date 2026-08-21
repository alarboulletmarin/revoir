# Journal des versions

Écrit à la main, dans la voix du projet : ce que chaque version change pour la personne qui utilise l'application, pas quels fichiers ont bougé. Les dates sont celles de la publication.

## Non publié

### Changé — l'écriture de l'interface

- **L'application prend une voix.** Les titres, les étiquettes et les chiffres ne s'écrivent plus dans la police que le système voulait bien donner — SF Pro ici, Roboto là, Segoe ailleurs, trois dessins pour un même écran. Arial est nommée en tête, avec Liberation Sans pour repli sur Linux, dont les chasses sont les siennes. Rien n'est téléchargé pour autant : c'est un nom, pas un fichier, et l'application continue de ne faire aucun appel réseau.
- **Les chiffres tiennent leur colonne.** Les dates, les compteurs et les décalages passent en chasse fixe, celle du système. Une échéance ne se décale plus d'un pixel par rapport à celle du dessus, et un compteur ne saute plus quand il change.
- **Le logotype s'écrit en capitales ouvertes**, à côté de sa règle graduée. C'est une marque, pas une phrase : ce que lit un lecteur d'écran reste le mot « Revoir ».
- Les titres gagnent une graisse et une chasse resserrée, et l'échelle typographique gagne trois crans nommés par ce qu'ils ouvrent — un écran, une page, un bloc — plutôt que par leur rang dans une suite.

### Changé — licence

- **Revoir passe de la licence MIT à l'AGPL-3.0.** La MIT laissait reprendre le code dans un produit fermé et payant sans rien rendre ; l'AGPL demande que toute version modifiée reste libre, y compris quand elle n'est qu'hébergée pour d'autres. L'usage, la modification et l'hébergement restent libres, commerce compris : ce qui change, c'est qu'on ne peut plus refermer ce qui part d'ici. Les réglages affichent désormais la version et le commit exact du build à côté du lien vers le code source : c'est ce que l'article 13 demande d'une application qu'on atteint par le réseau.

### Corrigé

- **Une coche ne se perd plus en route.** Valider une révision puis refermer aussitôt la feuille du calendrier, ou ouvrir la fiche dans la foulée, annulait l'enregistrement en silence : l'écran avait montré la coche, rien n'était écrit. Les deux cents millisecondes qui précèdent le retrait de la ligne appartiennent à l'animation, pas à la décision.
- **Le jour tourne à minuit.** L'application est installable : elle passe la nuit ouverte sur un téléphone, et annonçait au réveil la date de la veille. Mauvaise liste du jour, retard inventé. Elle se relit désormais à minuit, au retour au premier plan et à la reprise de la fenêtre.
- **« Tout voir » montre tout.** La liste des prochaines révisions s'arrêtait à cent sans le dire.
- Une révision à venir se valide depuis le panneau du tableau de suivi, comme elle se validait déjà depuis le calendrier, la liste des prochaines révisions et la fiche d'un sujet.
- Un filtre du suivi dont la catégorie n'a plus aucun sujet retombe sur « Toutes », au lieu de laisser la page vide et le champ sur une valeur qui n'existe plus. Et filtrer une catégorie la déplie.
- Une échéance tombée le même jour qu'une autre est annoncée comme la suivante, au lieu d'être passée sous silence.
- Au plafond de vingt échéances, une graduation de plus est refusée et dite, plutôt que d'effacer la plus lointaine sans un mot.

### Ajouté

- **Une barre de navigation en bas de l'écran.** Les trois vues — Aujourd'hui, Calendrier, Suivi — y portent leur signe au-dessus de leur mot. En bas parce que c'est là que le pouce arrive : l'application s'installe et se tient d'une main, et le geste central est justement un tap. L'en-tête garde le logotype à gauche, l'aide et les réglages à droite.
- **Un retour, partout où l'on n'est pas sur une vue.** Une application installée n'a pas de bouton « précédent » — ni barre de navigateur, ni geste système sur iOS en mode autonome —, et un formulaire ouvert depuis une fiche s'y terminait en impasse. Le retour prend la place du logotype et rend l'écran d'où l'on vient ; ouvert directement par un lien ou un raccourci, il remonte d'un cran dans la hiérarchie plutôt que de sortir de l'application.
- **Un thème sombre**, ou celui du système. Ce n'est pas le thème clair inversé : le registre reste celui du papier et de l'instrument, le fond est un noir chaud, et les huit couleurs de catégorie y sont éclaircies juste assez pour retrouver le contraste qu'elles tenaient sur le papier crème. Une couleur libre est ajustée au fond réellement affiché, mais ce qui est enregistré ne change pas avec le thème.
- **L'interface en anglais**, au choix, et par défaut celle du navigateur. La traduction ne touche pas que les mots : la date change d'ordre, la semaine ne commence plus le même jour, « J+7 » devient « D+7 ». Ce que vous avez écrit — titres, catégories, programmes — garde vos mots.
- **L'export calendrier.** Un fichier `.ics` à ouvrir dans Google Agenda, Apple Calendrier, Outlook ou Thunderbird : tous les sujets depuis les réglages, un seul depuis sa fiche. Des journées entières, pas des rendez-vous : une révision a un jour, pas une heure. Seules les échéances qui restent à faire y figurent, et aucune alarme n'est posée : l'application ne notifie pas, et ce n'est pas au fichier de décider à sa place. C'est une copie, pas une synchronisation : seul le fichier JSON se réimporte.
- **Reporter une révision.** Une échéance recule d'un jour, et elle seule : un report ne dit rien du rythme réel, il dit « pas aujourd'hui ». En retard, il vise demain plutôt que le lendemain d'une date passée. Depuis la fiche d'un sujet et depuis le panneau d'une cellule du suivi, sans confirmation, avec un message qui dit la nouvelle date et propose « Annuler ».
- **Dupliquer un sujet.** Le formulaire de création s'ouvre avec la catégorie, le programme et le titre du sujet d'origine, la date au jour. Rien n'est écrit tant qu'il n'est pas soumis.
- **Un écran de premier usage qui explique le projet** : la question, la frise en grand, trois temps, ce que Revoir ne fait pas. C'est aussi la page de présentation : même écran, même adresse.
- **Une page d'aide**, ouverte par un « ? » au bout de l'en-tête : le vocabulaire, les programmes, le retard et le recalage, la lecture du tableau de suivi, et ce qu'il advient de vos données. Hors ligne comme le reste.
- **Une légende du tableau de suivi.** Cinq états, cinq formes, et jusqu'ici aucun endroit où lire ce qu'elles disent.
- La première fois qu'une validation en retard déplace des échéances, le message explique ce qui vient de se passer au lieu de le constater.
- Supprimer un programme s'annule, comme tout ce qui ne se confirme pas.
- Le champ du titre d'un sujet donne trois exemples : personne ne sait, à froid, s'il faut y écrire « Mathématiques » ou « les dérivées ».
- Un lien partagé affiche un aperçu : titre, description et la frise en image.
- Les licences des composants tiers voyagent avec l'application : `THIRD-PARTY.txt`, régénéré à chaque build, accessible depuis les réglages et hors ligne.

### Changé

- **La police de titres passe en pile système.** Le design system décrivait « Instrument Sans, auto-hébergée dans `/public/fonts` » ; ce dossier n'a jamais existé et aucune règle ne chargeait la police. Tous les titres tombaient déjà sur la pile système : la spécification dit maintenant ce qui se passe. Réintroduire une police reste possible, en un seul endroit.
- Le dépôt porte enfin ce qu'un projet ouvert doit porter : licence déclarée dans `package.json`, guide de contribution, politique de sécurité, code de conduite, gabarits d'issue et de pull request, et ce journal.

## 1.0.0

Première version. Trois vues — Aujourd'hui, Calendrier, Suivi —, trois programmes de répétition espacée et des programmes personnalisés, des catégories qui se gèrent, la frise, le recalage après retard, l'export et l'import JSON, et une application installable qui fonctionne hors ligne.
