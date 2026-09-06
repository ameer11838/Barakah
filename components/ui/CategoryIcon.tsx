import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/constants/theme';
import { categoryIcon } from '@/lib/format';
import type { Category } from '@/types/barakah';

export function CategoryIcon({
  category,
  size = 22,
  boxed = true,
  color = colors.primaryDark,
}: {
  category: Category;
  size?: number;
  boxed?: boolean;
  color?: string;
}) {
  const icon = <Ionicons name={categoryIcon[category]} size={size} color={color} />;

  if (!boxed) return icon;

  return <View style={[styles.box, { width: size + 18, height: size + 18 }]}>{icon}</View>;
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
