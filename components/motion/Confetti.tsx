import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { type Palette } from '@/constants/theme';
import { useTheme } from '@/lib/theme';

/**
 * The one celebration in the app.
 *
 * Fires when points actually post — not on every confirm, and not on a
 * Tier 3 completion that earns nothing. A reward animation that plays when
 * no reward was given teaches people to distrust it.
 *
 * Hand-rolled rather than pulled from a library: it is ~60 lines of transform
 * maths against Reanimated, which is already a dependency, and it avoids
 * adding a package to the demo bundle for four seconds of screen time.
 */

const PIECE_COUNT = 18;
const DURATION_MS = 1800;
const GRAVITY = 900;

/** Confetti reads as celebration only if it stays bright against the ground
 *  it lands on, so the colours come from the active scheme like everything
 *  else rather than being frozen at light-mode values. */
const pieceColors = (c: Palette) => [
  c.primary,
  c.primaryMuted,
  c.primaryDark,
  c.warning,
  c.success,
];

type Spec = {
  color: string;
  size: number;
  vx: number;
  vy: number;
  spin: number;
  delay: number;
  radius: number;
};

function Piece({ spec }: { spec: Spec }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      spec.delay,
      withTiming(1, { duration: DURATION_MS, easing: Easing.linear })
    );
  }, [spec.delay, t]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    // Projectile motion: constant horizontal drift, upward launch, gravity.
    const x = spec.vx * p;
    const y = spec.vy * p + 0.5 * GRAVITY * p * p;
    // Hold full opacity for the first two-thirds, then fade out.
    const opacity = p < 0.66 ? 1 : Math.max(0, 1 - (p - 0.66) / 0.34);
    return {
      opacity,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${spec.spin * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: spec.size,
          height: spec.size * 0.6,
          borderRadius: spec.radius,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

/**
 * Mount this when the moment happens and unmount it when `onDone` fires.
 * It renders nothing interactive and never blocks touches.
 */
export function Confetti({ onDone }: { onDone?: () => void }) {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();

  // Randomised once per burst. Recomputing on re-render would restart pieces
  // mid-flight and turn the burst into a flicker.
  const specs = useMemo<Spec[]>(
    () => {
      const paint = pieceColors(palette);
      return Array.from({ length: PIECE_COUNT }, (_, i) => {
        // Fan the launch angles across the upper half, biased to vertical.
        const spread = (i / (PIECE_COUNT - 1)) * 2 - 1;
        return {
          color: paint[i % paint.length],
          size: 8 + Math.random() * 6,
          vx: spread * (90 + Math.random() * Math.min(160, width * 0.35)),
          vy: -(320 + Math.random() * 220),
          spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
          delay: Math.random() * 140,
          radius: Math.random() > 0.5 ? 2 : 6,
        };
      });
    },
    [width, palette]
  );

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), DURATION_MS + 220);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View pointerEvents="none" style={styles.host}>
      {specs.map((spec, i) => (
        <Piece key={i} spec={spec} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  piece: { position: 'absolute' },
});
