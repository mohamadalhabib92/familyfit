/**
 * Roster photo des coachs et bibliothèque de mouvements par zone.
 * Les prénoms `nameFr` sont des placeholders : le propriétaire les remplace ici.
 * Les coachs dessinés (Lina, Noor, Pico, Sami) restent dans `coaches.ts`.
 * Rien ici n’écrit le disque famille.
 *
 * Vidéo d’un geste :
 * 1. Déposer le mp4 dans assets/coach-videos/.
 *    Nom : <exercice>-<coach>.mp4, et si deux tempos :
 *    <exercice>-<coach>-lent.mp4 et <exercice>-<coach>-intense.mp4.
 *    Les deux clips déjà là gardent leur nom (coach-homme-squat-v2.mp4,
 *    coach-femme-planche-v2.mp4) et servent de vidéo unique.
 * 2. Le lecteur cherche d’abord videoSlow / videoIntense, puis ce nom,
 *    puis `video`, puis la photo.
 * 3. Ajouter le `require` dans src/components/moves/media.ts, sinon le
 *    fichier n’entre pas dans le bundle.
 */

export const ROSTER_IDS = [
  'coach-homme',
  'coach-femme',
  'coach-femme-voilee',
  'coach-afrique-ouest',
  'coach-asie',
  'coach-maghreb',
  'coach-papa-garcon',
] as const;

export type RosterCoachId = (typeof ROSTER_IDS)[number];

export const COACH_IMAGE_FILES = [
  'coach-homme.jpg',
  'coach-femme.jpg',
  'coach-femme-voilee.jpg',
  'coach-afrique-ouest.jpg',
  'coach-asie.jpg',
  'coach-maghreb.jpg',
  'coach-papa-garcon.jpg',
] as const;

export type RosterCoach = {
  id: RosterCoachId;
  /** Libellé stable du rôle. */
  role: string;
  /** Prénom français. Le propriétaire peut le changer. */
  nameFr: string;
  bio: string;
  /** Chemin dépôt : assets/coaches/<id>.jpg */
  image: string;
  /** Pastille si la photo ne charge pas. */
  tint: string;
  /** Autre coach du même cadre. Le petit coach pointe vers son papa. */
  withCoachId?: RosterCoachId;
  /** Précision courte sous le rôle. */
  note?: string;
  kids: boolean;
};

export const ROSTER: RosterCoach[] = [
  {
    id: 'coach-homme',
    role: 'Coach Homme',
    nameFr: 'Marc',
    bio: 'Coach principal, t-shirt vert. Il montre la flexion et le rythme, sans chercher l’amplitude maximale.',
    image: 'assets/coaches/coach-homme.jpg',
    tint: '#2F6B4F',
    kids: false,
  },
  {
    id: 'coach-femme',
    role: 'Coach Femme',
    nameFr: 'Léa',
    bio: 'Coach femme. Elle pose la planche et les appuis du tronc, le dos long, sans forcer le souffle.',
    image: 'assets/coaches/coach-femme.jpg',
    tint: '#C4786A',
    kids: false,
  },
  {
    id: 'coach-femme-voilee',
    role: 'Coach femme voilée',
    nameFr: 'Amina',
    bio: 'Femme noire, hijab. Elle guide les bras et les épaules, le regard devant, sans geste brusque.',
    image: 'assets/coaches/coach-femme-voilee.jpg',
    tint: '#3C4A6B',
    kids: false,
  },
  {
    id: 'coach-afrique-ouest',
    role: 'Coach homme d’Afrique de l’Ouest',
    nameFr: 'Moussa',
    bio: 'Homme d’Afrique de l’Ouest. Dans les séances enfants il est le papa coach : le petit garçon métis de 6 ans fait les mouvements avec lui.',
    image: 'assets/coaches/coach-afrique-ouest.jpg',
    tint: '#C4A574',
    note: 'Papa coach des séances enfants',
    kids: false,
  },
  {
    id: 'coach-asie',
    role: 'Coach femme asiatique',
    nameFr: 'Sophie',
    bio: 'Femme asiatique, environ 45 ans. Elle insiste sur le dos long et la mobilité, sans à-coup.',
    image: 'assets/coaches/coach-asie.jpg',
    tint: '#D08C60',
    kids: false,
  },
  {
    id: 'coach-maghreb',
    role: 'Coach homme maghrébin',
    nameFr: 'Karim',
    bio: 'Homme maghrébin, la cinquantaine. Il ralentit le tempo et propose l’appui quand il le faut.',
    image: 'assets/coaches/coach-maghreb.jpg',
    tint: '#8C6A4A',
    kids: false,
  },
  {
    id: 'coach-papa-garcon',
    role: 'Petit coach',
    nameFr: 'Élias',
    bio: 'Garçon métis de 6 ans. Il s’accroupit et joue les mouvements à côté de son papa, le coach d’Afrique de l’Ouest, pour encourager les enfants.',
    image: 'assets/coaches/coach-papa-garcon.jpg',
    tint: '#E7B089',
    withCoachId: 'coach-afrique-ouest',
    note: 'Avec son papa coach',
    kids: true,
  },
];

