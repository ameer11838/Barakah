import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PulseRing } from '@/components/motion/PulseRing';
import { type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { categoryIcon } from '@/lib/format';
import type { Category } from '@/types/barakah';

/**
 * A pin that can be selected, and can announce itself.
 *
 * `pulsing` is reserved for the moment a match actually lands — it is the
 * loudest thing on the map, so it fires once per event and is switched off by
 * the caller rather than left running.
 *
 * Note for whoever touches this next: animating a marker's contents only
 * shows up on iOS while the marker has `tracksViewChanges` on, which forces a
 * re-snapshot every frame. The map screen turns that on for the pulsing pin
 * and switches it back off when the burst ends. Leaving it on for every pin
 * is what makes react-native-maps demos stutter.
 */

export function RequestMapPin({
  category,
  selected = false,
  pulsing = false,
}: {
  category: Category;
  selected?: boolean;
  pulsing?: boolean;
}) {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const lift = useSharedValue(selected ? 1 : 0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    lift.value = withSpring(selected ? 1 : 0, { damping: 13, stiffness: 220 });
  }, [selected, lift]);

  useEffect(() => {
    if (!pulsing) {
      cancelAnimation(breathe);
      breathe.value = withTiming(0, { duration: 220 });
      return;
    }
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 620, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(breathe);
  }, [pulsing, breathe]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + lift.value * 0.18 + breathe.value * 0.12 }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.bubbleSlot}>
        {pulsing ? <PulseRing size={50} color={c.primary} /> : null}
        <Animated.View
          style={[styles.bubble, selected && styles.bubbleSelected, bubbleStyle]}>
          <Ionicons
            name={categoryIcon[category]}
            size={selected ? 18 : 16}
            color={c.onPrimary}
          />
        </Animated.View>
      </View>
      <View style={[styles.point, selected && styles.pointSelected]} />
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
    wrap: {
      alignItems: 'center',
    },
    /**
     * Deliberately much larger than the 40pt bubble it holds.
     *
     * A map marker clips to its own bounds, so a pulse ring that grows past the
     * marker view is not "overflowing" — it is sliced off mid-animation. The
     * slot is sized to contain the ring at full expansion (50pt * 2.3 = 115pt),
     * and the pointer below is pulled back up by a negative margin so the pin
     * still *looks* the same size. The slot is a constant so that starting and
     * stopping the pulse never changes layout and jumps the pin.
     */
    bubbleSlot: {
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubble: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
    bubbleSelected: {
      backgroundColor: c.primaryDark,
      borderWidth: 3,
    },
    point: {
      width: 0,
      height: 0,
      // Slot is 120 tall with a 40pt bubble centred in it, so the bubble's
      // bottom edge sits at 80. Pull the pointer up to meet it.
      marginTop: -42,
      borderLeftWidth: 7,
      borderRightWidth: 7,
      borderTopWidth: 10,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: c.primary,
    },
    pointSelected: {
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 11,
      borderTopColor: c.primaryDark,
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
