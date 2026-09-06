import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/lib/theme';

/** The blinking block that says output is still arriving. */
export function TypingCaret({ visible = true }: { visible?: boolean }) {
  const blink = useSharedValue(1);
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    if (!visible) return;
    blink.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 420 }),
        withTiming(1, { duration: 420 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(blink);
  }, [visible, blink]);

  const style = useAnimatedStyle(() => ({ opacity: blink.value }));

  if (!visible) return null;
  return <Animated.View style={[styles.caret, style]} />;
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    caret: {
      width: 7,
      height: 15,
      borderRadius: 1.5,
      backgroundColor: c.primary,
      marginLeft: 3,
      marginBottom: -2,
    },
  });