export const BODY_PARTS = [
  { id: 'jambes', title: 'Jambes', blurb: 'Appuis, flexions, fessiers et mollets.' },
  { id: 'abdos', title: 'Abdos/tronc', blurb: 'Gainage et ventre, sans tirer sur la nuque.' },
  { id: 'bras', title: 'Bras', blurb: 'Épaules, bras et appuis des mains.' },
  { id: 'dos', title: 'Dos', blurb: 'Chaîne arrière, omoplates, dos long.' },
  { id: 'cardio', title: 'Cardio', blurb: 'Rythme doux, les deux pieds ne quittent pas le sol ensemble.' },
  { id: 'mobilite', title: 'Mobilité/étirements', blurb: 'Souffle et amplitude confortable.' },
  { id: 'enfants', title: 'Enfants (avec le petit coach)', blurb: 'Le garçon de 6 ans s’exerce avec son papa coach.' },
] as const;

export type BodyPartId = (typeof BODY_PARTS)[number]['id'];

export const LEVELS = ['debutant', 'intermediaire'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABEL: Record<Level, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
};

export type DemoVideo = {
  coachId: RosterCoachId;
  /** Chemin dépôt, ex. assets/coach-videos/coach-homme-squat-v2.mp4 */
  asset?: string;
  /** URL https si le fichier n’est pas dans l’app. */
  url?: string;
};

export type LibraryExercise = {
  id: string;
  name: string;
  bodyPart: BodyPartId;
  level: Level;
  /** Durée ou répétitions, en français. */
  dose: string;
  safety: string[];
  coachId: RosterCoachId;
  /** Étapes affichées quand aucune vidéo ne correspond au coach montré. */
  steps: string[];
  /** Vidéo unique, si lent / intense ne sont pas là. */
  video?: DemoVideo;
  /** Échauffement, montée, retour au calme. */
  videoSlow?: DemoVideo;
  /** Phase intense. */
  videoIntense?: DemoVideo;
};

const STOP = 'Arrêtez si une douleur apparaît. Ceci n’est pas un avis médical.';

function ex(row: Omit<LibraryExercise, 'safety'> & { safety: string[] }): LibraryExercise {
  return { ...row, safety: [...row.safety, STOP] };
}

