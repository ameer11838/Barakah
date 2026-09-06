import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { fonts, radii, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';

/**
 * How sure the parse is, shown as a filling bar and a climbing number.
 *
 * The bar is driven on the UI thread by Reanimated. The number is counted up
 * in JS on a short interval — the UI-thread alternative (animated props on a
 * TextInput) is the clever version but it degrades on web, and a confidence
 * readout that silently stops updating is worse than one that costs a handful
 * of renders over 700ms.
 */

const COUNT_MS = 700;
const TICK_MS = 24;

/** Below this the parse is not trusted and the category picker is opened. */
export const CONFIDENCE_THRESHOLD = 0.6;

function toneFor(value: number, c: Palette) {
  if (value >= 0.8) return c.success;
  if (value >= CONFIDENCE_THRESHOLD) return c.primary;
  return c.warning;
}

function useCountUp(target: number) {
  const [shown, setShown] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    frame.current = 0;
    const steps = Math.max(1, Math.round(COUNT_MS / TICK_MS));
    const id = setInterval(() => {
      frame.current += 1;
      const p = Math.min(1, frame.current / steps);
      // Ease out so the last few percent slow down rather than snapping.
      setShown(target * (1 - Math.pow(1 - p, 3)));
      if (p >= 1) clearInterval(id);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [target]);

  return shown;
}

export function ConfidenceMeter({ value, label }: { value: number; label?: string }) {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const fill = useSharedValue(0);
  const shown = useCountUp(value);
  const tone = toneFor(value, c);

  useEffect(() => {
    fill.value = withTiming(value, {
      duration: COUNT_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [value, fill]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, fill.value)) * 100}%`,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.label}>{label ?? 'Parse confidence'}</Text>
        <Text style={[styles.value, { color: tone }]}>{Math.round(shown * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: tone }, barStyle]} />
      </View>
      {value < CONFIDENCE_THRESHOLD ? (
        <Text style={styles.hint}>Low confidence — check the category below.</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { marginTop: 12 },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    label: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted },
    value: { fontFamily: fonts.bold, fontSize: 15, letterSpacing: -0.2 },
    track: {
      height: 6,
      borderRadius: radii.pill,
      backgroundColor: c.overlay,
      marginTop: 6,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: radii.pill },
    hint: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: c.warning,
      marginTop: 6,
    },
  });
