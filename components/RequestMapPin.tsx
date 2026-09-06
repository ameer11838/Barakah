import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PulseRing } from '@/components/motion/PulseRing';
import { type Palette } from '@/constants/theme';
import { categoryIcon } from '@/lib/format';
import { useTheme, useThemedStyles } from '@/lib/theme';
import type { Category } from '@/types/barakah';

/**
 * A map pin that stays where it is put.
 *
 * The rules that keep a custom marker anchored while the map zooms:
 *
 *   1. The container is a FIXED size. Not "whatever the children add up to",
 *      and never adjusted by negative margins — react-native-maps positions a
 *      marker from its measured bounds, so bounds that shift by a pixel between
 *      renders make the pin crawl across the map as you zoom.
 *   2. Children are absolutely positioned inside those bounds, so adding or
 *      removing one cannot resize the container.
 *   3. Selection changes colour and *transform scale* only. A transform does
 *      not affect layout, so a selected pin occupies exactly the same box as an
 *      unselected one.
 *
 * With the container fixed at PIN_W x PIN_H and the tip at the bottom centre,
 * anchor={{ x: 0.5, y: 1 }} puts the tip precisely on the coordinate.
 */

const BUBBLE = 38;
const TIP_H = 9;
export const PIN_W = 44;
export const PIN_H = BUBBLE + TIP_H;

/** Pass this to <Marker anchor={...}> so the tip sits on the coordinate. */
export const PIN_ANCHOR = { x: 0.5, y: 1 } as const;

export function RequestMapPin({
  category,
  selected = false,
}: {
  category: Category;
  selected?: boolean;
}) {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const lift = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    lift.value = withSpring(selected ? 1 : 0, { damping: 13, stiffness: 220 });
  }, [selected, lift]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + lift.value * 0.16 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.bubble, selected && styles.bubbleSelected, bubbleStyle]}>
        <Ionicons name={categoryIcon[category]} size={17} color={c.onPrimary} />
      </Animated.View>
      <View style={[styles.tip, selected && styles.tipSelected]} />
    </View>
  );
}

/**
 * The match pulse, as its own decorative marker.
 *
 * It lives outside the pin on purpose. A marker clips to its own bounds, so a
 * ring that expands past the pin would be sliced off — and growing the pin's
 * box to fit the ring is exactly the kind of bounds change rule 1 forbids.
 * Rendering it as a separate, centred, non-interactive marker keeps the pin
 * small and stable while the ring gets all the room it needs.
 */
export function PulseMarkerView() {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.pulseHost} pointerEvents="none">
      <PulseRing size={56} color={c.primary} />
    </View>
  );
}

export function PlaceMapPin() {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.placeBubble}>
      <Ionicons name="business-outline" size={14} color={c.primaryDark} />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { width: PIN_W, height: PIN_H },
    bubble: {
      position: 'absolute',
      top: 0,
      left: (PIN_W - BUBBLE) / 2,
      width: BUBBLE,
      height: BUBBLE,
      borderRadius: BUBBLE / 2,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
      borderColor: c.onPrimary,
      shadowColor: c.shadow,
      shadowOpacity: 0.28,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    bubbleSelected: { backgroundColor: c.primaryDark },
    tip: {
      position: 'absolute',
      bottom: 0,
      left: PIN_W / 2 - 6,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: TIP_H,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: c.primary,
    },
    tipSelected: { borderTopColor: c.primaryDark },
    pulseHost: {
      width: 150,
      height: 150,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeBubble: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.glassStrong,
      borderWidth: 1.5,
      borderColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
  });
