import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { radii, type Palette } from '@/constants/theme';
import { categoryIcon } from '@/lib/format';
import { useTheme, useThemedStyles } from '@/lib/theme';
import type { Category } from '@/types/barakah';

export function CategoryIcon({
  category,
  size = 22,
  boxed = true,
  color,
}: {
  category: Category;
  size?: number;
  boxed?: boolean;
  /** Defaults to the palette's emphasis accent for the active scheme. */
  color?: string;
}) {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const icon = (
    <Ionicons name={categoryIcon[category]} size={size} color={color ?? c.primaryDark} />
  );

  if (!boxed) return icon;

  return <View style={[styles.box, { width: size + 18, height: size + 18 }]}>{icon}</View>;
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    box: {
      borderRadius: radii.sm,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
