import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { Avatar, StatusChip } from '@/components/ui/Chips';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import { categoryLabel } from '@/lib/format';
import { useBarakahStore } from '@/store/barakahStore';
import { ALL_CATEGORIES, BADGE_LABELS, CATEGORY_MIN_TIER } from '@/types/barakah';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useBarakahStore((s) => s.getCurrentUser());
  const partners = useBarakahStore((s) => s.partners);
  const toggleCategoryOffered = useBarakahStore((s) => s.toggleCategoryOffered);
  const submitIdVerification = useBarakahStore((s) => s.submitIdVerification);
  const approveVerification = useBarakahStore((s) => s.approveVerification);
  const resetDemo = useBarakahStore((s) => s.resetDemo);

  const icpc = partners.find((p) => p.id === 'partner-icpc');

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 120,
          paddingHorizontal: 20,
          gap: 14,
        }}>
        <Text style={styles.title}>Profile</Text>

        <GlassCard strong>
          <View style={styles.row}>
            <Avatar name={user.name} color={user.avatarColor} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.meta}>{user.phone}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <StatusChip label={`Tier ${user.trustTier}`} tone="primary" />
                {user.isNewHelper ? <StatusChip label="New helper" tone="warning" /> : null}
              </View>
            </View>
          </View>
          <View style={styles.stats}>
            <Stat label="Points" value={String(user.points)} />
            <Stat label="Helps" value={String(user.completedHelps)} />
            <Stat
              label="Rating"
              value={user.ratingAvg != null ? user.ratingAvg.toFixed(1) : '—'}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.section}>Badges</Text>
          <View style={styles.badges}>
            {user.badges.length ? (
              user.badges.map((b) => (
                <StatusChip key={b} label={BADGE_LABELS[b] ?? b} tone="success" />
              ))
            ) : (
              <Text style={styles.meta}>Help once to earn your first badge.</Text>
            )}
          </View>
        </GlassCard>

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
                            ? ' · ICPC only in MVP'
                            : ''
                        }`
                      : 'Available'}
                  </Text>
                </View>
                <Switch
                  value={on && !locked}
                  disabled={locked}
                  onValueChange={() => toggleCategoryOffered(cat)}
                  trackColor={{ true: colors.primary, false: '#cfd6e2' }}
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

        <PillButton label="Reset demo data" variant="ghost" onPress={resetDemo} />
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, letterSpacing: -0.5 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  stats: { flexDirection: 'row', marginTop: 16, gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.primaryDark },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(26,35,50,0.08)',
  },
  toggleLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
});
