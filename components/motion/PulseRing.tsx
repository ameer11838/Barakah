import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';

/**
 * An expanding ring, used to say "something just landed here".
 *
 * Two rings offset by half a cycle so the pulse never fully disappears
 * between beats — a single ring reads as a stutter at this duration.
 */

const CYCLE_MS = 1700;

function Ring({ size, color, phase }: { size: number; color: string; phase: number }) {
  // Every ring runs the same plain 0 -> 1 clock. The offset is applied when
  // reading it, rather than by starting the animation at a different value —
  // that keeps this independent of how withRepeat picks its start value on
  // each repetition, which is the kind of detail that quietly changes between
  // Reanimated versions and leaves a "pulse" sitting perfectly still.
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
    return () => cancelAnimation(t);
  }, [t]);

  const style = useAnimatedStyle(() => {
    const p = (t.value + phase) % 1;
    return {
      opacity: (1 - p) * 0.5,
      transform: [{ scale: 0.55 + p * 1.75 }],
    };
  });

  const styles = useThemedStyles(makeStyles);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
        style,
      ]}
    />
  );
}

export function PulseRing({
  size = 56,
  color,
  running = true,
}: {
  size?: number;
  color?: string;
  running?: boolean;
}) {
  const { palette } = useTheme();
  const tint = color ?? palette.primary;

  if (!running) return null;
  return (
    <>
      <Ring size={size} color={tint} phase={0} />
      <Ring size={size} color={tint} phase={0.5} />
    </>
  );
}

const makeStyles = (_c: Palette) =>
  StyleSheet.create({
    ring: {
      position: 'absolute',
      borderWidth: 2.5,
    },
  });
