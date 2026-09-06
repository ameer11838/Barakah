import { useCallback, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * A press that answers back.
 *
 * Touch down shrinks the target slightly, release springs it back — the
 * cheapest possible signal that the app is alive.
 *
 * Structure matters here. An earlier version animated the Pressable itself via
 * createAnimatedComponent, which puts the animation library in the middle of
 * touch handling for every button in the app. This version keeps a plain
 * Pressable on the outside doing nothing but receiving touches, and moves the
 * transform to a child view. Presses no longer depend on the animation layer
 * behaving, which is the right trade for a control that must never feel dead.
 */

const IN = { damping: 22, stiffness: 420, mass: 0.6 };
const OUT = { damping: 14, stiffness: 260, mass: 0.7 };

/**
 * The scale behaviour on its own, for callers that need to place the animated
 * view themselves (see PillButton, where the pill body is the thing that
 * squeezes but the layout box around it must not move).
 */
export function usePressScale(scaleTo = 0.96, disabled?: boolean | null) {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(scaleTo, IN);
  }, [disabled, scale, scaleTo]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, OUT);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

type Props = Omit<PressableProps, 'children'> & {
  /** How far in to squeeze. 0.97 for large surfaces, 0.93 for small ones. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  /** Plain nodes only — the render-prop form of Pressable is not supported,
   *  because the children are wrapped in the animated view. */
  children?: ReactNode;
};

export function PressScale({ scaleTo = 0.96, style, children, disabled, ...rest }: Props) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(scaleTo, disabled);

  return (
    <Pressable disabled={disabled} onPressIn={onPressIn} onPressOut={onPressOut} {...rest}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
