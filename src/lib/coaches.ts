/**
 * Personnages originaux de FamilyFit. Pas de franchise, pas de voix distante.
 * `CoachBrain` est le point d’extension : aujourd’hui un script local,
 * demain un module approuvé par le propriétaire. Aucun service payant n’est appelé.
 */
import { variantFor, type AgeBand, type CoachId, type Cue, type Locale, type L10n } from './workoutEngine';

export type Coach = {
  id: CoachId;
  name: string;
  pitch: number;
  rate: number;
  tint: string;
  ink: string;
  energy: 'high' | 'calm' | 'play' | 'steady';
  title: L10n;
  bio: L10n;
};

export const COACHES: Coach[] = [
  {
    id: 'lina', name: 'Lina', pitch: 1.05, rate: 1.02, tint: '#E7B089', ink: '#2F4B43', energy: 'high',
    title: { fr: 'Énergie claire', en: 'Bright energy', de: 'Klare Energie', ar: 'طاقة واضحة' },
    bio: { fr: 'Elle lance le mouvement et laisse chacun suivre son niveau.', en: 'She starts the move and lets each person follow their level.', de: 'Sie startet die Bewegung und lässt jede Person ihr Niveau finden.', ar: 'تبدأ الحركة وتترك كل شخص على مستواه.' },
  },
  {
    id: 'noor', name: 'Noor', pitch: 0.96, rate: 0.9, tint: '#C9D7C4', ink: '#24312C', energy: 'calm',
    title: { fr: 'Calme et souffle', en: 'Calm and breath', de: 'Ruhe und Atem', ar: 'هدوء ونَفَس' },
    bio: { fr: 'Voix posée pour les soirées et les épaules chargées.', en: 'A steady voice for evenings and tired shoulders.', de: 'Eine ruhige Stimme für Abende und müde Schultern.', ar: 'صوت هادئ للمساء والأكتاف المتعبة.' },
  },
  {
    id: 'pico', name: 'Pico', pitch: 1.12, rate: 1.04, tint: '#F2C14E', ink: '#2A2416', energy: 'play',
    title: { fr: 'Coach joueur', en: 'Playful coach', de: 'Spielerischer Coach', ar: 'مدرّب لعوب' },
    bio: { fr: 'Un rond souriant inventé pour FamilyFit. Aucun héros de dessin animé.', en: 'A smiling round figure made for FamilyFit. No cartoon hero.', de: 'Eine lächelnde runde Figur für FamilyFit. Kein Zeichentrickheld.', ar: 'شكل دائري مبتسم صُنع لـ FamilyFit. ليس بطل رسوم.' },
  },
  {
    id: 'sami', name: 'Sami', pitch: 0.9, rate: 0.88, tint: '#D7C4A3', ink: '#2C261C', energy: 'steady',
    title: { fr: 'Rythme posé', en: 'Unhurried pace', de: 'Ruhiges Tempo', ar: 'إيقاع غير مستعجل' },
    bio: { fr: 'Il propose la chaise et le plan de travail, sans infantiliser.', en: 'He offers the chair and the counter, without talking down.', de: 'Er bietet Stuhl und Arbeitsplatte an, ohne herablassend zu sein.', ar: 'يقترح الكرسي والطاولة دون تعالٍ.' },
  },
];

export const coachById = (id: CoachId) => COACHES.find((c) => c.id === id) ?? COACHES[0];

