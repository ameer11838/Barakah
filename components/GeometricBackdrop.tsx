import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

/** Hand-authored star lattice at low opacity — not generative wallpaper. */
export function GeometricBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <View style={styles.blob} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="starTile" width="48" height="48" patternUnits="userSpaceOnUse">
            <Path
              d="M24 8 L26.5 18.5 L37 18.5 L28.5 24.5 L31.5 35 L24 29 L16.5 35 L19.5 24.5 L11 18.5 L21.5 18.5 Z"
              fill={colors.primary}
              opacity={0.1}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#starTile)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { ...StyleSheet.absoluteFill, backgroundColor: colors.bg },
  blob: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(91,124,255,0.16)',
  },
});
