import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { videoModule } from '@/components/moves/media';
import { TvFocusable, TvText } from '@/components/tv/focus';
import { isTv } from '@/lib/platform';
import { Button, Row } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

type Copy = { play: string; pause: string; mute: string; sound: string };

/** Lecteur en boucle, son coupé au départ. Le module n’est monté que s’il y a une source. */
export function DemoStage({ asset, url, title, copy, height, preferPlay = true }: { asset: string | null; url: string | null; title: string; copy: Copy; height?: number; preferPlay?: boolean }) {
  const local = videoModule(asset);
  const source: VideoSource | null = local != null ? local : url ? { uri: url } : null;
  if (!source) return null;
  return <Player key={`${asset ?? ''}|${url ?? ''}`} source={source} title={title} copy={copy} height={height} preferPlay={preferPlay} />;
}

function Player({ source, title, copy, height, preferPlay }: { source: VideoSource; title: string; copy: Copy; height?: number; preferPlay: boolean }) {
  const tv = isTv();
  const window = useWindowDimensions();
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const videoHeight = height ?? (tv ? Math.max(420, Math.round(window.height * 0.62)) : Math.min(420, Math.round(window.width * 9 / 16)));
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
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="contain"
        allowsPictureInPicture={false}
        style={{ width: '100%', height: videoHeight, borderRadius: 20, backgroundColor: '#1D2522' }}
      />
      {tv ? (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TvFocusable preferred={preferPlay} label={playing ? copy.pause : copy.play} onPress={toggle} style={{ flex: 1 }}>
            <TvText size={28} weight="800" color="#1D2522">{playing ? copy.pause : copy.play}</TvText>
          </TvFocusable>
          <TvFocusable label={muted ? copy.sound : copy.mute} onPress={toggleMute} style={{ flex: 1 }}>
            <TvText size={28} weight="800" color="#1D2522">{muted ? copy.sound : copy.mute}</TvText>
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
