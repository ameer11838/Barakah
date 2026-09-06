import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/components/motion/PressScale';
import { fonts, radii, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/lib/theme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
};

/**
 * The outer Pressable carries only the caller's layout (flex, margins) and
 * receives the touch. The pill body is a child that scales, so pressing never
 * changes the button's footprint and touch handling stays plain React Native.
 */
export function PillButton({ label, variant = 'primary', style, disabled, ...rest }: Props) {
  const styles = useThemedStyles(makeStyles);
  // Large targets need a smaller squeeze than small ones to read as equal.
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.975, disabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={style}
      {...rest}>
      <Animated.View
        style={[
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'secondary' && styles.secondary,
          variant === 'ghost' && styles.ghost,
          disabled ? styles.disabled : null,
          animatedStyle,
        ]}>
        <Text style={[styles.label, variant === 'primary' ? styles.onPrimary : styles.onLight]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 22,
    },
    primary: {
      backgroundColor: c.primary,
      shadowColor: c.primaryDark,
      shadowOpacity: 0.3,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    secondary: {
      backgroundColor: c.glassStrong,
      borderWidth: 1,
      borderColor: c.border,
    },
    ghost: { backgroundColor: 'transparent' },
    disabled: { opacity: 0.45 },
    label: { fontFamily: fonts.semibold, fontSize: 16 },
    onPrimary: { color: c.onPrimary },
    onLight: { color: c.text },
  });
