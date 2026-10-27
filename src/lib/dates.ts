const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => iso(new Date());
export const fromISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const addDays = (s: string, n: number) => { const d = fromISO(s); d.setDate(d.getDate() + n); return iso(d); };
export const startOfWeek = (s: string) => { const d = fromISO(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); };
export const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
export const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export function parseDay(s: string): string | null {
  const t = s.trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return t;
  m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1], 12);
  return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? iso(d) : null;
}
const WD = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const dayLabel = (s: string) => { const d = fromISO(s); return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`; };
export const dayCH = (s: string) => { const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
