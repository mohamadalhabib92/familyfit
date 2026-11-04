import { theme } from '@/ui/theme';

/** Modèle FamilyFit — family_id central (miroir du schéma Supabase). */
export type Role = 'admin' | 'parent' | 'member';
export const ROLE_LABEL: Record<Role, string> = { admin: 'Administrateur·rice', parent: 'Parent', member: 'Membre' };
export const canManage = (r?: Role) => r === 'admin' || r === 'parent';

export type Family = { id: string; name: string; createdAt: string; trial?: boolean };

/** Mineur : prénom + couleur uniquement (minimisation). Pas d’e-mail, pas de téléphone, pas de localisation. */
export type Member = {
  id: string; familyId: string; name: string; role: Role; color: string; isMinor: boolean;
  glyph?: string; // motif en plus de la couleur (daltonisme)
  contact?: string; // adultes uniquement
  parentConsentShare?: boolean; // mineurs : consentement parent pour partager prénom/événements avec des invités
  isMe?: boolean; demo?: boolean;
};

export type Invitation = {
  id: string; familyId: string; code: string; role: Role; createdAt: string; expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked'; acceptedBy?: string;
};

// `color` est lu à l'usage : il suit le mode clair / sombre.
export const CATEGORIES = [
  { key: 'family', label: 'Famille', en: 'Family', icon: 'home-outline', get color() { return theme.category.family; } },
  { key: 'work', label: 'Travail', en: 'Work', icon: 'briefcase-outline', get color() { return theme.category.work; } },
  { key: 'school', label: 'École', en: 'School', icon: 'school-outline', get color() { return theme.category.school; } },
  { key: 'leisure', label: 'Loisirs', en: 'Leisure', icon: 'game-controller-outline', get color() { return theme.category.leisure; } },
  { key: 'wellness', label: 'Bien-être', en: 'Wellness', icon: 'leaf-outline', get color() { return theme.category.wellness; } },
] as const;
export type Category = (typeof CATEGORIES)[number]['key'];
export const cat = (k: Category) => CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[0];

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export const RECURRENCE_LABEL: Record<Recurrence, string> = { none: 'Aucune', daily: 'Chaque jour', weekly: 'Chaque semaine', monthly: 'Chaque mois' };

export type FamilyEvent = {
  id: string; familyId: string; title: string; category: Category;
  date: string; // AAAA-MM-JJ (premier jour)
  start: string; end: string; // HH:MM ; allDay => ignorés
  allDay: boolean; memberIds: string[]; // vide = toute la famille
  recurrence: Recurrence; until?: string; notes: string;
  reminderMin?: number; // minutes avant
  demo?: boolean;
};

export type Slot = 'morning' | 'evening';
export const SLOT_LABEL: Record<Slot, string> = { morning: 'Matin', evening: 'Soir' };
export type Ritual = { id: string; familyId: string; title: string; slot: Slot; items: string[]; reminder?: string; template?: boolean; demo?: boolean };
export type Session = {
  id: string; familyId: string; ritualId: string; date: string; slot: Slot;
  done: string[]; participants: string[]; mood?: 1 | 2 | 3 | 4 | 5; note?: string; completedAt?: string;
};
export const MOODS = ['😞', '😕', '🙂', '😊', '🤩'] as const;

export type Goal = { id: string; familyId: string; title: string; unit: string; weeklyTarget: number; memberIds: string[]; icon: string; demo?: boolean };
export type Activity = { id: string; goalId: string; memberId: string; date: string; amount: number };

/** Liste locale (courses, à faire). La synchro partagée est une passe ultérieure. */
export type ListItem = { id: string; label: string; qty: string; done: boolean };
export type FamilyList = { id: string; familyId: string; title: string; items: ListItem[]; demo?: boolean };

export const RITUAL_TEMPLATES: Omit<Ritual, 'id' | 'familyId'>[] = [
  { title: 'Réveil en douceur', slot: 'morning', items: ['Verre d’eau', 'Petit-déjeuner ensemble', 'Cartables / sacs prêts', 'Un mot gentil'], template: true },
  { title: 'Bouger 10 minutes', slot: 'morning', items: ['Étirements', 'Marche ou danse', 'Respiration'], template: true },
  { title: 'Bilan du soir', slot: 'evening', items: ['Une réussite du jour', 'Préparer demain', 'Écrans éteints', 'Lecture'], template: true },
  { title: 'Gratitude', slot: 'evening', items: ['Chacun partage une gratitude', 'Câlin / bonne nuit'], template: true },
];

export const MEMBER_PALETTE = theme.memberPalette;
export const MEMBER_COLORS = MEMBER_PALETTE.map((p) => p.color);

/** Couleur + motif. Les fiches déjà enregistrées sans glyph retrouvent le motif de leur couleur. */
export function memberMark(m: { id: string; color: string; glyph?: string }) {
  const found = MEMBER_PALETTE.find((p) => p.color.toLowerCase() === m.color.toLowerCase());
  if (found) return found;
  if (m.glyph) return { color: m.color, glyph: m.glyph, label: 'Motif personnel' };
  let h = 0;
  for (const ch of m.id) h = (h + ch.charCodeAt(0)) % MEMBER_PALETTE.length;
  const fallback = MEMBER_PALETTE[h] ?? MEMBER_PALETTE[0];
  return { color: m.color, glyph: fallback.glyph, label: fallback.label };
}

/** Nom affiché d’un membre selon le lecteur (vie privée des mineurs). */
export function displayName(m: Member | undefined, viewer: Member | null): string {
  if (!m) return 'Membre';
  if (m.isMinor && !m.parentConsentShare && !canManage(viewer?.role) && m.id !== viewer?.id) return 'Enfant';
  return m.name;
}
