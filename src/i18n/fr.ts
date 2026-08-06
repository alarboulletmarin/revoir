// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le français — dictionnaire de référence.
 *
 * C'est lui qui **définit la forme** : `Dictionnaire` vaut `typeof fr`, et
 * toute autre langue doit s'y conformer au champ près. Ajouter une entrée ici
 * fait échouer la compilation des autres tant qu'elles ne l'ont pas.
 *
 * Les pluriels et les accords sont des **fonctions**, pas des gabarits à
 * trous : « 3 révisions effectuées » et « 3 reviews done » ne s'accordent pas
 * aux mêmes endroits, et une bibliothèque de pluralisation ne dirait rien de
 * plus pour deux langues qui comptent toutes les deux « un, puis les autres ».
 */

/** Marque du pluriel français : rien au singulier, « s » au-delà. */
const s = (nombre: number) => (nombre > 1 ? 's' : '')

export const fr = {
  /** Le nom de la langue, écrit dans cette langue. */
  nom: 'Français',
  /** Étiquette BCP 47 : `<html lang>`, `localeCompare`, `og:locale`. */
  etiquette: 'fr',

  dates: {
    /** « 14 mars 2026 » */
    long: 'd MMMM yyyy',
    /** « sam. 14 mars » */
    court: 'EEE d MMM',
    /** « 14/03 » */
    compact: 'dd/MM',
    /** « mars 2026 » */
    mois: 'MMMM yyyy',
    /** « 8 août » — l'échéance dans l'année en cours. */
    echeance: 'd MMMM',
    /** La même, quand elle change d'année. */
    echeanceAnnee: 'd MMMM yyyy',
    /** Semaine française : lundi en premier. */
    debutSemaine: 1,
    relatif: {
      aujourdhui: "aujourd'hui",
      demain: 'demain',
      hier: 'hier',
      passe: (jours: number) => `il y a ${jours} jours`,
      futur: (jours: number) => `dans ${jours} jours`,
    },
  },

  commun: {
    chargement: 'Chargement…',
    annuler: 'Annuler',
    fermer: 'Fermer',
    supprimer: 'Supprimer',
    modifier: 'Modifier',
    enregistrer: 'Enregistrer',
    retour: 'Retour',
    sansCategorie: 'Sans catégorie',
    sansNom: 'Sans nom',
    /** « 3 révisions » — le compte nu, réutilisé partout. */
    revisions: (nombre: number) => `${nombre} révision${s(nombre)}`,
    sujets: (nombre: number) => `${nombre} sujet${s(nombre)}`,
    aucuneRevision: 'aucune révision',
  },

  coque: {
    /** Lien d'évitement, premier élément atteignable au clavier. */
    sautContenu: 'Aller au contenu',
    aide: 'Aide',
    reglages: 'Réglages',
    ajouterSujet: 'Ajouter un sujet',
    navigationPrincipale: 'Navigation principale',
    /** Le titre du document : « Calendrier · Revoir ». */
    titreDocument: (page: string) => `${page} · Revoir`,
  },

  nav: {
    aujourdhui: "Aujourd'hui",
    calendrier: 'Calendrier',
    suivi: 'Suivi',
  },

  programmes: {
    /** « J+7 » — le décalage, écrit comme le lit l'utilisateur. */
    decalage: (jours: number) => `J+${jours}`,
    integres: {
      simple: 'Simple',
      pousse: 'Poussé',
      ultime: 'Ultime',
    },
    /** L'écart dans son unité naturelle, sur une graduation. */
    ecartJours: (jours: number) => `${jours} j`,
    ecartSemaines: (semaines: number) =>
      semaines === 1 ? '1 sem.' : `${semaines} sem.`,
    ecartMois: (mois: number) => `${mois} mois`,
    ecartAnnees: (annees: number) => (annees === 1 ? '1 an' : `${annees} ans`),
    /** Le même écart, en entier, pour les lecteurs d'écran. */
    ecartComplet: (jours: number) => `${jours} jour${s(jours)} après le départ`,
    /** La portée d'un rythme, dérivée de son dernier décalage. */
    porteeVide: 'sans échéance',
    porteeJours: (jours: number) => `sur ${jours} jour${s(jours)}`,
    porteeMois: (mois: number) =>
      mois <= 1
        ? 'sur un mois'
        : `sur ${['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze'][mois]} mois`,
    porteeAnnees: (annees: number) =>
      annees <= 1 ? 'sur une année' : `sur ${annees} années`,
  },

  teintes: {
    ardoise: 'Ardoise',
    prune: 'Prune',
    olive: 'Olive',
    terre: 'Terre',
    bleu: 'Bleu',
    teal: 'Sarcelle',
    mauve: 'Mauve',
    ocre: 'Ocre',
    personnalisee: 'Couleur personnalisée',
    legende: 'Couleur',
  },

  pratique: {
    legende: 'Pratique',
    legendeSujet: 'Où en est la pratique de ce sujet',
    todo: 'À faire',
    in_progress: 'En cours',
    done: 'Terminée',
  },

  categoriesProposees: {
    etudes: 'Études',
    travail: 'Travail',
    langues: 'Langues',
    developpement: 'Développement',
    lecture: 'Lecture',
    personnel: 'Personnel',
  },

  dashboard: {
    titre: "Aujourd'hui",
    aFaire: (restantes: number) =>
      `${restantes} révision${s(restantes)} aujourd’hui`,
    tempsTermine: 'Tout est terminé pour aujourd’hui',
    rienDePrevu: 'Aucune révision prévue aujourd’hui',
    plusRien: 'Plus rien à revoir : le programme reprendra à la prochaine échéance.',
    aVenirIci: 'Les prochaines révisions apparaîtront ici.',
    prochaine: (date: string, sujets: number) =>
      `Prochaine révision : ${date}, ${sujets} sujet${s(sujets)}.`,
    enRetard: 'en retard',
    restantes: (nombre: number) => `révision${s(nombre)} restante${s(nombre)}`,
    charge: (jours: number) => `Charge sur ${jours} jours`,
    ceMois: 'ce mois-ci',
    toutVoirCompte: (nombre: number) => `Tout voir (${nombre})`,
    toutVoir: 'Tout voir',
    prochainesEcheances: 'Prochaines échéances',
  },

  charge: {
    aucune: (jours: number) => `Aucune révision dans les ${jours} prochains jours.`,
    intitule: (jours: number) => `Charge sur les ${jours} prochains jours`,
    aujourdhuiCourt: 'Auj.',
    jour: (quand: string, nombre: number) =>
      `${quand}, ${nombre === 0 ? 'aucune révision' : `${nombre} révision${s(nombre)}`}`,
  },

  accueil: {
    titre: "Qu'est-ce que je dois revoir aujourd'hui ?",
    intro:
      'Revoir planifie vos révisions par répétition espacée et répond à cette seule question. Aucun compte, aucun serveur : tout reste sur cet appareil.',
    legendeFrise: (programme: string, portee: string) =>
      `Le programme « ${programme} », de la date de départ au dernier rappel : ${portee}.`,
    temps: [
      {
        titre: 'Vous notez ce que vous voulez revoir',
        detail:
          'Un titre, une catégorie, une date de départ, un programme. Ni cours, ni fiches, ni documents : Revoir ne stocke jamais ce que vous apprenez.',
      },
      {
        titre: 'Revoir calcule les dates',
        detail:
          'Les écarts grandissent — un jour, trois jours, une semaine, deux, un mois. C’est la répétition espacée : on revoit juste avant d’oublier.',
      },
      {
        titre: 'Vous cochez, l’application suit',
        detail:
          'En un tap, depuis n’importe quelle liste. Une révision validée en retard recale les suivantes en gardant leurs écarts, plutôt que de les faire tomber le même jour.',
      },
    ],
    neFaitPas: 'Ce que Revoir ne fait pas',
    neFaitPasDetail:
      'Pas de compte, pas de serveur, pas de synchronisation, pas de publicité, pas de mesure d’audience. Pas de notification, pas de série à tenir, pas de score : le retard est une information, pas un jugement.',
    donneesLocales:
      'Vos données vivent dans le stockage de ce navigateur, et vous pouvez les exporter dans un fichier à tout moment.',
    creerSujet: 'Créer un sujet',
    commentCaMarche: 'Comment ça marche',
    categoriesLivrees: (noms: string) =>
      `Six catégories sont déjà là — ${noms}. Renommez-les, recolorez-les ou supprimez-les depuis les réglages.`,
  },

  calendrier: {
    titre: 'Calendrier',
    moisPrecedent: 'Mois précédent',
    moisSuivant: 'Mois suivant',
    revenirAujourdhui: "Revenir à aujourd'hui",
    aucuneCeJour: 'Aucune révision prévue ce jour-là.',
    toutesFaites: 'toutes faites',
    exporter: 'Exporter le calendrier (.ics)',
  },

  listes: {
    aujourdhui: {
      titre: "Aujourd'hui",
      vide: 'Rien à revoir aujourd’hui.',
    },
    retard: {
      titre: 'En retard',
      vide: 'Aucune révision en retard.',
    },
    prochaines: {
      titre: 'Prochaines révisions',
      vide: 'Aucune révision planifiée',
    },
  },

  suivi: {
    titre: 'Suivi',
    categorie: 'Catégorie',
    toutesCategories: 'Toutes les catégories',
    colonnes: 'Colonnes',
    compact: 'Compact',
    intervalles: 'Intervalles',
    legendeTitre: 'Que veulent dire les formes ?',
    videTitre: 'Rien à suivre pour l’instant.',
    videDetail:
      'Le suivi montre, catégorie par catégorie, où en est chaque sujet dans son programme.',
    creerSujet: 'Créer un sujet',
    colonneSujet: 'Sujet',
    colonnePratique: 'Pratique',
    /** L'en-tête d'une colonne en mode compact : « R3 ». */
    rang: (position: number) => `R${position}`,
    rangComplet: (position: number) => `Révision ${position}`,
    ecartComplet: (ecart: string) => `Révision à ${ecart}`,
    cadre: (nom: string) => `Tableau de suivi — ${nom}`,
    caption: (nom: string) =>
      `Suivi de ${nom} : un sujet par ligne, une étape de révision par colonne.`,
    astuce: 'Faites glisser pour voir la suite.',
    horsProgrammeCase: (titre: string, colonne: string) =>
      `${titre}, ${colonne} : hors programme.`,
    caseComplete: (titre: string, colonne: string, etat: string, date: string) =>
      `${titre}, ${colonne}, ${etat} ${date}.`,
    pratiqueCase: (titre: string, statut: string) =>
      `Pratique de ${titre} : ${statut}. Changer.`,
    resume: (sujets: number, enRetard: number, progression: number) => {
      const parties = [`${sujets} sujet${s(sujets)}`]
      if (enRetard > 0) {
        parties.push(`${enRetard} révision${s(enRetard)} en retard`)
      }
      parties.push(`${progression} % terminé`)
      return parties.join(' · ')
    },
    etats: {
      faite: 'Effectuée',
      aujourdhui: 'À effectuer aujourd’hui',
      retard: 'En retard',
      avenir: 'À venir',
      'hors-programme': 'Hors programme',
    },
    /** Les mêmes états, cousus à une date dans le texte caché d'une case. */
    etatsDate: {
      faite: 'effectuée, prévue le',
      aujourdhui: 'à effectuer aujourd’hui,',
      retard: 'en retard depuis le',
      avenir: 'à venir le',
      'hors-programme': 'hors programme',
    },
    panneauPratique: (titre: string) => `Pratique · ${titre}`,
    panneauRevision: (decalage: string, titre: string) =>
      `Révision ${decalage} · ${titre}`,
    situation: (rang: number, total: number) => `Révision ${rang} sur ${total}`,
    effectuee: (situation: string) => `${situation} · effectuée`,
    effectueeLe: (situation: string, date: string) =>
      `${situation} · effectuée le ${date}`,
    prevueRetard: (situation: string, date: string) =>
      `${situation} · prévue le ${date}, en retard`,
    prevueAujourdhui: (situation: string) =>
      `${situation} · à effectuer aujourd’hui`,
    prevue: (situation: string, date: string) => `${situation} · prévue le ${date}`,
    annulerValidation: 'Annuler la validation',
    marquerEffectuee: 'Marquer comme effectuée',
    voirLeSujet: 'Voir le sujet',
  },

  ligne: {
    decocher: (titre: string, decalage: string) =>
      `Décocher : ${titre}, révision ${decalage}`,
    valider: (titre: string, decalage: string) =>
      `Marquer comme revu : ${titre}, révision ${decalage}`,
    progression: (rang: number, total: number) => `Révision ${rang} sur ${total}`,
    prochaine: 'Prochaine : ',
  },

  sujet: {
    titreDefaut: 'Sujet',
    introuvable: 'Ce sujet n’existe pas ou plus.',
    retourTableau: 'Retour au tableau de bord',
    archive: 'Archivé',
    creeLe: (date: string) => `Créé le ${date}`,
    programme: 'Programme',
    progression: (pourcent: number) => `Progression : ${pourcent} %`,
    compte: (faites: number, restantes: number) =>
      `${faites} révision${s(faites)} effectuée${s(faites)} · ${restantes} restante${s(restantes)}`,
    pratiqueDetail:
      'Des exercices pour un cours, la répétition pour un instrument, une série de questions pour le code de la route. La pratique est un état, pas une date : elle n’a donc pas d’échéance.',
    echeances: 'Échéances',
    depart: (date: string) => `Départ le ${date}`,
    basculer: (faite: boolean, decalage: string) =>
      `${faite ? 'Décocher' : 'Marquer comme revu'} la révision ${decalage}`,
    effectuee: 'effectuée',
    reporter: 'Reporter',
    reporterCible: (libelle: string, decalage: string) =>
      `${libelle} : révision ${decalage}`,
    actions: 'Actions',
    dupliquer: 'Dupliquer',
    archiver: 'Archiver',
    desarchiver: 'Désarchiver',
    exporterIcs: 'Exporter (.ics)',
    exporterIcsIntitule: (titre: string) =>
      `Exporter les échéances de « ${titre} » au format calendrier`,
    noteArchive:
      'Un sujet archivé sort du tableau de bord, du calendrier et du suivi. Il reste dans l’export.',
    confirmerSuppression: 'Supprimer ce sujet ?',
    detailSuppression: (titre: string, revisions: number) =>
      `« ${titre} » et ses ${revisions} révisions seront définitivement supprimés.`,
    toastArchive: 'Sujet archivé',
    toastDesarchive: 'Sujet désarchivé',
  },

  sujetForm: {
    titreCreation: 'Nouveau sujet',
    titreEdition: 'Modifier le sujet',
    duplique: (depuis: string) =>
      `Dupliqué depuis « ${depuis} ». Le titre, la catégorie et le programme sont repris ; la date de départ est celle d’aujourd’hui.`,
    champTitre: 'Titre',
    aideTitre:
      'Ce que vous voulez revoir. Par exemple : les dérivées, les accords majeurs, le vocabulaire du voyage.',
    erreurTitre: 'Le titre est obligatoire.',
    champDate: 'Date de départ',
    intituleDate: 'Choisir la date de départ',
    erreurDate: 'La date de départ est obligatoire.',
    champProgramme: 'Programme',
    resumeProgramme: (revisions: number, portee: string) =>
      `${revisions} révisions · ${portee}`,
    apercuTitre: 'Dates générées',
    apercuIntitule: 'Aperçu du programme',
    rienDePrevu: 'rien de prévu',
    dejaPrevu: (nombre: number) => `déjà ${nombre} révision${s(nombre)}`,
    noteEdition:
      'Les révisions déjà effectuées restent cochées si leur décalage existe toujours dans le programme choisi.',
    creer: 'Créer le sujet',
    modifier: 'Modifier le sujet',
  },

  champDate: {
    choisir: 'Choisir une date',
  },

  categories: {
    titre: 'Catégories',
    intro:
      'Une catégorie regroupe des sujets. Sa couleur lui appartient : la changer ici la change partout où la catégorie apparaît.',
    aucune: 'Aucune catégorie pour le moment.',
    aucunSujet: 'Aucun sujet',
    creer: 'Créer une catégorie',
    ajouterProposees: 'Ajouter les catégories proposées',
    ajoutees: (nombre: number) =>
      `${nombre} catégorie${s(nombre)} ajoutée${s(nombre)}.`,
    supprimee: (nom: string) => `Catégorie « ${nom} » supprimée.`,
    confirmerSuppression: (nom: string) => `Supprimer « ${nom} » ?`,
    detailAucunSujet: 'Cette catégorie ne porte aucun sujet.',
    detailSujets: (portes: number) =>
      portes === 1
        ? 'Son sujet passera sans catégorie. Il ne sera pas supprimé.'
        : `Ses ${portes} sujets passeront sans catégorie. Ils ne seront pas supprimés.`,
    /** Le label du champ qui désigne une catégorie, au singulier. */
    champCategorie: 'Catégorie',
    champNom: 'Nom',
    apercu: 'Aperçu',
    titreCreation: 'Nouvelle catégorie',
    titreEdition: 'Modifier la catégorie',
    erreurNom: 'Le nom est obligatoire.',
    erreurHomonyme: 'Une catégorie porte déjà ce nom.',
    introuvable: 'Cette catégorie n’existe pas ou plus.',
    creerBouton: 'Créer la catégorie',
    modifierBouton: 'Modifier la catégorie',
    facultatif: 'Facultatif.',
    nouvelle: 'Nouvelle catégorie',
  },

  programmeForm: {
    titreCreation: 'Nouveau programme',
    titreEdition: 'Modifier le programme',
    champNom: 'Nom du programme',
    aideNom: 'Par exemple : Examen blanc, Vocabulaire, Permis.',
    erreurNom: 'Le nom est obligatoire.',
    erreurHomonyme: 'Un programme porte déjà ce nom.',
    introuvable: 'Ce programme n’existe pas ou plus.',
    rythme: 'Rythme',
    rythmeIntitule: 'Rythme du programme',
    modeles: 'Partir d’un rythme connu',
    question: 'Quand la révision revient-elle ?',
    aideQuestion:
      'Touchez les échéances à garder. Elles se comptent à partir du jour de départ.',
    plein: (maximum: number) =>
      `${maximum} échéances au plus : retirez-en une pour en ajouter une autre.`,
    erreurRythme: 'Choisissez au moins une échéance.',
    resultat: 'Le rythme obtenu',
    apercuIntitule: 'Aperçu du rythme',
    resume: (revisions: number, portee: string) =>
      `${revisions} révision${s(revisions)} · ${portee}`,
    detailFige: (revisions: number, portee: string, jours: string) =>
      `${revisions} révision${s(revisions)} · ${portee} · ${jours}`,
    fige: (usages: number) =>
      usages > 1
        ? `${usages} sujets suivent ce programme : leurs révisions sont déjà planifiées, le rythme ne peut plus changer.`
        : 'Un sujet suit ce programme : ses révisions sont déjà planifiées, le rythme ne peut plus changer.',
    figeSuite: 'Le nom, lui, se modifie librement.',
    creer: 'Créer le programme',
  },

  reglages: {
    titre: 'Réglages',
    apparence: {
      titre: 'Apparence',
      intro:
        'Le thème suit votre système par défaut. Ce choix vaut pour cet appareil : il n’appartient pas aux données et ne s’exporte pas.',
      legende: 'Thème',
      systeme: 'Système',
      clair: 'Clair',
      sombre: 'Sombre',
    },
    langue: {
      titre: 'Langue',
      intro:
        'La langue de l’interface. Vos sujets, vos catégories et vos programmes gardent les mots que vous avez écrits.',
      legende: 'Langue de l’interface',
    },
    sauvegarde: {
      titre: 'Sauvegarde',
      intro:
        'Vos données restent sur cet appareil. L’export produit un fichier JSON que vous pouvez conserver puis réimporter, ici ou sur un autre appareil. Les sujets archivés y figurent.',
      exporter: 'Exporter les données',
      importer: 'Importer un fichier',
      exportes: (nombre: number) => `${nombre} sujet${s(nombre)} exporté${s(nombre)}.`,
      importes: (nombre: number) => `${nombre} sujet${s(nombre)} importé${s(nombre)}.`,
      illisible: 'Ce fichier n’a pas pu être lu.',
      confirmerTitre: 'Remplacer les données actuelles ?',
      confirmerMessage: (entrants: number, actuels: number) =>
        `L’import de ${entrants} sujet${s(entrants)} remplacera vos ${actuels} sujet${s(actuels)} actuel${s(actuels)}.`,
      confirmerAction: 'Importer',
    },
    calendrier: {
      titre: 'Calendrier',
      intro:
        'L’export .ics produit un fichier d’agenda : une journée entière par échéance, à importer dans Google Agenda, Apple Calendrier, Outlook ou Thunderbird. C’est une copie, pas un abonnement — réexportez après avoir ajouté des sujets.',
      note: 'Seules les échéances qui restent à faire y figurent ; les sujets archivés en sont exclus.',
      exporter: 'Exporter le calendrier (.ics)',
    },
    categories: {
      titre: 'Catégories',
      aucune: 'Aucune catégorie pour le moment.',
      gerer: 'Gérer les catégories',
    },
    programmes: {
      titre: 'Programmes',
      intro:
        'Les trois programmes intégrés — Simple, Poussé, Ultime — couvrent la plupart des besoins. Vous pouvez composer les vôtres.',
      compte: (revisions: number, portee: string) =>
        `${revisions} révision${s(revisions)} · ${portee}`,
      intitule: (nom: string) => `Programme ${nom}`,
      renommer: 'Renommer',
      modifier: 'Modifier',
      creer: 'Créer un programme',
      supprime: 'Programme supprimé',
      usages: (usages: number) =>
        usages > 1
          ? `Suivi par ${usages} sujets : leurs révisions sont déjà planifiées, le rythme ne peut plus changer.`
          : 'Suivi par un sujet : ses révisions sont déjà planifiées, le rythme ne peut plus changer.',
    },
    archives: {
      titre: 'Sujets archivés',
      aucun: 'Aucun sujet archivé.',
      desarchiver: 'Désarchiver',
    },
    apropos: {
      titre: 'À propos',
      intro:
        'Revoir planifie des révisions espacées sans jamais stocker ce que vous apprenez. Aucun compte, aucun serveur, aucune mesure d’audience : tout est enregistré dans le stockage local de votre navigateur.',
      effacement:
        'Effacer les données du site depuis votre navigateur supprime donc toutes vos révisions. Pensez à exporter régulièrement.',
      licence: 'Logiciel libre sous licence AGPL-3.0.',
      source: 'Code source',
      tiers: 'Licences des composants tiers',
      commentCaMarche: 'Comment ça marche',
    },
  },

  aide: {
    titre: 'Comment ça marche',
    intro:
      'Revoir répond à une seule question : qu’est-ce que je dois revoir aujourd’hui ?',
    vocabulaire: {
      titre: 'Le vocabulaire',
      intro:
        'Trois mots, choisis pour ne pas enfermer l’application dans le contexte scolaire.',
      categorie: 'Catégorie',
      categorieDetail:
        'Ce qui regroupe des sujets : Mathématiques, Anglais, React, Code de la route, Piano. Elle existe avant ses sujets, se renomme, se recolore, et vit très bien sans aucun sujet.',
      sujet: 'Sujet',
      sujetDetail:
        'Ce que vous voulez revoir : les dérivées, les hooks React, le vocabulaire du voyage, les accords majeurs. Revoir en retient le titre, jamais le contenu.',
      revisions: 'Révisions',
      revisionsDetail:
        'Les échéances que le programme calcule à partir de la date de départ. Vous les cochez, l’application s’occupe des suivantes.',
      pratique: 'Pratique',
      pratiqueDetail:
        'Le pendant des révisions : pour un cours ce sont des exercices, pour le piano la répétition, pour une langue une conversation, pour le code de la route une série de questions. C’est un état — à faire, en cours, terminée — et non une date : sans échéance, elle serait toujours en retard dans les listes du jour. Elle vit sur la fiche d’un sujet et dans la dernière colonne du tableau de suivi.',
    },
    programmes: {
      titre: 'Les programmes',
      intro:
        'Un programme est un rythme : la liste des écarts, en jours, à partir de la date de départ. Les écarts grandissent — c’est tout le principe de la répétition espacée, où l’on revoit juste avant d’oublier.',
      note: 'Vous pouvez composer les vôtres depuis les réglages : un rythme se construit en touchant des graduations, personne n’a à taper « 1 3 7 14 30 ». Un programme déjà suivi par un sujet garde son rythme — les révisions de ce sujet sont écrites — mais se renomme toujours.',
    },
    retard: {
      titre: 'Le retard, le recalage et le report',
      intro:
        'Le retard n’accuse pas : c’est une information, pas un jugement. Aucune série à tenir, aucun score.',
      recalageFort: 'Valider une révision en retard recale les suivantes',
      recalage:
        ' sur la date réelle de validation, en conservant les écarts du programme : une J+7 validée avec trois jours de retard place la J+14 sept jours après la validation, pas quatre. Sans ce recalage, rattraper une semaine de retard ferait tomber toutes les échéances suivantes le même jour.',
      reportFort: 'Reporter, à l’inverse, ne déplace que l’échéance visée.',
      report:
        ' Un report ne dit rien du rythme réel — il dit « pas aujourd’hui ». Le programme n’a pas changé, les échéances suivantes non plus.',
      confirmation:
        'Cocher une révision ne demande aucune confirmation : l’affichage change tout de suite et un message propose « Annuler » pendant cinq secondes. La suppression est la seule action qui demande une confirmation.',
    },
    tableau: {
      titre: 'Lire le tableau de suivi',
      intro:
        'Un tableau par catégorie : les sujets en lignes, les étapes de révision en colonnes, la pratique en dernière colonne. Cinq états, cinq formes — elles se distinguent aussi en niveaux de gris, la couleur ne porte jamais l’information seule.',
      modesAvant: 'Deux façons de nommer les colonnes. ',
      modesIntervalles: 'Intervalles',
      modesMilieu:
        ' les nomme par leur écart — J+1, J+3, J+7 — à partir de l’union des écarts de la catégorie ; une étape absente d’un programme s’y lit « hors programme ». ',
      modesCompact: 'Compact',
      modesApres:
        ' les numérote — R1, R2, R3 — et tient sur un téléphone. Toucher une cellule ouvre un panneau qui permet de valider, de reporter ou d’ouvrir le sujet.',
    },
    navigation: {
      titre: 'Se déplacer dans l’application',
      intro:
        'Trois vues en bas de l’écran — Aujourd’hui, Calendrier, Suivi — et, en haut, le logotype, l’aide et les réglages. Partout ailleurs, le haut de l’écran porte un retour : il ramène d’où l’on vient, y compris quand l’application est installée et n’a pas de bouton système.',
    },
    donnees: {
      titre: 'Vos données',
      intro:
        'Il n’y a pas de serveur : rien ne quitte votre appareil. Aucun compte, aucune synchronisation, aucune mesure d’audience. Tout est enregistré dans le stockage local de votre navigateur.',
      export:
        'C’est aussi la contrepartie : effacer les données du site depuis votre navigateur supprime toutes vos révisions, et personne ne peut vous les rendre. L’export produit un fichier que vous conservez où vous voulez et réimportez ici ou sur un autre appareil — pensez-y de temps en temps.',
      calendrier:
        'L’export .ics est une seconde sortie, pour un usage différent : il verse vos échéances dans un agenda, sans rien y renvoyer ensuite. C’est une copie figée, pas une synchronisation — et ce n’est pas une sauvegarde : seul le fichier JSON se réimporte.',
      reglages: 'Ouvrir les réglages',
    },
  },

  ics: {
    /** Nom du calendrier, tel que l'agenda l'affichera. */
    nomCalendrier: 'Revoir — révisions',
    nomCalendrierSujet: (titre: string) => `Revoir — ${titre}`,
    /** L'intitulé d'un événement : « Revoir : les dérivées ». */
    evenement: (titre: string) => `Revoir : ${titre}`,
    description: (rang: number, total: number, programme: string) =>
      `Révision ${rang} sur ${total} · programme ${programme}`,
    /** Fragment ajouté quand le sujet porte une catégorie. */
    descriptionCategorie: (categorie: string) => `Catégorie : ${categorie}`,
    /* Les retours de l'export, affichés par les réglages comme par une fiche. */
    exportees: (nombre: number) =>
      `${nombre} échéance${s(nombre)} exportée${s(nombre)}.`,
    aucune: 'Aucune échéance à exporter : tout est fait.',
    aucuneSujet: 'Aucune échéance à exporter pour ce sujet.',
  },

  toast: {
    revisionEnregistree: 'Révision enregistrée',
    recalageCourt: 'Prochaines dates ajustées',
    recalageLong: 'Les suivantes gardent leurs écarts, à partir d’aujourd’hui',
    revisionReportee: 'Révision reportée',
    reporteeAu: (date: string) => `Au ${date}`,
    reporterDemain: 'Reporter à demain',
    reporterUnJour: 'Reporter d’un jour',
    miseAJour: 'Une nouvelle version est disponible.',
    mettreAJour: 'Mettre à jour',
  },

  erreurs: {
    lecture:
      'Impossible de lire les données locales. Elles ne sont pas perdues : réessayez, et exportez-les depuis les réglages dès que possible.',
    ecriture: 'L’enregistrement local a échoué.',
    suppression: 'La suppression locale a échoué.',
    import: 'L’import n’a pas pu être enregistré localement.',
    introuvable: 'Page introuvable',
    adresseInconnue: 'Cette adresse ne correspond à aucune page de Revoir.',
  },

  /**
   * Les messages d'un fichier de sauvegarde refusé. Ils nomment ce qui cloche
   * et où : un import qui échoue sans dire pourquoi est une impasse.
   */
  backup: {
    jsonInvalide: 'Ce fichier n’est pas un JSON valide.',
    pasUneSauvegarde: 'Le fichier ne contient pas une sauvegarde Revoir.',
    autreApplication: 'Le fichier ne provient pas de Revoir.',
    aucuneListe: 'Le fichier ne contient aucune liste de sujets.',
    programmesDoublons: 'Le fichier contient des programmes en double.',
    categoriesDoublons: 'Le fichier contient des catégories en double.',
    sujetsDoublons: 'Le fichier contient des sujets en double.',
    revisionsDoublons: 'Le fichier contient des révisions en double.',
    elementsDoublons: 'Le fichier contient des éléments en double.',
    programmeInvalide: (rang: number) => `Programme ${rang} invalide.`,
    programmeSansId: (rang: number) => `Programme ${rang} : identifiant manquant.`,
    programmeSansNom: (rang: number) => `Programme ${rang} : nom manquant.`,
    rythmeManquant: (nom: string) => `« ${nom} » : rythme manquant.`,
    rythmeInvalide: (nom: string) => `« ${nom} » : rythme invalide.`,
    categorieInvalide: (rang: number) => `Catégorie ${rang} invalide.`,
    categorieSansId: (rang: number) => `Catégorie ${rang} : identifiant manquant.`,
    categorieSansNom: (rang: number) => `Catégorie ${rang} : nom manquant.`,
    sujetInvalide: (rang: number) => `Sujet ${rang} invalide.`,
    sujetSansId: (rang: number) => `Sujet ${rang} : identifiant manquant.`,
    sujetSansTitre: (rang: number) => `Sujet ${rang} : titre manquant.`,
    dateDepartInvalide: (nom: string) => `« ${nom} » : date de départ invalide.`,
    programmeInconnu: (nom: string) => `« ${nom} » : configuration inconnue.`,
    categorieInconnue: (nom: string) => `« ${nom} » : catégorie inconnue.`,
    revisionInvalide: (rang: number) => `Révision ${rang} invalide.`,
    revisionSansId: (rang: number) => `Révision ${rang} : identifiant manquant.`,
    revisionSujetInconnu: (rang: number) => `Révision ${rang} : sujet inconnu.`,
    revisionRang: (rang: number) => `Révision ${rang} : rang invalide.`,
    revisionDecalage: (rang: number) => `Révision ${rang} : décalage invalide.`,
    revisionEcheance: (rang: number) => `Révision ${rang} : échéance invalide.`,
    revisionLegacy: (rang: number, nom: string) =>
      `Révision ${rang} invalide dans « ${nom} ».`,
    decalageLegacy: (nom: string) => `Décalage invalide dans « ${nom} ».`,
    dateLegacy: (nom: string) => `Date de révision invalide dans « ${nom} ».`,
    elementInvalide: (rang: number) => `Élément ${rang} invalide.`,
    elementSansId: (rang: number) => `Élément ${rang} : identifiant manquant.`,
    elementSansTitre: (rang: number) => `Élément ${rang} : titre manquant.`,
    revisionsManquantes: (nom: string) => `« ${nom} » : liste de révisions manquante.`,
  },
}
