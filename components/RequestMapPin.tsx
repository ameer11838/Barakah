import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import { categoryIcon } from '@/lib/format';
import type { Category } from '@/types/barakah';

export function RequestMapPin({
  category,
  selected = false,
}: {
  category: Category;
  selected?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.bubble, selected && styles.bubbleSelected]}>
        <Ionicons
          name={categoryIcon[category]}
          size={selected ? 18 : 16}
          color={colors.onPrimary}
        />
      </View>
      <View style={[styles.point, selected && styles.pointSelected]} />
    </View>
  );
}

export function PlaceMapPin() {
  return (
    <View style={styles.placeBubble}>
      <Ionicons name="business-outline" size={14} color={colors.primaryDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.onPrimary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  bubbleSelected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryDark,
    borderWidth: 3,
  },
  point: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  pointSelected: {
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 11,
    borderTopColor: colors.primaryDark,
  },
  placeBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.glassStrong,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
