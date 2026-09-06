import { StyleSheet, View } from 'react-native';

import { type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/lib/theme';

/** Soft wash and ambient blobs. No patterned ornament. */
export function GeometricBackdrop() {
  const styles = useThemedStyles(makeStyles);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <View style={styles.blobPrimary} />
      <View style={styles.blobSecondary} />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: { ...StyleSheet.absoluteFill, backgroundColor: c.bg },
    blobPrimary: {
      position: 'absolute',
      top: -100,
      right: -70,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: c.backdropBlobA,
    },
    blobSecondary: {
      position: 'absolute',
      bottom: 120,
      left: -90,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: c.backdropBlobB,
    },
  });
