import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/**
 * Fade-and-rise, on a delay.
 *
 * Deliberately driven by shared values rather than Reanimated's `entering`
 * layout animations: layout animations are the prettier API but they are
 * unreliable on web and skip entirely when a parent re-mounts mid-transition.
 * This runs identically on iOS, Android and the web preview, which is the
 * whole point of using it on the demo path.
 */

/** Decelerate curve — quick to start, long settle. Reads as "arriving". */
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

type Props = ViewProps & {
  /** Milliseconds to wait before starting. Stagger a list with index * 60. */
  delay?: number;
  /** How far below its resting place the view starts. */
  distance?: number;
  duration?: number;
};

export function Reveal({
  delay = 0,
  distance = 14,
  duration = 420,
  style,
  children,
  ...rest
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: EASE }));
  }, [delay, duration, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return (
    <Animated.View style={[style, animated]} {...rest}>
      {children}
    </Animated.View>
  );
}

/** Stagger step used across the demo path so screens feel like one system. */
export const STAGGER_MS = 70;
