import { COACH_IMAGE_FILES, type RosterCoachId } from '@/lib/coachLibrary';

/**
 * Requires statiques : Metro ne bundle pas un chemin calculé.
 * Pour une nouvelle vidéo, ajoutez la ligne `require`.
 * Noms lus par la séance : <exercice>-<coach>.mp4,
 * <exercice>-<coach>-lent.mp4, <exercice>-<coach>-intense.mp4.
 * Sans ce require, le lecteur passe au clip suivant, puis à la photo.
 */
const PHOTO_BY_FILE: Record<(typeof COACH_IMAGE_FILES)[number], number> = {
  'coach-homme.jpg': require('../../../assets/coaches/coach-homme.jpg'),
  'coach-femme.jpg': require('../../../assets/coaches/coach-femme.jpg'),
  'coach-femme-voilee.jpg': require('../../../assets/coaches/coach-femme-voilee.jpg'),
  'coach-afrique-ouest.jpg': require('../../../assets/coaches/coach-afrique-ouest.jpg'),
  'coach-asie.jpg': require('../../../assets/coaches/coach-asie.jpg'),
  'coach-maghreb.jpg': require('../../../assets/coaches/coach-maghreb.jpg'),
  'coach-papa-garcon.jpg': require('../../../assets/coaches/coach-papa-garcon.jpg'),
};

export const COACH_PHOTO: Record<RosterCoachId, number> = {
  'coach-homme': PHOTO_BY_FILE['coach-homme.jpg'],
  'coach-femme': PHOTO_BY_FILE['coach-femme.jpg'],
  'coach-femme-voilee': PHOTO_BY_FILE['coach-femme-voilee.jpg'],
  'coach-afrique-ouest': PHOTO_BY_FILE['coach-afrique-ouest.jpg'],
  'coach-asie': PHOTO_BY_FILE['coach-asie.jpg'],
  'coach-maghreb': PHOTO_BY_FILE['coach-maghreb.jpg'],
  'coach-papa-garcon': PHOTO_BY_FILE['coach-papa-garcon.jpg'],
};

export const COACH_VIDEO: Record<string, number> = {
  'assets/coach-videos/coach-homme-squat-v2.mp4': require('../../../assets/coach-videos/coach-homme-squat-v2.mp4'),
  'assets/coach-videos/coach-femme-planche-v2.mp4': require('../../../assets/coach-videos/coach-femme-planche-v2.mp4'),
};

export function videoModule(asset: string | null): number | null {
  if (!asset) return null;
  return COACH_VIDEO[asset] ?? null;
}
