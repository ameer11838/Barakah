import { StyleSheet, Text, View } from 'react-native';

import { fonts, radii, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';

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
      {/* The avatar colour is a saturated brand hue in both schemes, so the
          initials stay white rather than following the palette. */}
      <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: size * 0.34 }}>
        {initials}
      </Text>
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
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const bg =
    tone === 'success'
      ? c.successSoft
      : tone === 'primary'
        ? c.primarySoft
        : tone === 'warning'
          ? c.warningSoft
          : c.overlay;
  const fg =
    tone === 'success'
      ? c.success
      : tone === 'primary'
        ? c.primaryDark
        : tone === 'warning'
          ? c.warning
          : c.textSecondary;

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (_c: Palette) =>
  StyleSheet.create({
    chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
    chipText: { fontFamily: fonts.medium, fontSize: 12 },
  });
