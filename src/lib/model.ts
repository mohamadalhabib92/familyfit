/** Modèle FamilyFit — family_id central (miroir du schéma Supabase). */
export type Role = 'admin' | 'parent' | 'member';
export const ROLE_LABEL: Record<Role, string> = { admin: 'Administrateur·rice', parent: 'Parent', member: 'Membre' };
export const canManage = (r?: Role) => r === 'admin' || r === 'parent';

export type Family = { id: string; name: string; createdAt: string };

/** Mineur : prénom + couleur uniquement (minimisation). Pas d’e-mail, pas de téléphone, pas de localisation. */
export type Member = {
  id: string; familyId: string; name: string; role: Role; color: string; isMinor: boolean;
  contact?: string; // adultes uniquement
  parentConsentShare?: boolean; // mineurs : consentement parent pour partager prénom/événements avec des invités
  isMe?: boolean; demo?: boolean;
};

export type Invitation = {
  id: string; familyId: string; code: string; role: Role; createdAt: string; expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked'; acceptedBy?: string;
};

export const CATEGORIES = [
  { key: 'family', label: 'Famille', en: 'Family', color: '#2F4B43', icon: 'home-outline' },
  { key: 'work', label: 'Travail', en: 'Work', color: '#2F5F8A', icon: 'briefcase-outline' },
  { key: 'school', label: 'École', en: 'School', color: '#8A5A00', icon: 'school-outline' },
  { key: 'leisure', label: 'Loisirs', en: 'Leisure', color: '#B0476B', icon: 'game-controller-outline' },
  { key: 'wellness', label: 'Bien-être', en: 'Wellness', color: '#2E7D4F', icon: 'leaf-outline' },
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

export const RITUAL_TEMPLATES: Omit<Ritual, 'id' | 'familyId'>[] = [
  { title: 'Réveil en douceur', slot: 'morning', items: ['Verre d’eau', 'Petit-déjeuner ensemble', 'Cartables / sacs prêts', 'Un mot gentil'], template: true },
  { title: 'Bouger 10 minutes', slot: 'morning', items: ['Étirements', 'Marche ou danse', 'Respiration'], template: true },
  { title: 'Bilan du soir', slot: 'evening', items: ['Une réussite du jour', 'Préparer demain', 'Écrans éteints', 'Lecture'], template: true },
  { title: 'Gratitude', slot: 'evening', items: ['Chacun partage une gratitude', 'Câlin / bonne nuit'], template: true },
];

export const MEMBER_COLORS = ['#2F4B43', '#D08C60', '#2F5F8A', '#B0476B', '#6B5BA8', '#2E7D4F', '#8A5A00'];

/** Nom affiché d’un membre selon le lecteur (vie privée des mineurs). */
export function displayName(m: Member | undefined, viewer: Member | null): string {
  if (!m) return 'Membre';
  if (m.isMinor && !m.parentConsentShare && !canManage(viewer?.role) && m.id !== viewer?.id) return 'Enfant';
  return m.name;
}