const PHASE: Record<string, L10n> = {
  'phase.warmup': {
    fr: 'Échauffement. On ne le saute pas.',
    en: 'Warm-up. We do not skip it.',
    de: 'Aufwärmen. Wir überspringen es nicht.',
    ar: 'إحماء. لا نتخطاه.',
  },
  'phase.main': {
    fr: 'Corps de séance. Même geste, chacun sa version.',
    en: 'Main block. Same move, each person their version.',
    de: 'Hauptteil. Dieselbe Bewegung, jede Person ihre Fassung.',
    ar: 'صلب الحصة. الحركة نفسها، ولكل شخص نسخته.',
  },
  'phase.cooldown': {
    fr: 'Retour au calme.',
    en: 'Cool-down.',
    de: 'Abwärmen.',
    ar: 'تهدئة.',
  },
  rest: {
    fr: 'Repos. Secouez les mains, buvez si besoin.',
    en: 'Rest. Shake your hands, drink if you need.',
    de: 'Pause. Hände ausschütteln, trinken wenn nötig.',
    ar: 'راحة. حرّك اليدين، واشرب إذا احتجت.',
  },
  done: {
    fr: 'Séance terminée. Bravo d’avoir bougé ensemble.',
    en: 'Session complete. Well done for moving together.',
    de: 'Einheit geschafft. Schön, dass ihr euch zusammen bewegt habt.',
    ar: 'انتهت الحصة. أحسنتم لأنكم تحركتم معًا.',
  },
  'count.3': { fr: 'Trois', en: 'Three', de: 'Drei', ar: 'ثلاثة' },
  'count.2': { fr: 'Deux', en: 'Two', de: 'Zwei', ar: 'اثنان' },
  'count.1': { fr: 'Un', en: 'One', de: 'Eins', ar: 'واحد' },
};

const ENCOURAGE: Record<CoachId, L10n> = {
  lina: { fr: 'Beau rythme. Gardez le sourire, pas la performance.', en: 'Nice pace. Keep the smile, not the score.', de: 'Gutes Tempo. Behaltet das Lächeln, nicht die Leistung.', ar: 'إيقاع جميل. أبقوا الابتسامة لا النتيجة.' },
  noor: { fr: 'Restez larges dans le souffle.', en: 'Stay wide in the breath.', de: 'Bleibt weit im Atem.', ar: 'أبقوا النَّفَس واسعًا.' },
  pico: { fr: 'On invente la forme ensemble. Encore un peu.', en: 'We invent the shape together. A little more.', de: 'Wir erfinden die Form zusammen. Noch ein bisschen.', ar: 'نخترع الشكل معًا. قليلًا بعد.' },
  sami: { fr: 'Prenez l’appui si vous voulez. Le geste compte, pas la hauteur.', en: 'Use the support if you want. The move counts, not the height.', de: 'Nehmen Sie die Stütze, wenn Sie wollen. Die Bewegung zählt, nicht die Höhe.', ar: 'استخدم السند إن شئت. الحركة هي المهمة لا الارتفاع.' },
};

const OPENER: Record<CoachId, L10n> = {
  lina: { fr: 'C’est parti.', en: 'Here we go.', de: 'Los geht’s.', ar: 'هيا.' },
  noor: { fr: 'Doucement.', en: 'Gently.', de: 'Ganz ruhig.', ar: 'بهدوء.' },
  pico: { fr: 'On joue.', en: 'Let’s play.', de: 'Wir spielen.', ar: 'لنلعب.' },
  sami: { fr: 'À votre rythme.', en: 'At your pace.', de: 'In Ihrem Tempo.', ar: 'على إيقاعكم.' },
};

export type CoachLineInput = {
  cue: Cue;
  locale: Locale;
  coachId: CoachId;
  band: AgeBand;
};

export interface CoachBrain {
  readonly kind: 'scripted' | 'ai';
  line(input: CoachLineInput): string;
}

export function createScriptedCoach(): CoachBrain {
  return {
    kind: 'scripted',
    line({ cue, locale, coachId, band }) {
      if (cue.speechId.startsWith('phase.') || cue.speechId === 'rest' || cue.speechId === 'done' || cue.speechId.startsWith('count.')) {
        return PHASE[cue.speechId]?.[locale] ?? '';
      }
      if (cue.speechId === 'encourage') return ENCOURAGE[coachId][locale];
      if (cue.moveId && (cue.kind === 'start' || cue.kind === 'form')) {
        const variant = variantFor(cue.moveId, band);
        if (cue.kind === 'form') return variant.form[locale];
        return `${OPENER[coachId][locale]} ${variant.name[locale]}. ${variant.steps[locale]}`;
      }
      return '';
    },
  };
}

/**
 * Branche un coach plus tard. Sans module fourni, le script local reste la voix.
 * N’ajoutez un `kind: 'ai'` qu’après accord du propriétaire : pas de clé, pas d’appel ici.
 */
export function resolveCoach(plugin?: CoachBrain | null): CoachBrain {
  return plugin ?? SCRIPTED_COACH;
}

export const SCRIPTED_COACH = createScriptedCoach();
