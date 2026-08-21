// SPDX-License-Identifier: AGPL-3.0-only

/**
 * L'anglais.
 *
 * Typé contre le français : un champ oublié, renommé ou d'une autre arité fait
 * échouer la compilation. C'est la seule garantie qui tienne — une langue se
 * complète au fil des écrans, et rien d'autre ne signalerait un trou.
 *
 * Le pluriel n'est pas le même qu'en français : l'anglais met la marque dès
 * zéro (« 0 reviews »), le français ne la met qu'à partir de deux.
 */
import type { Dictionnaire } from '.'

const s = (nombre: number) => (nombre === 1 ? '' : 's')

/**
 * The number spelled out, up to nine — the screen title is a sentence, and a
 * sentence does not open on a digit. Past nine the word takes longer to read
 * than the number it spells, and the digit takes over.
 */
const NUMBERS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
]
const lettres = (nombre: number) => NUMBERS[nombre] ?? String(nombre)

const capitale = (mot: string) => mot.charAt(0).toUpperCase() + mot.slice(1)

/**
 * English ordinals: 1st, 2nd, 3rd, then th — with the teens as the exception
 * they always are (11th, 12th, 13th).
 */
const ordinal = (nombre: number) => {
  const dizaine = nombre % 100
  if (dizaine >= 11 && dizaine <= 13) return `${nombre}th`
  const unite = nombre % 10
  if (unite === 1) return `${nombre}st`
  if (unite === 2) return `${nombre}nd`
  if (unite === 3) return `${nombre}rd`
  return `${nombre}th`
}

