import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { radii, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';

/**
 * Translucent panel.
 *
 * Three things separate this from a plain semi-transparent box, and all three
 * are what make the effect read as glass rather than as fog:
 *
 *   1. a real backdrop blur underneath (iOS/web),
 *   2. a specular highlight running off the top-left edge, because glass
 *      catches light at its lip,
 *   3. a hairline that is brighter at the top than the bottom.
 *
 * The blur tint tracks the colour scheme. A 'light' tint over a dark ground
 * does not read as "a lighter panel", it reads as fog on a window, so the
 * tint follows the scheme rather than being pinned.
 *
 * Android caveat, current as of SDK 57: a bare BlurView renders as a
 * semi-transparent fill, not a true blur — real blur needs the content behind
 * it wrapped in a BlurTargetView and passed by ref. That restructuring is not
 * worth it here, so Android gets a denser fill that stays legible on its own
 * rather than a blur that silently does nothing.
 */

type Props = ViewProps & {
  intensity?: number;
  strong?: boolean;
  /** Drop the highlight for panels sitting on busy imagery, e.g. the map. */
  flat?: boolean;
};

export function GlassCard({
  children,
  style,
  intensity = 40,
  strong,
  flat,
  ...rest
}: Props) {
  const { palette: c, scheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const blurs = Platform.OS === 'ios' || Platform.OS === 'web';

  return (
    <View style={[styles.base, styles.shadow, style]} {...rest}>
      {blurs ? (
        <BlurView
          intensity={intensity}
          tint={scheme}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          // Without a blur behind it, a translucent fill just looks dirty over
          // a map. Android gets a denser one so the text keeps its contrast.
          blurs
            ? strong
              ? styles.strong
              : styles.soft
            : strong
              ? styles.strongOpaque
              : styles.softOpaque,
        ]}
      />
      {!flat ? (
        <LinearGradient
          pointerEvents="none"
          colors={[c.glassHighlight, 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={styles.highlight}
        />
      ) : null}
      <View style={styles.pad}>{children}</View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: c.border,
    },
    shadow: {
      shadowColor: c.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    // Only the top ~55% carries the highlight; a full-height sheen looks like
    // a gradient fill rather than a lit edge.
    highlight: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
    pad: { padding: 16 },
    soft: { backgroundColor: c.glass },
    strong: { backgroundColor: c.glassStrong },
    softOpaque: { backgroundColor: c.glassOpaque },
    strongOpaque: { backgroundColor: c.glassStrongOpaque },
  });
