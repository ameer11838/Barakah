import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii } from '@/constants/theme';

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
}

export function StatusChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'primary' | 'warning';
}) {
  const bg =
    tone === 'success'
      ? colors.successSoft
      : tone === 'primary'
        ? colors.primarySoft
        : tone === 'warning'
          ? 'rgba(216,155,44,0.16)'
          : 'rgba(26,35,50,0.06)';
  const fg =
    tone === 'success'
      ? colors.success
      : tone === 'primary'
        ? colors.primaryDark
        : tone === 'warning'
          ? colors.warning
          : colors.textSecondary;

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  chipText: { fontFamily: fonts.medium, fontSize: 12 },
});
