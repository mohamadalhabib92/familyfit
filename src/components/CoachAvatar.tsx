import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { coachById, type Coach } from '@/lib/coaches';
import type { CoachId } from '@/lib/workoutEngine';
import { useReduceMotion } from '@/ui/motion';
// Les visages sont des formes simples, pas des personnages existants.

/**
 * Avatars originaux : formes géométriques dessinées pour FamilyFit.
 * Aucun personnage sous copyright. Le mouvement est un léger balancement, coupé si l’utilisateur réduit les animations.
 */
export function CoachAvatar({ coachId, size = 120 }: { coachId: CoachId; size?: number }) {
  const coach = coachById(coachId);
  const reduce = useReduceMotion();
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      bob.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, reduce]);
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  return (
    <Animated.View accessibilityRole="image" accessibilityLabel={coach.name} style={{ width: size, height: size, transform: [{ translateY }] }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="56" fill={coach.tint} />
        <Face coach={coach} />
      </Svg>
    </Animated.View>
  );
}

function Face({ coach }: { coach: Coach }) {
  if (coach.id === 'noor') {
    return (
      <>
        <Ellipse cx="60" cy="58" rx="26" ry="30" fill={coach.ink} />
        <Path d="M34 46c8-16 44-16 52 0" stroke="#F6F4EF" strokeWidth="4" fill="none" />
        <Circle cx="50" cy="58" r="3" fill="#F6F4EF" />
        <Circle cx="70" cy="58" r="3" fill="#F6F4EF" />
        <Path d="M50 74c6 6 14 6 20 0" stroke="#F6F4EF" strokeWidth="3" fill="none" />
      </>
    );
  }
  if (coach.id === 'pico') {
    return (
      <>
        <Circle cx="60" cy="62" r="30" fill={coach.ink} />
        <Circle cx="48" cy="58" r="5" fill="#F6F4EF" />
        <Circle cx="72" cy="58" r="5" fill="#F6F4EF" />
        <Path d="M46 74c8 10 20 10 28 0" stroke="#F6F4EF" strokeWidth="4" fill="none" />
        <Path d="M86 30l6 8-8 2z" fill={coach.ink} />
      </>
    );
  }
  if (coach.id === 'sami') {
    return (
      <>
        <Rect x="38" y="34" width="44" height="48" rx="18" fill={coach.ink} />
        <Circle cx="52" cy="54" r="3" fill="#F6F4EF" />
        <Circle cx="68" cy="54" r="3" fill="#F6F4EF" />
        <Path d="M50 70h20" stroke="#F6F4EF" strokeWidth="3" />
        <Path d="M78 78c10 8 16 8 22-2" stroke={coach.ink} strokeWidth="4" fill="none" />
      </>
    );
  }
  return (
    <>
      <Circle cx="60" cy="50" r="22" fill={coach.ink} />
      <Path d="M36 86c6-16 42-16 48 0" fill={coach.ink} />
      <Circle cx="52" cy="48" r="3" fill="#F6F4EF" />
      <Circle cx="68" cy="48" r="3" fill="#F6F4EF" />
      <Path d="M52 60c5 5 11 5 16 0" stroke="#F6F4EF" strokeWidth="3" fill="none" />
    </>
  );
}