export const EXERCISES: LibraryExercise[] = [
  ex({
    id: 'squat',
    name: 'Flexion (squat)',
    bodyPart: 'jambes',
    level: 'debutant',
    dose: '8 répétitions',
    coachId: 'coach-homme',
    safety: ['Genoux dans l’axe des orteils.', 'Talons au sol.'],
    steps: [
      'Pieds à largeur du bassin, orteils légèrement ouverts.',
      'Poussez les hanches vers l’arrière et pliez les genoux.',
      'Revenez debout en poussant le sol, sans verrouiller les genoux.',
    ],
    video: { coachId: 'coach-homme', asset: 'assets/coach-videos/coach-homme-squat-v2.mp4' },
  }),
  ex({
    id: 'fente',
    name: 'Fente arrière courte',
    bodyPart: 'jambes',
    level: 'intermediaire',
    dose: '6 répétitions par jambe',
    coachId: 'coach-maghreb',
    safety: ['Le genou avant reste au-dessus de la cheville.', 'Un doigt peut rester sur une chaise.'],
    steps: [
      'Debout, un pied recule d’un petit pas.',
      'Pliez les deux genoux un peu, le buste droit.',
      'Poussez le pied avant pour revenir, puis changez de jambe.',
    ],
  }),
  ex({
    id: 'pont',
    name: 'Pont fessier',
    bodyPart: 'jambes',
    level: 'debutant',
    dose: '8 répétitions',
    coachId: 'coach-femme',
    safety: ['Nuque posée, pas de menton vers le plafond.', 'Arrêtez avant la cambrure forcée.'],
    steps: [
      'Allongé, pieds à plat, genoux pliés.',
      'Soulevez le bassin jusqu’à une ligne genoux-hanches.',
      'Reposez vertèbre après vertèbre.',
    ],
  }),
  ex({
    id: 'mollets',
    name: 'Mollets debout',
    bodyPart: 'jambes',
    level: 'debutant',
    dose: '10 répétitions',
    coachId: 'coach-homme',
    safety: ['Tenez un mur si l’équilibre manque.', 'Montez sans à-coup.'],
    steps: [
      'Pieds parallèles, appui léger sur un mur.',
      'Montez sur les avant-pieds, les genoux souples.',
      'Redescendez le talon lentement.',
    ],
  }),
  ex({
    id: 'chaise',
    name: 'Chaise au mur',
    bodyPart: 'jambes',
    level: 'intermediaire',
    dose: '20 secondes',
    coachId: 'coach-maghreb',
    safety: ['Le dos reste au mur.', 'Les genoux ne dépassent pas les orteils.'],
    steps: [
      'Dos contre le mur, pieds un peu avancés.',
      'Glissez jusqu’à ce que les cuisses soient confortables, pas forcément parallèles au sol.',
      'Respirez, puis remontez en poussant les talons.',
    ],
  }),
  ex({
    id: 'planche',
    name: 'Planche',
    bodyPart: 'abdos',
    level: 'intermediaire',
    dose: '20 secondes',
    coachId: 'coach-femme',
    safety: ['Dos long, sans creuser les lombaires.', 'Genoux au sol si le dos se cambre.'],
    steps: [
      'Avant-bras au sol, coudes sous les épaules.',
      'Corps en ligne, du front aux genoux ou aux talons.',
      'Tenez un souffle calme, sans creuser le bas du dos.',
    ],
    video: { coachId: 'coach-femme', asset: 'assets/coach-videos/coach-femme-planche-v2.mp4' },
  }),
  ex({
    id: 'crunch',
    name: 'Crunch doux',
    bodyPart: 'abdos',
    level: 'debutant',
    dose: '8 répétitions',
    coachId: 'coach-femme',
    safety: ['Ne tirez pas la nuque avec les mains.', 'Le bas du dos peut rester au sol.'],
    steps: [
      'Genoux pliés, mains aux tempes sans tirer.',
      'Décollez la tête et les omoplates en soufflant.',
      'Reposez lentement.',
    ],
  }),
  ex({
    id: 'dead-bug',
    name: 'Insecte au sol',
    bodyPart: 'abdos',
    level: 'debutant',
    dose: '6 répétitions par côté',
    coachId: 'coach-femme-voilee',
    safety: ['Le bas du dos reste lourd au sol.', 'Le mouvement est petit.'],
    steps: [
      'Sur le dos, bras vers le plafond, genoux au-dessus des hanches.',
      'Allongez un bras et la jambe opposée, sans cambrer.',
      'Revenez, puis changez de côté.',
    ],
  }),
  ex({
    id: 'gainage',
    name: 'Gainage latéral genou',
    bodyPart: 'abdos',
    level: 'intermediaire',
    dose: '15 secondes par côté',
    coachId: 'coach-asie',
    safety: ['Le genou du dessous reste au sol.', 'La hanche ne tombe pas d’un coup.'],
    steps: [
      'Sur le côté, genou et avant-bras au sol.',
      'Soulevez la hanche, corps en ligne courte.',
      'Posez, puis changez de côté.',
    ],
  }),
  ex({
    id: 'pompes',
    name: 'Pompes sur les genoux',
    bodyPart: 'bras',
    level: 'debutant',
    dose: '6 répétitions',
    coachId: 'coach-femme-voilee',
    safety: ['Mains sous les épaules.', 'Le corps ne casse pas aux hanches.'],
    steps: [
      'Genoux au sol, mains écartées de la largeur des épaules.',
      'Pliez les coudes le long du corps, poitrine vers le sol.',
      'Poussez le sol pour revenir, sans verrouiller les coudes.',
    ],
  }),
  ex({
    id: 'dips',
    name: 'Dips sur une chaise',
    bodyPart: 'bras',
    level: 'intermediaire',
    dose: '6 répétitions',
    coachId: 'coach-maghreb',
    safety: ['La chaise ne glisse pas.', 'Descendez peu : les épaules restent basses.'],
    steps: [
      'Mains au bord d’une chaise stable, pieds au sol.',
      'Pliez un peu les coudes, épaules loin des oreilles.',
      'Poussez pour revenir.',
    ],
  }),
  ex({
    id: 'elevations',
    name: 'Élévations des bras',
    bodyPart: 'bras',
    level: 'debutant',
    dose: '8 répétitions',
    coachId: 'coach-femme-voilee',
    safety: ['Les épaules ne montent pas vers les oreilles.', 'Amplitude confortable seulement.'],
    steps: [
      'Debout, bras le long du corps.',
      'Levez les bras sur les côtés jusqu’à hauteur d’épaules.',
      'Redescendez lentement.',
    ],
  }),
  ex({
    id: 'cercles',
    name: 'Cercles des bras',
    bodyPart: 'bras',
    level: 'debutant',
    dose: '6 cercles dans chaque sens',
    coachId: 'coach-homme',
    safety: ['Petits cercles si les épaules tirent.', 'Genoux souples.'],
    steps: [
      'Bras écartés, épaules basses.',
      'Tracez de petits cercles vers l’avant.',
      'Puis le même nombre vers l’arrière.',
    ],
  }),
  ex({
    id: 'superman',
    name: 'Superman au sol',
    bodyPart: 'dos',
    level: 'debutant',
    dose: '6 répétitions',
    coachId: 'coach-asie',
    safety: ['Levez peu : le front regarde le sol.', 'Pas de secousse.'],
    steps: [
      'À plat ventre, bras devant, jambes longues.',
      'Décollez un peu les bras et les cuisses en soufflant.',
      'Reposez tout le corps.',
    ],
  }),
  ex({
    id: 'bird-dog',
    name: 'Chien-oiseau',
    bodyPart: 'dos',
    level: 'debutant',
    dose: '6 répétitions par côté',
    coachId: 'coach-asie',
    safety: ['Les hanches ne tournent pas.', 'Un genou reste au sol.'],
    steps: [
      'À quatre pattes, dos long.',
      'Tendez un bras et la jambe opposée, sans creuser.',
      'Reposez, puis changez de côté.',
    ],
  }),
  ex({
    id: 'row',
    name: 'Tirage debout',
    bodyPart: 'dos',
    level: 'debutant',
    dose: '8 répétitions',
    coachId: 'coach-afrique-ouest',
    safety: ['Les coudes restent près du corps.', 'Le menton ne part pas en avant.'],
    steps: [
      'Debout, genoux souples, bras devant.',
      'Ramenez les coudes vers les hanches, omoplates qui se rapprochent.',
      'Rendez les bras sans arrondir le dos.',
    ],
  }),
  ex({
    id: 'ange',
    name: 'Ange au mur',
    bodyPart: 'dos',
    level: 'intermediaire',
    dose: '6 allers',
    coachId: 'coach-asie',
    safety: ['Si les poignets décollent, réduisez la hauteur.', 'Le dos reste au mur.'],
    steps: [
      'Dos, tête et bassin contre le mur, coudes pliés.',
      'Glissez les bras vers le haut sans perdre le contact.',
      'Redescendez les coudes le long des côtes.',
    ],
  }),
  ex({
    id: 'marche',
    name: 'Marche sur place',
    bodyPart: 'cardio',
    level: 'debutant',
    dose: '40 secondes',
    coachId: 'coach-homme',
    safety: ['Posez le pied à plat.', 'Le regard reste devant.'],
    steps: [
      'Debout, bras détendus.',
      'Levez un genou, puis l’autre, à hauteur confortable.',
      'Gardez le même tempo, sans sauter.',
    ],
  }),
  ex({
    id: 'genoux',
    name: 'Montées de genoux',
    bodyPart: 'cardio',
    level: 'intermediaire',
    dose: '30 secondes',
    coachId: 'coach-afrique-ouest',
    safety: ['Les pointes de pieds se posent à chaque fois.', 'Ralentissez si le souffle manque.'],
    steps: [
      'Tenez un rythme où vous pouvez encore parler.',
      'Levez un genou, posez, puis l’autre.',
      'Les bras accompagnent, sans frapper.',
    ],
  }),
  ex({
    id: 'pas-cote',
    name: 'Pas de côté',
    bodyPart: 'cardio',
    level: 'debutant',
    dose: '30 secondes',
    coachId: 'coach-femme',
    safety: ['Un pied reste au sol.', 'Les genoux suivent les orteils.'],
    steps: [
      'Un pas à droite, les deux pieds se rejoignent.',
      'Un pas à gauche, même chose.',
      'Gardez le buste calme.',
    ],
  }),
  ex({
    id: 'step-jack',
    name: 'Écart sans saut',
    bodyPart: 'cardio',
    level: 'debutant',
    dose: '30 secondes',
    coachId: 'coach-homme',
    safety: ['Pas de décollage des deux pieds.', 'Les bras restent sous les épaules si elles tirent.'],
    steps: [
      'Un pied part sur le côté, les bras s’ouvrent.',
      'Le pied revient, les bras aussi.',
      'Changez de pied, toujours un appui au sol.',
    ],
  }),
  ex({
    id: 'respiration',
    name: 'Respiration lente',
    bodyPart: 'mobilite',
    level: 'debutant',
    dose: '4 cycles',
    coachId: 'coach-maghreb',
    safety: ['Ne forcez pas l’apnée.', 'Les épaules restent basses.'],
    steps: [
      'Assis ou debout, une main sur le ventre.',
      'Inspirez par le nez, le ventre avance un peu.',
      'Expirez plus longtemps que l’inspire.',
    ],
  }),
  ex({
    id: 'epaules',
    name: 'Épaules souples',
    bodyPart: 'mobilite',
    level: 'debutant',
    dose: '4 haussements',
    coachId: 'coach-femme-voilee',
    safety: ['Montez sans hausser jusqu’aux oreilles si ça pince.', 'Relâchez d’un coup doux, pas en secouant la tête.'],
    steps: [
      'Bras le long du corps.',
      'Montez les épaules vers les oreilles en inspirant.',
      'Laissez-les retomber en expirant.',
    ],
  }),
  ex({
    id: 'chat',
    name: 'Dos rond et dos long',
    bodyPart: 'mobilite',
    level: 'debutant',
    dose: '6 allers',
    coachId: 'coach-asie',
    safety: ['Les poignets sont sous les épaules.', 'Le mouvement vient du dos, pas du cou seul.'],
    steps: [
      'À quatre pattes, genoux sous les hanches.',
      'Arrondissez le dos vers le plafond en expirant.',
      'Revenez à un dos long en inspirant, sans creuser fort.',
    ],
  }),
  ex({
    id: 'ischios',
    name: 'Arrière de cuisse debout',
    bodyPart: 'mobilite',
    level: 'debutant',
    dose: '20 secondes par jambe',
    coachId: 'coach-maghreb',
    safety: ['Le genou de la jambe d’appui est souple.', 'Pas de rebond.'],
    steps: [
      'Un talon devant, orteils vers le haut.',
      'Buste long, penchez-vous depuis les hanches jusqu’à une tension douce.',
      'Respirez, puis changez de jambe.',
    ],
  }),
  ex({
    id: 'thorax',
    name: 'Ouverture de poitrine',
    bodyPart: 'mobilite',
    level: 'debutant',
    dose: '4 respirations',
    coachId: 'coach-femme',
    safety: ['Les côtes ne poussent pas vers l’avant.', 'Arrêtez si le bas du dos pince.'],
    steps: [
      'Debout, doigts croisés dans le dos ou mains aux hanches.',
      'Ouvrez la poitrine, menton légèrement rentré.',
      'Tenez le temps d’une expiration longue, puis relâchez.',
    ],
  }),
  ex({
    id: 'grenouille',
    name: 'Squat grenouille',
    bodyPart: 'enfants',
    level: 'debutant',
    dose: '6 répétitions',
    coachId: 'coach-papa-garcon',
    safety: ['Un adulte reste à côté.', 'Pas de saut.', 'Les talons peuvent rester un peu levés chez l’enfant.'],
    steps: [
      'Papa et l’enfant se mettent face au même mur.',
      'Ils plient les genoux ensemble, bras devant pour l’équilibre.',
      'Ils se relèvent en comptant jusqu’à deux.',
    ],
  }),
  ex({
    id: 'ours',
    name: 'Marche de l’ours',
    bodyPart: 'enfants',
    level: 'debutant',
    dose: '4 pas en avant, 4 en arrière',
    coachId: 'coach-papa-garcon',
    safety: ['Un adulte reste à côté.', 'Les genoux ne touchent pas le sol si ça gêne : raccourcir le pas.'],
    steps: [
      'Mains et pieds au sol, genoux décollés.',
      'Avancez une main et le pied opposé.',
      'Revenez en arrière sur le même rythme.',
    ],
  }),
  ex({
    id: 'flamant',
    name: 'Équilibre flamant',
    bodyPart: 'enfants',
    level: 'debutant',
    dose: '5 secondes par pied',
    coachId: 'coach-papa-garcon',
    safety: ['Un doigt peut rester sur la main de papa.', 'Le pied levé reste bas.'],
    steps: [
      'Debout à côté de papa.',
      'Levez un pied juste au-dessus du sol.',
      'Posez, puis l’autre pied. On sourit, on ne compte pas les points.',
    ],
  }),
  ex({
    id: 'etoile',
    name: 'Grande étoile',
    bodyPart: 'enfants',
    level: 'debutant',
    dose: '4 respirations',
    coachId: 'coach-papa-garcon',
    safety: ['Un adulte reste à côté.', 'Les bras ne montent que jusqu’où c’est facile.'],
    steps: [
      'Pieds écartés, sans sauter.',
      'Ouvrez les bras comme une étoile en inspirant.',
      'Ramenez les bras en expirant.',
    ],
  }),
  ex({
    id: 'planche-genoux',
    name: 'Planche des genoux',
    bodyPart: 'enfants',
    level: 'debutant',
    dose: '8 secondes',
    coachId: 'coach-papa-garcon',
    safety: ['Un adulte reste à côté.', 'Les genoux restent au sol.', 'Le dos ne fait pas un hamac.'],
    steps: [
      'Genoux et mains au sol.',
      'Avancez un peu les mains, dos long comme papa.',
      'Comptez jusqu’à huit, puis asseyez-vous.',
    ],
  }),
  ex({
    id: 'cercles-jeu',
    name: 'Cercles des bras',
    bodyPart: 'enfants',
    level: 'debutant',
    dose: '4 cercles',
    coachId: 'coach-papa-garcon',
    safety: ['Un adulte reste à côté.', 'Petits cercles, épaules basses.'],
    steps: [
      'Papa et l’enfant tendent les bras sur les côtés.',
      'Ils dessinent de petits cercles vers l’avant.',
      'Puis le même nombre vers l’arrière.',
    ],
  }),
  ex({
    id: 'marche-jeu',
    name: 'Marche sur place',
    bodyPart: 'enfants',
    level: 'debutant',
    dose: '20 secondes',
    coachId: 'coach-papa-garcon',
    safety: ['Un adulte reste à côté.', 'Pas de saut.', 'Le pied se pose à plat.'],
    steps: [
      'Debout à côté de papa.',
      'Levez un genou, posez le pied, puis l’autre.',
      'Les bras se balancent, le regard reste devant.',
    ],
  }),
];

