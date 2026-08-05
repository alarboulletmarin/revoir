# Journal des versions

Écrit à la main, dans la voix du projet : ce que chaque version change pour la personne qui utilise l'application, pas quels fichiers ont bougé. Les dates sont celles de la publication.

## Non publié

### Corrigé

- **Une coche ne se perd plus en route.** Valider une révision puis refermer aussitôt la feuille du calendrier, ou ouvrir la fiche dans la foulée, annulait l'enregistrement en silence : l'écran avait montré la coche, rien n'était écrit. Les deux cents millisecondes qui précèdent le retrait de la ligne appartiennent à l'animation, pas à la décision.
- **Le jour tourne à minuit.** L'application est installable : elle passe la nuit ouverte sur un téléphone, et annonçait au réveil la date de la veille — mauvaise liste du jour, retard inventé. Elle se relit désormais à minuit, au retour au premier plan et à la reprise de la fenêtre.
- **« Tout voir » montre tout.** La liste des prochaines révisions s'arrêtait à cent sans le dire.
- Une révision à venir se valide depuis le panneau du tableau de suivi, comme elle se validait déjà depuis le calendrier, la liste des prochaines révisions et la fiche d'un sujet.
- Un filtre du suivi dont la catégorie n'a plus aucun sujet retombe sur « Toutes », au lieu de laisser la page vide et le champ sur une valeur qui n'existe plus. Et filtrer une catégorie la déplie.
- Une échéance tombée le même jour qu'une autre est annoncée comme la suivante, au lieu d'être passée sous silence.
- Au plafond de vingt échéances, une graduation de plus est refusée et dite, plutôt que d'effacer la plus lointaine sans un mot.

### Ajouté

- **Reporter une révision.** Une échéance recule d'un jour, et elle seule : un report ne dit rien du rythme réel, il dit « pas aujourd'hui ». En retard, il vise demain plutôt que le lendemain d'une date passée. Depuis la fiche d'un sujet et depuis le panneau d'une cellule du suivi, sans confirmation, avec un message qui dit la nouvelle date et propose « Annuler ».
- **Dupliquer un sujet.** Le formulaire de création s'ouvre avec la catégorie, le programme et le titre du sujet d'origine, la date au jour. Rien n'est écrit tant qu'il n'est pas soumis.
- **Un écran de premier usage qui explique le projet** : la question, la frise en grand, trois temps, ce que Revoir ne fait pas. C'est aussi la page de présentation — même écran, même adresse.
- **Une page d'aide**, ouverte par un « ? » au bout de l'en-tête : le vocabulaire, les programmes, le retard et le recalage, la lecture du tableau de suivi, et ce qu'il advient de vos données. Hors ligne comme le reste.
- **Une légende du tableau de suivi.** Cinq états, cinq formes, et jusqu'ici aucun endroit où lire ce qu'elles disent.
- La première fois qu'une validation en retard déplace des échéances, le message explique ce qui vient de se passer au lieu de le constater.
- Supprimer un programme s'annule, comme tout ce qui ne se confirme pas.
- Le champ du titre d'un sujet donne trois exemples : personne ne sait, à froid, s'il faut y écrire « Mathématiques » ou « les dérivées ».
- Un lien partagé affiche un aperçu — titre, description et la frise en image.
- Les licences des composants tiers voyagent avec l'application : `THIRD-PARTY.txt`, régénéré à chaque build, accessible depuis les réglages et hors ligne.

### Changé

- **La police de titres passe en pile système.** Le design system décrivait « Instrument Sans, auto-hébergée dans `/public/fonts` » ; ce dossier n'a jamais existé et aucune règle ne chargeait la police. Tous les titres tombaient déjà sur la pile système : la spécification dit maintenant ce qui se passe. Réintroduire une police reste possible, en un seul endroit.
- Le dépôt porte enfin ce qu'un projet ouvert doit porter : licence déclarée dans `package.json`, guide de contribution, politique de sécurité, code de conduite, gabarits d'issue et de pull request, et ce journal.

## 1.0.0

Première version. Trois vues — Aujourd'hui, Calendrier, Suivi —, trois programmes de répétition espacée et des programmes personnalisés, des catégories qui se gèrent, la frise, le recalage après retard, l'export et l'import JSON, et une application installable qui fonctionne hors ligne.
