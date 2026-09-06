import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { GlassCard } from '@/components/ui/GlassCard';
import { fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/lib/theme';
import { categoryLabel } from '@/lib/format';
import { useBarakahStore } from '@/store/barakahStore';

export default function PartnersScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const partners = useBarakahStore((s) => s.partners);

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
          gap: 14,
        }}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Partners</Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.close}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.sub}>Places near you that work with Barakah.</Text>

        {partners.map((p) => (
          <GlassCard key={p.id} strong>
            <Text style={styles.eyebrow}>{p.type === 'institution' ? 'Institution' : 'Business'}</Text>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.meta}>
              Helps with {p.categories.map(categoryLabel).join(', ')}
            </Text>
            {p.standingOffer ? (
              <Text style={styles.offer}>{p.standingOffer}</Text>
            ) : (
              <Text style={styles.meta}>Handles community verification</Text>
            )}
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontFamily: fonts.bold, fontSize: 28, color: c.text, letterSpacing: -0.5 },
    close: { fontFamily: fonts.semibold, fontSize: 16, color: c.primary },
    sub: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 21,
      marginBottom: 4,
    },
    eyebrow: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: c.primaryDark,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 4,
    },
    name: { fontFamily: fonts.bold, fontSize: 18, color: c.text },
    meta: { fontFamily: fonts.regular, fontSize: 13, color: c.textMuted, marginTop: 6 },
    offer: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 20,
      marginTop: 10,
    },
  });
