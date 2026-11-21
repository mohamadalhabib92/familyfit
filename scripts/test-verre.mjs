// Verre : voiles clair/sombre, relief, cibles, focus TV. Aucune clé de stockage nouvelle.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
let failed = 0;
const ok = (name, pass) => {
  console.log(pass ? '✓' : '✗', name);
  if (!pass) failed += 1;
};

const glass = read('src/ui/glass.tsx');
ok('voile 0.90 clair et sombre', glass.includes('rgba(16,22,20,0.90)') && glass.includes('rgba(246,244,239,0.90)'));
ok('ombres en deux couches', glass.includes('boxShadow') && glass.includes('0 8px 16px') && glass.includes('0 2px 3px'));
ok('repli réduire la transparence', read('src/ui/effects.tsx').includes('reduceTransparency') && read('src/ui/effects.tsx').includes('reduceMotion'));

const kit = read('src/ui/kit.tsx');
ok('relief branché sur les boutons', kit.includes('raisedShadow'));
ok('cibles 44 pt et Dynamic Type', kit.includes('useMinTarget') && kit.includes('fontScale') && kit.includes('Math.max(44'));
ok('texte non plafonné dans le kit', !kit.includes('allowFontScaling={false}'));

const focus = read('src/components/tv/focus.tsx');
ok('salon : verre, anneau doré, réduire les animations', focus.includes('glassVeil') && focus.includes('#F6C453') && focus.includes('useReduceMotion') && !focus.includes('#E7E0D4'));
ok('salon plein écran, sans mesure forcée', focus.includes('flex: 1') && !focus.includes('measureInWindow') && !focus.includes('1080'));

const tvFiles = ['src/app/tv.tsx', 'src/components/tv/LivingHome.tsx', 'src/components/tv/LivingSession.tsx', 'src/components/tv/LivingSettings.tsx', 'src/app/moves/index.tsx', 'src/components/SessionPlayer.tsx', 'src/components/moves/MovesFrame.tsx', 'src/app/moves/[part].tsx'];
ok('encre TV sur les jetons du thème', tvFiles.every((file) => !read(file).includes('color="#1D2522"')));

const theme = read('src/ui/theme.ts');
ok('espace et typographie partagés', theme.includes('space:') && theme.includes('display:') && theme.includes('body:'));

const data = read('src/lib/data.tsx');
for (const key of ['session', 'prefs', 'family', 'members', 'events', 'rituals', 'sessions', 'goals']) {
  ok(`clé ${key} inchangée`, data.includes(`'${key}'`));
}

if (failed) {
  console.log(failed, 'échec(s)');
  process.exit(1);
}
console.log('Verre OK');