export function rosterById(id: RosterCoachId): RosterCoach {
  const found = ROSTER.find((c) => c.id === id);
  if (!found) throw new Error(`coach inconnu: ${id}`);
  return found;
}

export function isRosterCoachId(value: unknown): value is RosterCoachId {
  return typeof value === 'string' && (ROSTER_IDS as readonly string[]).includes(value);
}

export function rosterCoachId(value: unknown, fallback: RosterCoachId): RosterCoachId {
  const raw = Array.isArray(value) ? value[0] : value;
  return isRosterCoachId(raw) ? raw : fallback;
}

export function bodyPartById(id: string): (typeof BODY_PARTS)[number] | undefined {
  return BODY_PARTS.find((p) => p.id === id);
}

export function exercisesFor(part: BodyPartId): LibraryExercise[] {
  return EXERCISES.filter((e) => e.bodyPart === part);
}

export function exerciseById(id: string): LibraryExercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

/** Sur les séances enfants, papa et le petit coach partagent la photo du duo. */
export function shownCoachId(exercise: LibraryExercise, selected: RosterCoachId): RosterCoachId {
  if (exercise.bodyPart === 'enfants' && (selected === 'coach-papa-garcon' || selected === 'coach-afrique-ouest')) {
    return 'coach-papa-garcon';
  }
  return selected;
}

