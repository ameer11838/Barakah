import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import { categoryLabel } from '@/lib/format';
import { useBarakahStore } from '@/store/barakahStore';
import { ALL_CATEGORIES, CATEGORY_MIN_TIER } from '@/types/barakah';

export default function HelpSettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useBarakahStore((s) => s.getCurrentUser());
  const partners = useBarakahStore((s) => s.partners);
  const toggleCategoryOffered = useBarakahStore((s) => s.toggleCategoryOffered);
  const submitIdVerification = useBarakahStore((s) => s.submitIdVerification);
  const approveVerification = useBarakahStore((s) => s.approveVerification);

  const icpc = partners.find((p) => p.id === 'partner-icpc');

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
          <Text style={styles.title}>Help settings</Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.close}>Back</Text>
          </Pressable>
        </View>

        <GlassCard>
          <Text style={styles.section}>I can help with</Text>
          {ALL_CATEGORIES.map((cat) => {
            const locked = CATEGORY_MIN_TIER[cat] > user.trustTier;
            const on = user.categoriesOffered.includes(cat);
            return (
              <View key={cat} style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>{categoryLabel(cat)}</Text>
                  <Text style={styles.meta}>
                    {locked
                      ? `Needs Tier ${CATEGORY_MIN_TIER[cat]}${
                          cat === 'childcare' || cat === 'elder_transport'
                            ? ' (ICPC only in this demo)'
                            : ''
                        }`
                      : 'Available'}
                  </Text>
                </View>
                <Switch
                  value={on && !locked}
                  disabled={locked}
                  onValueChange={() => toggleCategoryOffered(cat)}
                  trackColor={{ true: colors.primary, false: '#c5d0cc' }}
                />
              </View>
            );
          })}
        </GlassCard>

        <GlassCard>
          <Text style={styles.section}>Verification</Text>
          <Text style={styles.meta}>
            Status: {user.verificationStatus}
            {icpc ? ` · Partner: ${icpc.name}` : ''}
          </Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            <PillButton
              label="Upload ID (demo)"
              variant="secondary"
              onPress={submitIdVerification}
            />
            <PillButton label="Approve Tier 2 (demo)" onPress={approveVerification} />
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, letterSpacing: -0.5 },
  close: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primary },
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: 8 },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  toggleLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
});
