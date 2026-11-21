import { useEffect, useRef, useState } from 'react';
import { useEvent } from 'expo';
import { ActivityIndicator, Text, useWindowDimensions, View } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { videoModule } from '@/components/moves/media';
import { TvFocusable, TvText } from '@/components/tv/focus';
import { shouldSeekMedia, showVideoPoster, videoPlaybackFailed } from '@/lib/playback';
import { isTv } from '@/lib/platform';
import { Button, Row } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

type Copy = { play: string; pause: string; mute: string; sound: string; unavailable?: string };

const POSTER_MS = 1500;

/** Lecteur en boucle, son coupé au départ. Sans source, ou si la lecture échoue : titre sur la surface, pas une plaque noire. */
export function DemoStage({ asset, url, title, copy, height, preferPlay = true, quiet = false, syncMs = null, hold = false }: { asset: string | null; url: string | null; title: string; copy: Copy; height?: number; preferPlay?: boolean; quiet?: boolean; syncMs?: number | null; hold?: boolean }) {
  const local = videoModule(asset);
  const source: VideoSource | null = local != null ? local : url ? { uri: url } : null;
  if (!source) return <Poster title={title} note={copy.unavailable} height={height ?? 220} />;
  return <Player key={`${asset ?? ''}|${url ?? ''}`} source={source} title={title} copy={copy} height={height} preferPlay={preferPlay} quiet={quiet} syncMs={syncMs} hold={hold} />;
}

function Poster({ title, note, height, busy = false }: { title: string; note?: string; height: number; busy?: boolean }) {
  return (
    <View accessibilityLabel={note ? `${title}. ${note}` : title} style={{ width: '100%', height, borderRadius: 20, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 }}>
      {busy ? <ActivityIndicator color={t.primary} /> : null}
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 18, textAlign: 'center' }}>{title}</Text>
      {note ? <Text style={{ color: t.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' }}>{note}</Text> : null}
    </View>
  );
}

function Player({ source, title, copy, height, preferPlay, quiet, syncMs, hold }: { source: VideoSource; title: string; copy: Copy; height?: number; preferPlay: boolean; quiet: boolean; syncMs: number | null; hold: boolean }) {
  const tv = isTv();
  const window = useWindowDimensions();
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    try { p.play(); } catch { /* le poster reste */ }
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const failed = videoPlaybackFailed(status);
  const [reveal, setReveal] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const lastSeek = useRef(0);
  useEffect(() => {
    if (failed || status === 'readyToPlay') return undefined;
    const id = setTimeout(() => setReveal(true), POSTER_MS);
    return () => clearTimeout(id);
  }, [failed, status]);
  useEffect(() => {
    if (!failed) return;
    try { player.pause(); } catch { /* déjà arrêté */ }
  }, [failed, player]);
  useEffect(() => {
    if (!quiet || failed) return;
    try {
      if (hold) player.pause();
      else player.play();
    } catch { /* le poster couvre l’échec */ }
  }, [failed, hold, player, quiet]);
  useEffect(() => {
    if (!quiet || failed || syncMs == null) return;
    let here = Number.NaN;
    try { here = player.currentTime * 1000; } catch { return; }
    const now = Date.now();
    if (!shouldSeekMedia(here, syncMs, now, lastSeek.current)) return;
    lastSeek.current = now;
    try { player.currentTime = syncMs / 1000; } catch { /* l’horloge continue */ }
  }, [failed, player, quiet, syncMs]);
  const videoHeight = height ?? (tv ? Math.max(420, Math.round(window.height * 0.62)) : Math.min(420, Math.round(window.width * 9 / 16)));
  const poster = showVideoPoster(status, reveal);
  const toggle = () => {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  };
  const toggleMute = () => {
    const next = !muted;
    player.muted = next;
    setMuted(next);
  };
  return (
    <View style={{ gap: 16 }} accessibilityLabel={title}>
      <View style={{ width: '100%', height: videoHeight, borderRadius: 20, overflow: 'hidden', backgroundColor: t.surfaceAlt }}>
        {failed ? null : (
          <VideoView
            player={player}
            nativeControls={false}
            contentFit="contain"
            allowsPictureInPicture={false}
            style={{ width: '100%', height: '100%', backgroundColor: t.surfaceAlt }}
          />
        )}
        {poster ? (
          <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
            <Poster title={title} note={failed ? copy.unavailable : undefined} height={videoHeight} busy={!failed && !reveal} />
          </View>
        ) : null}
      </View>
      {quiet || failed ? null : tv ? (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TvFocusable preferred={preferPlay} label={playing ? copy.pause : copy.play} onPress={toggle} style={{ flex: 1 }}>
            <TvText size={28} weight="800">{playing ? copy.pause : copy.play}</TvText>
          </TvFocusable>
          <TvFocusable label={muted ? copy.sound : copy.mute} onPress={toggleMute} style={{ flex: 1 }}>
            <TvText size={28} weight="800">{muted ? copy.sound : copy.mute}</TvText>
          </TvFocusable>
        </View>
      ) : (
        <Row gap={12}>
          <Button title={playing ? copy.pause : copy.play} icon={playing ? 'pause' : 'play'} onPress={toggle} style={{ flex: 1 }} />
          <Button variant="secondary" title={muted ? copy.sound : copy.mute} icon={muted ? 'volume-high' : 'volume-mute'} onPress={toggleMute} style={{ flex: 1 }} />
        </Row>
      )}
    </View>
  );
}
