import { useCallback } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * A press that answers back.
 *
 * The whole micro-interaction layer is this: touch down shrinks the target
 * slightly, release springs it back. It is the cheapest possible signal that
 * the app is alive, and it is applied to every primary control on the demo
 * path so nothing feels dead under a finger.
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IN = { damping: 22, stiffness: 420, mass: 0.6 };
const OUT = { damping: 14, stiffness: 260, mass: 0.7 };

type Props = PressableProps & {
  /** How far in to squeeze. 0.97 for large surfaces, 0.93 for small ones. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
};

export function PressScale({ scaleTo = 0.96, style, children, disabled, ...rest }: Props) {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(scaleTo, IN);
  }, [disabled, scale, scaleTo]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, OUT);
  }, [scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[style, animated]}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
}
