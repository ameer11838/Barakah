import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii } from '@/constants/theme';

type Props = ViewProps & { intensity?: number; strong?: boolean };

export function GlassCard({ children, style, intensity = 40, strong, ...rest }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.base, strong ? styles.strong : styles.soft, styles.pad, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.base, styles.shadow, style]} {...rest}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[styles.pad, strong ? styles.strong : styles.soft]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
  },
  shadow: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  pad: { padding: 16 },
  soft: { backgroundColor: colors.glass },
  strong: { backgroundColor: colors.glassStrong },
});