export const en: Dictionnaire = {
  nom: 'English',
  etiquette: 'en',

  dates: {
    /** « March 14, 2026 » */
    long: 'MMMM d, yyyy',
    /** « Sat, Mar 14 » */
    court: 'EEE, MMM d',
    /** « Friday, August 21 » */
    jourLong: 'EEEE, MMMM d',
    /** « 03/14 » */
    compact: 'MM/dd',
    /** « March 2026 » */
    mois: 'MMMM yyyy',
    moisSeul: 'MMMM',
    annee: 'yyyy',
    /** « August 8 » */
    echeance: 'MMMM d',
    echeanceAnnee: 'MMMM d, yyyy',
    /** Semaine anglo-saxonne : dimanche en premier. */
    debutSemaine: 0,
    relatif: {
      aujourdhui: 'today',
      demain: 'tomorrow',
      hier: 'yesterday',
      passe: (jours: number) => `${jours} days ago`,
      futur: (jours: number) => `in ${jours} days`,
    },
  },

  commun: {
    chargement: 'Loading…',
    annuler: 'Cancel',
    reessayer: 'Try again',
    fermer: 'Close',
    supprimer: 'Delete',
    modifier: 'Edit',
    enregistrer: 'Save',
    retour: 'Back',
    sansCategorie: 'No category',
    sansNom: 'Untitled',
    revisions: (nombre: number) => `${nombre} review${s(nombre)}`,
    sujets: (nombre: number) => `${nombre} topic${s(nombre)}`,
    aucuneRevision: 'no reviews',
  },

  coque: {
    sautContenu: 'Skip to content',
    aide: 'Help',
    reglages: 'Settings',
    ajouterSujet: 'Add a topic',
    navigationPrincipale: 'Main navigation',
    titreDocument: (page: string) => `${page} · Revoir`,
  },

  nav: {
    aujourdhui: 'Today',
    calendrier: 'Calendar',
    suivi: 'Progress',
  },

  programmes: {
    /** « D+7 » : l'anglais compte en *days*, pas en *jours*. */
    decalage: (jours: number) => `D+${jours}`,
    integres: {
      simple: 'Simple',
      pousse: 'Extended',
      ultime: 'Ultimate',
    },
    ecartJours: (jours: number) => `${jours} d`,
    ecartSemaines: (semaines: number) => (semaines === 1 ? '1 wk' : `${semaines} wks`),
    ecartMois: (mois: number) => (mois === 1 ? '1 mo' : `${mois} mos`),
    ecartAnnees: (annees: number) => (annees === 1 ? '1 yr' : `${annees} yrs`),
    ecartComplet: (jours: number) => `${jours} day${s(jours)} after the start date`,
    porteeVide: 'no due dates',
    porteeJours: (jours: number) => `over ${jours} day${s(jours)}`,
    porteeMois: (mois: number) =>
      mois <= 1
        ? 'over one month'
        : `over ${['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'][mois]} months`,
    porteeAnnees: (annees: number) =>
      annees <= 1 ? 'over one year' : `over ${annees} years`,
  },

  teintes: {
    ardoise: 'Slate',
    prune: 'Plum',
    olive: 'Olive',
    terre: 'Earth',
    bleu: 'Blue',
    teal: 'Teal',
    mauve: 'Mauve',
    ocre: 'Ochre',
    personnalisee: 'Custom colour',
    legende: 'Colour',
  },

  pratique: {
    legende: 'Practice',
    legendeSujet: 'Where the practice for this topic stands',
    todo: 'To do',
    in_progress: 'In progress',
    done: 'Done',
  },

  categoriesProposees: {
    etudes: 'Studies',
    travail: 'Work',
    langues: 'Languages',
    developpement: 'Development',
    lecture: 'Reading',
    personnel: 'Personal',
  },

  dashboard: {
    titre: 'Today',
    aFaire: (restantes: number) =>
      `${capitale(lettres(restantes))} review${s(restantes)} today.`,
    tempsTermine: 'Everything is done for today.',
    rienDePrevu: 'No reviews scheduled today.',
    ensuite: 'up next',
    revuAujourdhui: 'reviewed today',
    plusRien: 'Nothing left to review: the schedule resumes at the next due date.',
    aVenirIci: 'Upcoming reviews will show up here.',
    prochaine: (date: string, sujets: number) =>
      `Next review: ${date}, ${sujets} topic${s(sujets)}.`,
    enRetard: 'overdue',
    restantes: (nombre: number) => `review${s(nombre)} left`,
    charge: (jours: number) => `Load over ${jours} days`,
    ceMois: 'this month',
    toutVoirCompte: (nombre: number) => `See all (${nombre})`,
    toutVoir: 'See all',
    prochainesEcheances: 'Upcoming due dates',
  },

  regle: {
    titre: 'the next two weeks',
    intitule: (jours: number) => `Load over the next ${jours} days`,
    retard: (nombre: number) => `${nombre} review${s(nombre)} overdue`,
    rattraper: 'catch it up',
    rattraperPlusieurs: 'catch them up',
  },

  charge: {
    aucune: (jours: number) => `No reviews in the next ${jours} days.`,
    intitule: (jours: number) => `Load over the next ${jours} days`,
    aujourdhuiCourt: 'Today',
    jour: (quand: string, nombre: number) =>
      `${quand}, ${nombre === 0 ? 'no reviews' : `${nombre} review${s(nombre)}`}`,
  },

  exemple: {
    sujets: {
      derivees: 'Derivatives',
      accords: 'Major chords',
      vocabulaire: 'Travel vocabulary',
      priorite: 'Right of way rules',
    },
    charger: 'Explore a sample set',
    effacer: 'Clear the sample set',
    chargeTitre: 'A sample set is loaded',
    chargeDetail:
      'Four sample topics, with one overdue review and a few already done. They are ordinary topics: tick them, edit them, or clear them all at once.',
    efface: 'Sample set cleared',
  },

  bienvenue: {
    titrePage: 'Welcome',
    passer: 'Skip',
    continuer: 'Continue',
    compte: (rang: number, total: number) => `${rang} / ${total}`,
    intitule: (rang: number, total: number) => `Introduction, screen ${rang} of ${total}`,
    pied: 'Three screens, ten seconds. You can read them again from the help page.',
    ecrans: [
      {
        surtitre: 'the question',
        titre: 'What do I have to review today?',
        detail:
          'Revoir answers that one question. It keeps what you want to review and when — never what you are learning.',
      },
      {
        surtitre: 'the principle',
        titre: 'The gaps grow.',
        detail:
          'One day, three days, a week, two, a month. You review just before forgetting — that is all spaced repetition does, and that is what this ruler measures.',
        legende:
          'The gap between two graduations equals the real gap between two dates. You are not reading numbers: you are watching time stretch.',
      },
      {
        surtitre: 'the gesture',
        titre: 'You tick, the app keeps up.',
        detail:
          'One tap, no confirmation, undoable for five seconds. A review ticked late shifts the following ones while keeping their gaps, rather than dropping them all on the same day.',
      },
    ],
    finTitre: 'Where to start?',
    creer: 'Create my first topic',
    revoirPresentation: 'Read the three-screen introduction again',
  },

  accueil: {
    titre: 'What do I have to review today?',
    intro:
      'Revoir schedules your reviews using spaced repetition and answers that one question. No account, no server: everything stays on this device.',
    legendeFrise: (programme: string, portee: string) =>
      `The “${programme}” schedule, from the start date to the last reminder: ${portee}.`,
    temps: [
      {
        titre: 'You write down what you want to review',
        detail:
          'A title, a category, a start date, a schedule. No lessons, no notes, no documents: Revoir never stores what you are learning.',
      },
      {
        titre: 'Revoir works out the dates',
        detail:
          'The gaps grow — one day, three days, a week, two, a month. That is spaced repetition: you review just before forgetting.',
      },
      {
        titre: 'You tick, the app keeps up',
        detail:
          'One tap, from any list. A review ticked late shifts the following ones while keeping their gaps, rather than dropping them all on the same day.',
      },
    ],
    neFaitPas: 'What Revoir does not do',
    neFaitPasDetail:
      'No account, no server, no syncing, no ads, no analytics. No notifications, no streak to keep, no score: being late is information, not a judgement.',
    donneesLocales:
      'Your data lives in this browser’s storage, and you can export it to a file at any time.',
    creerSujet: 'Create a topic',
    commentCaMarche: 'How it works',
    categoriesLivrees: (noms: string) =>
      `Six categories are already there — ${noms}. Rename, recolour or delete them from the settings.`,
  },

  jour: {
    compte: (total: number, faites: number) =>
      `${total} review${s(total)} · ${faites} done`,
    precedent: 'Previous day',
    suivant: 'Next day',
    toutMarquer: 'Mark all as reviewed',
    toutReporter: 'Postpone to tomorrow',
    marquees: (nombre: number) => `${nombre} review${s(nombre)} saved`,
    reportees: (nombre: number) => `${nombre} review${s(nombre)} postponed`,
  },

  calendrier: {
    legendeTraits:
      'One line per review, at the height of its state: solid for what remains, short for what is done, long for overdue.',
    titre: 'Calendar',
    moisPrecedent: 'Previous month',
    moisSuivant: 'Next month',
    revenirAujourdhui: 'Back to today',
    aucuneCeJour: 'No reviews scheduled that day.',
    toutesFaites: 'all done',
    exporter: 'Export the calendar (.ics)',
  },

  listes: {
    aujourdhui: {
      titre: 'Today',
      vide: 'Nothing to review today.',
    },
    retard: {
      titre: 'Overdue',
      vide: 'No overdue reviews.',
    },
    prochaines: {
      titre: 'Upcoming reviews',
      vide: 'No reviews scheduled',
    },
  },

  suivi: {
    titre: 'Progress',
    categorie: 'Category',
    toutesCategories: 'All categories',
    colonnes: 'Columns',
    compact: 'Compact',
    intervalles: 'Intervals',
    legendeTitre: 'What do the shapes mean?',
    videTitre: 'Nothing to track yet.',
    videDetail:
      'Progress shows, category by category, where each topic stands in its schedule.',
    creerSujet: 'Create a topic',
    colonneSujet: 'Topic',
    colonnePratique: 'Practice',
    rang: (position: number) => `R${position}`,
    rangComplet: (position: number) => `Review ${position}`,
    ecartComplet: (ecart: string) => `Review at ${ecart}`,
    cadre: (nom: string) => `Progress table — ${nom}`,
    caption: (nom: string) =>
      `Progress for ${nom}: one topic per row, one review step per column.`,
    astuce: 'Swipe to see the rest.',
    horsProgrammeCase: (titre: string, colonne: string) =>
      `${titre}, ${colonne}: not in this schedule.`,
    caseComplete: (titre: string, colonne: string, etat: string, date: string) =>
      `${titre}, ${colonne}, ${etat} ${date}.`,
    pratiqueCase: (titre: string, statut: string) =>
      `Practice for ${titre}: ${statut}. Change.`,
    resume: (sujets: number, enRetard: number, progression: number) => {
      const parties = [`${sujets} topic${s(sujets)}`]
      if (enRetard > 0) parties.push(`${enRetard} review${s(enRetard)} overdue`)
      parties.push(`${progression}% done`)
      return parties.join(' · ')
    },
    etats: {
      faite: 'Done',
      aujourdhui: 'Due today',
      retard: 'Overdue',
      avenir: 'Upcoming',
      'hors-programme': 'Not in this schedule',
    },
    etatsDate: {
      faite: 'done, was due on',
      aujourdhui: 'due today,',
      retard: 'overdue since',
      avenir: 'due on',
      'hors-programme': 'not in this schedule',
    },
    panneauPratique: (titre: string) => `Practice · ${titre}`,
    panneauRevision: (decalage: string, titre: string) =>
      `Review ${decalage} · ${titre}`,
    situation: (rang: number, total: number) => `Review ${rang} of ${total}`,
    effectuee: (situation: string) => `${situation} · done`,
    effectueeLe: (situation: string, date: string) =>
      `${situation} · done on ${date}`,
    prevueRetard: (situation: string, date: string) =>
      `${situation} · was due on ${date}, overdue`,
    prevueAujourdhui: (situation: string) => `${situation} · due today`,
    prevue: (situation: string, date: string) => `${situation} · due on ${date}`,
    annulerValidation: 'Undo',
    marquerEffectuee: 'Mark as done',
    voirLeSujet: 'Open the topic',
  },

  ligne: {
    decocher: (titre: string, decalage: string) =>
      `Untick: ${titre}, review ${decalage}`,
    valider: (titre: string, decalage: string) =>
      `Mark as reviewed: ${titre}, review ${decalage}`,
    progression: (rang: number, total: number) => `Review ${rang} of ${total}`,
    passage: (rang: number, total: number) => `${ordinal(rang)} pass of ${total}`,
    prochaine: 'Next: ',
  },

  sujet: {
    titreDefaut: 'Topic',
    introuvable: 'This topic does not exist any more.',
    retourTableau: 'Back to the dashboard',
    archive: 'Archived',
    creeLe: (date: string) => `Created on ${date}`,
    programme: 'Schedule',
    programmeNomme: (nom: string) => `${nom} schedule`,
    departCourt: (date: string) => `started ${date}`,
    part: (pourcent: number) => `${pourcent}%`,
    progression: (pourcent: number) => `Progress: ${pourcent}%`,
    compte: (faites: number, restantes: number) =>
      `${faites} review${s(faites)} done · ${restantes} left`,
    pratiqueDetail:
      'Exercises for a course, rehearsal for an instrument, a set of questions for a driving test. Practice is a state, not a date: it therefore has no due date.',
    echeances: 'Due dates',
    depart: (date: string) => `Starts on ${date}`,
    basculer: (faite: boolean, decalage: string) =>
      `${faite ? 'Untick' : 'Mark as reviewed'} review ${decalage}`,
    effectuee: 'done',
    reporter: 'Postpone',
    reporterCible: (libelle: string, decalage: string) =>
      `${libelle}: review ${decalage}`,
    actions: 'Actions',
    dupliquer: 'Duplicate',
    archiver: 'Archive',
    desarchiver: 'Unarchive',
    exporterIcs: 'Export (.ics)',
    exporterIcsIntitule: (titre: string) =>
      `Export the due dates of “${titre}” as a calendar file`,
    noteArchive:
      'An archived topic leaves the dashboard, the calendar and the progress table. It stays in the export.',
    confirmerSuppression: 'Delete this topic?',
    detailSuppression: (titre: string, revisions: number) =>
      `“${titre}” and its ${revisions} reviews will be permanently deleted.`,
    toastArchive: 'Topic archived',
    toastDesarchive: 'Topic unarchived',
  },

  creation: {
    etape: (rang: number, total: number) => `step ${rang} / ${total}`,
    etapeIntitule: (rang: number, total: number) =>
      `Creating a topic, step ${rang} of ${total}`,
    plusTard: 'Later',
    passer: 'Skip',
    continuer: 'Continue',
    creer: 'Create topic',

    titre: {
      question: 'What do you want to review?',
      intro: 'A topic, not a subject. Revoir keeps its title — never its content.',
      champ: 'Title',
      exemple: 'Derivatives, major chords…',
      erreur: 'A title is required — write what you want to review to continue.',
      exemplesIntitule: 'Or start from an example',
      exemples: ['derivatives', 'major chords', 'travel vocabulary', 'right of way rules'],
      rassurance:
        'Nothing is saved before the last step. You can go back at any time.',
    },

    categorie: {
      question: 'Which category?',
      intro: (titre: string) =>
        `“${titre}” will join one of them. Optional: a topic without a category is a normal state.`,
      introSansTitre: 'Optional: a topic without a category is a normal state.',
      aucune: 'No category',
      nouvelle: 'New category',
      compte: (nombre: number) => (nombre === 0 ? 'none' : `${nombre} topic${s(nombre)}`),
      note:
        'The colour belongs to the category, not to the topic: it is set on the categories screen, and changing it changes it everywhere.',
    },

    rythme: {
      question: 'At what pace?',
      depart: (date: string) => `Starting today, ${date}.`,
      composer: 'Compose a pace',
      composerAide: 'one graduation at a time',
      apercu: 'Generated dates · load already scheduled',
    },
  },

  sujetForm: {
    titreCreation: 'New topic',
    titreEdition: 'Edit topic',
    duplique: (depuis: string) =>
      `Duplicated from “${depuis}”. The title, category and schedule are carried over; the start date is today.`,
    champTitre: 'Title',
    aideTitre:
      'What you want to review. For example: derivatives, major chords, travel vocabulary.',
    erreurTitre: 'A title is required.',
    champDate: 'Start date',
    intituleDate: 'Choose the start date',
    erreurDate: 'A start date is required.',
    champProgramme: 'Schedule',
    resumeProgramme: (revisions: number, portee: string) =>
      `${revisions} reviews · ${portee}`,
    apercuTitre: 'Generated dates',
    apercuIntitule: 'Schedule preview',
    rienDePrevu: 'nothing scheduled',
    dejaPrevu: (nombre: number) => `${nombre} review${s(nombre)} already`,
    noteEdition:
      'Reviews already ticked stay ticked as long as their gap still exists in the chosen schedule.',
    creer: 'Create the topic',
    modifier: 'Save the topic',
  },

  champDate: {
    choisir: 'Choose a date',
  },

  categories: {
    titre: 'Categories',
    intro:
      'A category groups topics together. Its colour belongs to it: changing it here changes it everywhere the category appears.',
    aucune: 'No categories yet.',
    aucunSujet: 'No topics',
    creer: 'Create a category',
    ajouterProposees: 'Add the suggested categories',
    ajoutees: (nombre: number) => `${nombre} categor${nombre === 1 ? 'y' : 'ies'} added.`,
    supprimee: (nom: string) => `Category “${nom}” deleted.`,
    confirmerSuppression: (nom: string) => `Delete “${nom}”?`,
    detailAucunSujet: 'This category holds no topics.',
    detailSujets: (portes: number) =>
      portes === 1
        ? 'Its topic will move to no category. It will not be deleted.'
        : `Its ${portes} topics will move to no category. They will not be deleted.`,
    /** Le label du champ qui désigne une catégorie, au singulier. */
    champCategorie: 'Category',
    champNom: 'Name',
    apercu: 'Preview',
    titreCreation: 'New category',
    titreEdition: 'Edit category',
    erreurNom: 'A name is required.',
    erreurHomonyme: 'A category already has this name.',
    introuvable: 'This category does not exist any more.',
    creerBouton: 'Create the category',
    modifierBouton: 'Save the category',
    facultatif: 'Optional.',
    nouvelle: 'New category',
  },

  programmeForm: {
    titreCreation: 'New schedule',
    titreEdition: 'Edit schedule',
    champNom: 'Schedule name',
    aideNom: 'For example: Mock exam, Vocabulary, Driving test.',
    erreurNom: 'A name is required.',
    erreurHomonyme: 'A schedule already has this name.',
    introuvable: 'This schedule does not exist any more.',
    rythme: 'Rhythm',
    rythmeIntitule: 'Schedule rhythm',
    modeles: 'Start from a known rhythm',
    question: 'When does the review come back?',
    aideQuestion: 'Tap the due dates to keep. They count from the start date.',
    plein: (maximum: number) =>
      `${maximum} due dates at most: remove one to add another.`,
    erreurRythme: 'Choose at least one due date.',
    resultat: 'The resulting rhythm',
    apercuIntitule: 'Rhythm preview',
    resume: (revisions: number, portee: string) =>
      `${revisions} review${s(revisions)} · ${portee}`,
    detailFige: (revisions: number, portee: string, jours: string) =>
      `${revisions} review${s(revisions)} · ${portee} · ${jours}`,
    fige: (usages: number) =>
      usages > 1
        ? `${usages} topics follow this schedule: their reviews are already planned, the rhythm can no longer change.`
        : 'One topic follows this schedule: its reviews are already planned, the rhythm can no longer change.',
    figeSuite: 'The name, however, can always be changed.',
    creer: 'Create the schedule',
  },

  reglages: {
    titre: 'Settings',
    apparence: {
      titre: 'Appearance',
      intro:
        'The theme follows your system by default. This choice applies to this device: it is not part of your data and is not exported.',
      legende: 'Theme',
      systeme: 'System',
      clair: 'Light',
      sombre: 'Dark',
    },
    langue: {
      titre: 'Language',
      intro:
        'The language of the interface. Your topics, categories and schedules keep the words you wrote.',
      legende: 'Interface language',
    },
    sauvegarde: {
      titre: 'Backup',
      formats: 'JSON · ICS',
      intro:
        'Your data stays on this device. The export produces a JSON file you can keep and import again, here or on another device. Archived topics are included.',
      exporter: 'Export the data',
      importer: 'Import a file',
      exportes: (nombre: number) => `${nombre} topic${s(nombre)} exported.`,
      importes: (nombre: number) => `${nombre} topic${s(nombre)} imported.`,
      illisible: 'This file could not be read.',
      confirmerTitre: 'Replace the current data?',
      confirmerMessage: (entrants: number, actuels: number) =>
        `Importing ${entrants} topic${s(entrants)} will replace your ${actuels} current topic${s(actuels)}.`,
      confirmerAction: 'Import',
      rienEcrit:
        'The file is checked field by field: nothing was written, your current data is intact.',
      autreFichier: 'Choose another file',
    },
    calendrier: {
      titre: 'Calendar',
      intro:
        'The .ics export produces a calendar file: one all-day entry per due date, to import into Google Calendar, Apple Calendar, Outlook or Thunderbird. It is a copy, not a subscription — export again after adding topics.',
      note: 'Only due dates still to do are included; archived topics are left out.',
      exporter: 'Export the calendar (.ics)',
    },
    categories: {
      titre: 'Categories',
      aucune: 'No categories yet.',
      gerer: 'Manage the categories',
    },
    programmes: {
      titre: 'Schedules',
      intro:
        'The three built-in schedules — Simple, Extended, Ultimate — cover most needs. You can compose your own.',
      compte: (revisions: number, portee: string) =>
        `${revisions} review${s(revisions)} · ${portee}`,
      intitule: (nom: string) => `${nom} schedule`,
      renommer: 'Rename',
      modifier: 'Edit',
      creer: 'Create a schedule',
      aucun: 'No pace composed yet. The three built-in schedules stay available when choosing one.',
      compteRangee: (nombre: number) => (nombre === 0 ? '3' : `3 + ${nombre}`),
      supprime: 'Schedule deleted',
      usages: (usages: number) =>
        usages > 1
          ? `Followed by ${usages} topics: their reviews are already planned, the rhythm can no longer change.`
          : 'Followed by one topic: its reviews are already planned, the rhythm can no longer change.',
    },
    archives: {
      aucunCourt: 'none',
      titre: 'Archived topics',
      aucun: 'No archived topics.',
      desarchiver: 'Unarchive',
    },
    apropos: {
      titre: 'About',
      intro:
        'Revoir schedules spaced reviews without ever storing what you are learning. No account, no server, no analytics: everything is saved in your browser’s local storage.',
      effacement:
        'Clearing this site’s data from your browser therefore deletes all your reviews. Remember to export from time to time.',
      licence: 'Free software under the AGPL-3.0 licence.',
      source: 'Source code',
      tiers: 'Third-party licences',
      commentCaMarche: 'How it works',
    },
  },

  aide: {
    regleTitre: 'the ruler, in three seconds',
    regleDetail:
      'The vertical line is today. What sits to its left is done, what sits to its right is coming. The gap between two graduations equals the real gap between two dates.',
    titre: 'How it works',
    intro: 'Revoir answers one question: what do I have to review today?',
    vocabulaire: {
      titre: 'The vocabulary',
      intro:
        'Three words, chosen so the app is not locked into a school context.',
      categorie: 'Category',
      categorieDetail:
        'What groups topics together: Mathematics, English, React, the highway code, piano. It exists before its topics, can be renamed and recoloured, and gets on perfectly well with no topics at all.',
      sujet: 'Topic',
      sujetDetail:
        'What you want to review: derivatives, React hooks, travel vocabulary, major chords. Revoir keeps the title, never the content.',
      revisions: 'Reviews',
      revisionsDetail:
        'The due dates the schedule works out from the start date. You tick them, the app takes care of the next ones.',
      pratique: 'Practice',
      pratiqueDetail:
        'The counterpart to reviews: exercises for a course, rehearsal for the piano, a conversation for a language, a set of questions for a driving test. It is a state — to do, in progress, done — and not a date: with no due date it would always be overdue in the daily lists. It lives on a topic’s page and in the last column of the progress table.',
    },
    programmes: {
      titre: 'The schedules',
      intro:
        'A schedule is a rhythm: the list of gaps, in days, from the start date. The gaps grow — that is the whole point of spaced repetition, where you review just before forgetting.',
      note: 'You can compose your own from the settings: a rhythm is built by tapping graduations, nobody has to type “1 3 7 14 30”. A schedule already followed by a topic keeps its rhythm — that topic’s reviews are already written — but can always be renamed.',
    },
    retard: {
      titre: 'Lateness, shifting and postponing',
      intro:
        'Being late is not an accusation: it is information, not a judgement. No streak to keep, no score.',
      recalageFort: 'Ticking a late review shifts the following ones',
      recalage:
        ' onto the actual date it was ticked, keeping the schedule’s gaps: a D+7 ticked three days late puts D+14 seven days after that tick, not four. Without this shift, catching up on a week of lateness would drop every later due date on the same day.',
      reportFort: 'Postponing, by contrast, moves only the due date it targets.',
      report:
        ' Postponing says nothing about the real rhythm — it says “not today”. The schedule has not changed, and neither have the later due dates.',
      confirmation:
        'Ticking a review asks for no confirmation: the display changes right away and a message offers “Cancel” for five seconds. Deleting is the only action that asks for a confirmation.',
    },
    tableau: {
      titre: 'Reading the progress table',
      intro:
        'One table per category: topics as rows, review steps as columns, practice in the last column. Five states, five shapes — they can also be told apart in greyscale, colour never carries the information on its own.',
      modesAvant: 'Two ways of naming the columns. ',
      modesIntervalles: 'Intervals',
      modesMilieu:
        ' names them by their gap — D+1, D+3, D+7 — taken from the union of the category’s gaps; a step missing from a schedule reads “not in this schedule”. ',
      modesCompact: 'Compact',
      modesApres:
        ' numbers them — R1, R2, R3 — and fits on a phone. Tapping a cell opens a panel to tick, postpone or open the topic.',
    },
    navigation: {
      titre: 'Moving around the app',
      intro:
        'Three views at the bottom of the screen — Today, Calendar, Progress — and, at the top, the logotype, help and settings. Everywhere else, the top of the screen carries a back control: it returns where you came from, including when the app is installed and has no system button.',
    },
    donnees: {
      titre: 'Your data',
      intro:
        'There is no server: nothing leaves your device. No account, no syncing, no analytics. Everything is saved in your browser’s local storage.',
      export:
        'That is also the trade-off: clearing this site’s data from your browser deletes all your reviews, and nobody can give them back. The export produces a file you keep wherever you want and import again here or on another device — think of it now and then.',
      calendrier:
        'The .ics export is a second way out, for a different use: it pours your due dates into a calendar, without ever reading anything back. It is a frozen copy, not a sync — and it is not a backup: only the JSON file can be imported again.',
      reglages: 'Open the settings',
    },
  },

  ics: {
    nomCalendrier: 'Revoir — reviews',
    nomCalendrierSujet: (titre: string) => `Revoir — ${titre}`,
    evenement: (titre: string) => `Review: ${titre}`,
    description: (rang: number, total: number, programme: string) =>
      `Review ${rang} of ${total} · ${programme} schedule`,
    descriptionCategorie: (categorie: string) => `Category: ${categorie}`,
    exportees: (nombre: number) => `${nombre} due date${s(nombre)} exported.`,
    aucune: 'Nothing to export: everything is done.',
    aucuneSujet: 'Nothing to export for this topic.',
  },

  toast: {
    revisionEnregistree: 'Review saved',
    recalageCourt: 'Later dates adjusted',
    recalageLong: 'The later ones keep their gaps, starting from today',
    revisionReportee: 'Review postponed',
    reporteeAu: (date: string) => `To ${date}`,
    reporterDemain: 'Postpone to tomorrow',
    reporterUnJour: 'Postpone by one day',
    miseAJour: 'A new version is available.',
    mettreAJour: 'Update',
  },

  erreurs: {
    lecture:
      'Local data could not be read. It is not lost: try again, and export it from the settings as soon as you can.',
    ecriture: 'Saving locally failed.',
    suppression: 'Deleting locally failed.',
    import: 'The import could not be saved locally.',
    introuvable: 'Page not found',
    adresseInconnue: 'This address matches no page of Revoir.',
  },

  backup: {
    jsonInvalide: 'This file is not valid JSON.',
    pasUneSauvegarde: 'The file does not contain a Revoir backup.',
    autreApplication: 'The file does not come from Revoir.',
    aucuneListe: 'The file contains no list of topics.',
    programmesDoublons: 'The file contains duplicate schedules.',
    categoriesDoublons: 'The file contains duplicate categories.',
    sujetsDoublons: 'The file contains duplicate topics.',
    revisionsDoublons: 'The file contains duplicate reviews.',
    elementsDoublons: 'The file contains duplicate items.',
    programmeInvalide: (rang: number) => `Schedule ${rang} is invalid.`,
    programmeSansId: (rang: number) => `Schedule ${rang}: missing identifier.`,
    programmeSansNom: (rang: number) => `Schedule ${rang}: missing name.`,
    rythmeManquant: (nom: string) => `“${nom}”: missing rhythm.`,
    rythmeInvalide: (nom: string) => `“${nom}”: invalid rhythm.`,
    categorieInvalide: (rang: number) => `Category ${rang} is invalid.`,
    categorieSansId: (rang: number) => `Category ${rang}: missing identifier.`,
    categorieSansNom: (rang: number) => `Category ${rang}: missing name.`,
    sujetInvalide: (rang: number) => `Topic ${rang} is invalid.`,
    sujetSansId: (rang: number) => `Topic ${rang}: missing identifier.`,
    sujetSansTitre: (rang: number) => `Topic ${rang}: missing title.`,
    dateDepartInvalide: (nom: string) => `“${nom}”: invalid start date.`,
    programmeInconnu: (nom: string) => `“${nom}”: unknown schedule.`,
    categorieInconnue: (nom: string) => `“${nom}”: unknown category.`,
    revisionInvalide: (rang: number) => `Review ${rang} is invalid.`,
    revisionSansId: (rang: number) => `Review ${rang}: missing identifier.`,
    revisionSujetInconnu: (rang: number) => `Review ${rang}: unknown topic.`,
    revisionRang: (rang: number) => `Review ${rang}: invalid position.`,
    revisionDecalage: (rang: number) => `Review ${rang}: invalid gap.`,
    revisionEcheance: (rang: number) => `Review ${rang}: invalid due date.`,
    revisionLegacy: (rang: number, nom: string) =>
      `Review ${rang} is invalid in “${nom}”.`,
    decalageLegacy: (nom: string) => `Invalid gap in “${nom}”.`,
    dateLegacy: (nom: string) => `Invalid review date in “${nom}”.`,
    elementInvalide: (rang: number) => `Item ${rang} is invalid.`,
    elementSansId: (rang: number) => `Item ${rang}: missing identifier.`,
    elementSansTitre: (rang: number) => `Item ${rang}: missing title.`,
    revisionsManquantes: (nom: string) => `“${nom}”: missing list of reviews.`,
  },
}
