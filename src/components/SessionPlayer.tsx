import { useEffect, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { CoachAvatar } from '@/components/CoachAvatar';
import { coachById, SCRIPTED_COACH, type CoachBrain } from '@/lib/coaches';
import { deviceSpeaker, silentSpeaker, type Speaker } from '@/lib/speechVoice';
import { activeBlock, buildTimeline, cuesBetween, formatClock, pausePlayer, startPlayer, tick, variantFor, wholeSeconds, type AgeBand, type Block, type CoachId, type Locale } from '@/lib/workoutEngine';
import { createPlayer } from '@/lib/workoutEngine';
import { translate, type CopyKey } from '@/lib/i18n';
import { HEALTH_DISCLAIMER } from '@/lib/health';
import { TvFocusable, TvText } from '@/components/tv/focus';
import { isTv } from '@/lib/platform';
import { workoutColumns } from '@/lib/tvSurface';
import { Button, Card, Muted, Notice } from '@/ui/kit';
import { useReduceMotion } from '@/ui/motion';
import { theme as t } from '@/ui/theme';

export function SessionPlayer({
  blocks,
  coachId,
  locale,
  band,
  voice = true,
  participants,
  onComplete,
  brain,
  sessionKey = 'phone',
  onRunningChange,
}: {
  blocks: Block[];
  coachId: CoachId;
  locale: Locale;
  band: AgeBand;
  voice?: boolean;
  participants: { id: string; name: string; band: AgeBand }[];
  onComplete: (durationSec: number) => void;
  brain?: CoachBrain | null;
  /** Change seulement quand la routine change et que la séance n’est pas en cours. */
  sessionKey?: string;
  onRunningChange?: (running: boolean) => void;
}) {
  const tv = isTv();
  const window = useWindowDimensions();
  const frame = tv ? workoutColumns({ width: window.width, height: window.height }) : null;
  const coach = coachById(coachId);
  const mind = brain ?? SCRIPTED_COACH;
  const speaker = useRef<Speaker>(voice ? deviceSpeaker() : silentSpeaker());
  const reduce = useReduceMotion();
  const [{ player, line, note }, setUi] = useState(() => ({ player: createPlayer(), line: '', note: '' }));
  const uiRef = useRef({ player: createPlayer(), line: '', note: '' });
  uiRef.current = { player, line, note };
  const timeline = buildTimeline(blocks);
  const warm = blocks.filter((b) => b.phase === 'warmup').reduce((s, b) => s + b.workSec + b.restSec, 0);
  const saved = useRef(false);
  const seenKey = useRef<string | null>(null);
  const copy = (key: CopyKey) => translate(locale, key);
  const coachSize = frame?.coachSize ?? (tv ? 160 : 96);
  const timerSize = frame?.timerSize ?? (tv ? 72 : 40);

  useEffect(() => {
    if (seenKey.current === null) {
      seenKey.current = sessionKey;
      return;
    }
    if (seenKey.current === sessionKey || uiRef.current.player.running) return;
    seenKey.current = sessionKey;
    saved.current = false;
    speaker.current.stop();
    const fresh = { player: createPlayer(), line: '', note: '' };
    uiRef.current = fresh;
    setUi(fresh);
  }, [sessionKey]);

  useEffect(() => {
    onRunningChange?.(player.running);
  }, [player.running, onRunningChange]);

  useEffect(() => {
    if (!tv || !player.running) return undefined;
    let release = () => {};
    try {
      const keep = require('expo-keep-awake') as {
        activateKeepAwakeAsync?: (tag?: string) => Promise<void>;
        deactivateKeepAwake?: (tag?: string) => void | Promise<void>;
      };
      const tag = 'familyfit-tv-workout';
      void keep.activateKeepAwakeAsync?.(tag)?.catch(() => undefined);
      release = () => {
        try { void Promise.resolve(keep.deactivateKeepAwake?.(tag)).catch(() => undefined); } catch { /* écran déjà libre */ }
      };
    } catch { /* module absent : la séance continue */ }
    return release;
  }, [tv, player.running]);

  useEffect(() => {
    speaker.current = voice && !reduce ? deviceSpeaker() : silentSpeaker();
    return () => speaker.current.stop();
  }, [voice, reduce, coachId]);

  useEffect(() => {
    if (!player.running) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const delta = (now - last) / 1000;
      last = now;
      const ui = uiRef.current;
      const step = tick(ui.player, delta, timeline.durationSec, warm);
      const cue = cuesBetween(timeline.cues, step.from, step.to).at(-1);
      const text = cue ? mind.line({ cue, locale, coachId, band }) : ui.line;
      if (text && text !== ui.line && !reduce) speaker.current.speak(text, coach, locale);
      const next = { player: step.player, line: text || ui.line, note: ui.note };
      uiRef.current = next;
      setUi(next);
    }, 250);
    return () => clearInterval(id);
  }, [player.running, timeline.durationSec, warm, locale, coachId, band, mind]);

  useEffect(() => {
    if (player.done && !saved.current) {
      saved.current = true;
      onComplete(Math.round(timeline.durationSec));
    }
  }, [player.done, onComplete, timeline.durationSec]);

  const here = activeBlock(blocks, player.elapsedSec);
  const variant = here ? variantFor(here.block.moveId, band) : null;
  const resting = here ? here.into >= here.block.workSec && here.block.restSec > 0 : false;
  const clock = formatClock(player.elapsedSec);
  const remain = here ? wholeSeconds(here.remaining) : 0;

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <CoachAvatar coachId={coachId} size={coachSize} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: t.muted, fontWeight: '700', letterSpacing: 1, fontSize: tv ? 22 : 14 }}>{coach.name}</Text>
            <Text accessibilityRole="timer" style={{ color: t.text, fontSize: timerSize, fontWeight: '700', letterSpacing: -1 }}>{clock}</Text>
            <Text style={{ color: t.text, fontSize: tv ? 32 : 18, fontWeight: '700' }}>{variant ? variant.name[locale] : copy('player.done')}</Text>
            <Muted>{resting ? copy('player.rest') : copy('player.work')}{here ? ` · ${remain}s` : ''}</Muted>
          </View>
        </View>
        <Text accessibilityLiveRegion="polite" style={{ color: t.text, fontSize: tv ? 28 : 16, lineHeight: tv ? 36 : 23, marginTop: 12 }}>{line || variant?.steps[locale]}</Text>
        {variant ? <Muted style={{ marginTop: 8 }}>{variant.contraindication[locale]}</Muted> : null}
      </Card>
      {participants.length > 1 && here ? (
        <Card>
          <Text style={{ color: t.text, fontWeight: '700', marginBottom: 8 }}>{copy('player.together')}</Text>
          {participants.map((p) => {
            const own = variantFor(here.block.moveId, p.band);
            return (
              <Text key={p.id} style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
                {p.name} · {own.workSec}s · {own.steps[locale]}
              </Text>
            );
          })}
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isTv() ? 24 : 8 }}>
        {isTv() ? (
          <TvFocusable
            preferred
            label={player.running ? copy('player.pause') : copy('train.start')}
            onPress={() => {
              if (player.running) {
                speaker.current.stop();
                setUi((ui) => ({ ...ui, player: pausePlayer(ui.player) }));
                return;
              }
              setUi((ui) => {
                const next = startPlayer(ui.player);
                const text = cuesBetween(timeline.cues, next.elapsedSec - 0.001, next.elapsedSec).at(-1);
                const spoken = text ? mind.line({ cue: text, locale, coachId, band }) : ui.line;
                if (spoken && next.elapsedSec === 0) speaker.current.speak(spoken, coach, locale);
                return { player: next, line: spoken || ui.line, note: '' };
              });
            }}
          >
            <TvText size={32} weight="800">{player.running ? copy('player.pause') : player.elapsedSec > 0 ? copy('player.resume') : copy('train.start')}</TvText>
          </TvFocusable>
        ) : (
          player.running ? (
            <Button title={copy('player.pause')} variant="secondary" onPress={() => { speaker.current.stop(); setUi((ui) => ({ ...ui, player: pausePlayer(ui.player) })); }} />
          ) : (
            <Button title={player.elapsedSec > 0 ? copy('player.resume') : copy('train.start')} onPress={() => {
              setUi((ui) => {
                const next = startPlayer(ui.player);
                const text = cuesBetween(timeline.cues, next.elapsedSec - 0.001, next.elapsedSec).at(-1);
                const spoken = text ? mind.line({ cue: text, locale, coachId, band }) : ui.line;
                if (spoken && next.elapsedSec === 0) speaker.current.speak(spoken, coach, locale);
                return { player: next, line: spoken || ui.line, note: '' };
              });
            }} />
          )
        )}
      </View>
      {note ? <Notice tone="warning" title={note} /> : null}
      {player.done ? <Notice tone="success" title={copy('player.done')} text={HEALTH_DISCLAIMER} /> : null}
    </View>
  );
}
