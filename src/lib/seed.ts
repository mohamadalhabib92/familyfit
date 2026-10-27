import { addDays, startOfWeek, todayISO } from './dates';
import type { Activity, FamilyEvent, Goal, Member, Ritual, Session } from './model';

/** Données de DÉMONSTRATION (toutes marquées demo: true, supprimables en un geste). */
export function demoData(familyId: string, me: Member) {
  const t = todayISO();
  const members: Member[] = [
    { id: 'demo-m2', familyId, name: 'Awa (démo)', role: 'parent', color: '#D08C60', isMinor: false, demo: true },
    { id: 'demo-m3', familyId, name: 'Yanis (démo)', role: 'member', color: '#2F5F8A', isMinor: true, parentConsentShare: false, demo: true },
  ];
  const events: FamilyEvent[] = [
    { id: 'demo-e1', familyId, title: 'Petit-déjeuner du dimanche', category: 'family', date: addDays(startOfWeek(t), 6), start: '09:00', end: '10:00', allDay: false, memberIds: [], recurrence: 'weekly', notes: '', demo: true },
    { id: 'demo-e2', familyId, title: 'École', category: 'school', date: startOfWeek(t), start: '08:15', end: '11:45', allDay: false, memberIds: ['demo-m3'], recurrence: 'weekly', notes: 'Exemple', demo: true },
    { id: 'demo-e3', familyId, title: 'Réunion', category: 'work', date: t, start: '10:00', end: '11:00', allDay: false, memberIds: [me.id], recurrence: 'none', notes: '', demo: true },
    { id: 'demo-e4', familyId, title: 'Appel pédiatre', category: 'family', date: t, start: '10:30', end: '10:45', allDay: false, memberIds: [me.id], recurrence: 'none', notes: 'Conflit volontaire (démo)', demo: true },
    { id: 'demo-e5', familyId, title: 'Balade en forêt', category: 'wellness', date: addDays(t, 2), start: '17:00', end: '18:00', allDay: false, memberIds: [], recurrence: 'none', notes: '', demo: true },
    { id: 'demo-e6', familyId, title: 'Piscine', category: 'leisure', date: addDays(t, 3), start: '14:00', end: '15:30', allDay: false, memberIds: ['demo-m3', 'demo-m2'], recurrence: 'none', notes: '', demo: true },
  ];
  const rituals: Ritual[] = [
    { id: 'demo-r1', familyId, title: 'Réveil en douceur', slot: 'morning', items: ['Verre d’eau', 'Petit-déjeuner ensemble', 'Sacs prêts'], reminder: '07:00', demo: true },
    { id: 'demo-r2', familyId, title: 'Bilan du soir', slot: 'evening', items: ['Une réussite du jour', 'Préparer demain', 'Écrans éteints'], reminder: '20:00', demo: true },
  ];
  const sessions: Session[] = [
    { id: 'demo-s1', familyId, ritualId: 'demo-r2', date: addDays(t, -1), slot: 'evening', done: ['Une réussite du jour', 'Écrans éteints'], participants: [me.id, 'demo-m3'], mood: 4, completedAt: new Date().toISOString() },
  ];
  const goals: Goal[] = [
    { id: 'demo-g1', familyId, title: 'Bouger ensemble', unit: 'min', weeklyTarget: 150, memberIds: [], icon: 'walk-outline', demo: true },
    { id: 'demo-g2', familyId, title: 'Soirées sans écran', unit: 'soirées', weeklyTarget: 3, memberIds: [], icon: 'moon-outline', demo: true },
  ];
  const activities: Activity[] = [
    { id: 'demo-a1', goalId: 'demo-g1', memberId: me.id, date: t, amount: 30 },
    { id: 'demo-a2', goalId: 'demo-g1', memberId: 'demo-m3', date: addDays(t, -1), amount: 45 },
    { id: 'demo-a3', goalId: 'demo-g2', memberId: me.id, date: addDays(t, -1), amount: 1 },
  ];
  return { members, events, rituals, sessions, goals, activities };
}