export type ResolvedDemo =
  | { kind: 'video'; coachId: RosterCoachId; asset: string | null; url: string | null }
  | { kind: 'cues'; coachId: RosterCoachId; steps: string[] };

export function resolveDemo(exercise: LibraryExercise, selected: RosterCoachId): ResolvedDemo {
  const coachId = shownCoachId(exercise, selected);
  const video = exercise.video;
  if (video && video.coachId === coachId && (video.asset || video.url)) {
    return { kind: 'video', coachId, asset: video.asset ?? null, url: video.url ?? null };
  }
  return { kind: 'cues', coachId, steps: exercise.steps };
}

export function runCoachLibrarySelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const ids = ROSTER.map((c) => c.id);
  check('sept coachs, ids uniques', ids.length === 7 && new Set(ids).size === 7 && ROSTER_IDS.every((id) => ids.includes(id)));
  check(
    'photos attendues',
    ROSTER.every((c) => c.image === `assets/coaches/${c.id}.jpg`) &&
      COACH_IMAGE_FILES.length === 7 &&
      COACH_IMAGE_FILES.every((file) => ROSTER.some((c) => c.image.endsWith(file))),
  );
  check('aucun ancien duo avec Coach Homme', ROSTER.every((c) => !c.image.includes('homme-garcon')));
  check('prénoms et bios', ROSTER.every((c) => c.nameFr.trim().length > 1 && c.bio.trim().length > 20 && c.role.trim().length > 3));
  const boy = rosterById('coach-papa-garcon');
  const dad = rosterById('coach-afrique-ouest');
  check('petit coach lié au papa d’Afrique de l’Ouest', boy.kids && boy.withCoachId === 'coach-afrique-ouest' && dad.id === 'coach-afrique-ouest');
  check(
    'bio du garçon métis de 6 ans avec son papa',
    boy.bio.includes('métis') && boy.bio.includes('6 ans') && boy.bio.includes('papa') && boy.bio.includes('Afrique de l’Ouest') && !boy.bio.includes('t-shirt vert'),
  );
  check('papa coach nommé dans sa bio', dad.bio.includes('papa coach') && dad.bio.includes('Afrique de l’Ouest') && dad.note === 'Papa coach des séances enfants');
  const parts = BODY_PARTS.map((p) => p.id);
  check(
    'sept zones',
    parts.length === 7 &&
      ['jambes', 'abdos', 'bras', 'dos', 'cardio', 'mobilite', 'enfants'].every((id) => parts.includes(id as BodyPartId)),
  );
  check('titre enfants', BODY_PARTS.find((p) => p.id === 'enfants')?.title === 'Enfants (avec le petit coach)');
  const exIds = EXERCISES.map((e) => e.id);
  check('mouvements uniques et complets', exIds.length >= 20 && new Set(exIds).size === exIds.length);
  check(
    'champs de chaque mouvement',
    EXERCISES.every((e) =>
      e.name.trim().length > 2 &&
      parts.includes(e.bodyPart) &&
      (LEVELS as readonly string[]).includes(e.level) &&
      e.dose.trim().length > 2 &&
      e.safety.length >= 2 &&
      e.safety.some((s) => s.includes('douleur')) &&
      e.steps.length >= 3 &&
      isRosterCoachId(e.coachId),
    ),
  );
  check('chaque zone a des mouvements', parts.every((id) => exercisesFor(id).length >= 3));
  check('enfants seulement avec le petit coach', exercisesFor('enfants').every((e) => e.coachId === 'coach-papa-garcon'));
  const squat = exerciseById('squat');
  const planche = exerciseById('planche');
  check('squat filmé par Coach Homme', !!squat && squat.bodyPart === 'jambes' && squat.video?.coachId === 'coach-homme' && squat.video.asset === 'assets/coach-videos/coach-homme-squat-v2.mp4');
  check('planche filmée par Coach Femme', !!planche && planche.bodyPart === 'abdos' && planche.video?.coachId === 'coach-femme' && planche.video.asset === 'assets/coach-videos/coach-femme-planche-v2.mp4');
  if (squat && planche) {
    const squatVideo = resolveDemo(squat, 'coach-homme');
    const squatOther = resolveDemo(squat, 'coach-femme');
    const plankVideo = resolveDemo(planche, 'coach-femme');
    const plankOther = resolveDemo(planche, 'coach-maghreb');
    check('résolution vidéo squat', squatVideo.kind === 'video' && squatVideo.asset?.endsWith('coach-homme-squat-v2.mp4') === true);
    check('squat sans vidéo pour un autre coach', squatOther.kind === 'cues' && squatOther.coachId === 'coach-femme' && squatOther.steps.length >= 3);
    check('résolution vidéo planche', plankVideo.kind === 'video' && plankVideo.asset?.endsWith('coach-femme-planche-v2.mp4') === true);
    check('planche sans vidéo pour un autre coach', plankOther.kind === 'cues' && plankOther.coachId === 'coach-maghreb');
    const frog = exerciseById('grenouille');
    if (frog) {
      const withDad = resolveDemo(frog, 'coach-afrique-ouest');
      const withBoy = resolveDemo(frog, 'coach-papa-garcon');
      const withMarc = resolveDemo(frog, 'coach-homme');
      check('papa montre la photo du duo', withDad.kind === 'cues' && withDad.coachId === 'coach-papa-garcon');
      check('petit coach montre le duo', withBoy.kind === 'cues' && withBoy.coachId === 'coach-papa-garcon');
      check('un autre coach reste sur sa photo', withMarc.kind === 'cues' && withMarc.coachId === 'coach-homme');
    } else {
      check('grenouille présente', false);
    }
    const remote = resolveDemo({ ...squat, video: { coachId: 'coach-homme', url: 'https://example.com/squat.mp4' } }, 'coach-homme');
    check('url distante', remote.kind === 'video' && remote.url === 'https://example.com/squat.mp4' && remote.asset === null);
    const both = resolveDemo({ ...squat, video: { coachId: 'coach-homme', asset: squat.video?.asset, url: 'https://example.com/squat.mp4' } }, 'coach-homme');
    check('fichier local prioritaire sur l’url', both.kind === 'video' && both.asset === squat.video?.asset && both.url === 'https://example.com/squat.mp4');
  }
  check('ids de coach lus depuis la route', rosterCoachId('coach-asie', 'coach-homme') === 'coach-asie' && rosterCoachId('lina', 'coach-femme') === 'coach-femme');
  return out;
}
