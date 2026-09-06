import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

/** Soft wash and ambient blobs. No patterned ornament. */
export function GeometricBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <View style={styles.blobPrimary} />
      <View style={styles.blobSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { ...StyleSheet.absoluteFill, backgroundColor: colors.bg },
  blobPrimary: {
    position: 'absolute',
    top: -100,
    right: -70,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryGlow,
  },
  blobSecondary: {
    position: 'absolute',
    bottom: 120,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(20,184,166,0.10)',
  },
});
