import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { Avatar, StatusChip } from '@/components/ui/Chips';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import { emailConfigured, emailProviderName } from '@/lib/email';
import { useBarakahStore } from '@/store/barakahStore';
import { BADGE_LABELS } from '@/types/barakah';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useBarakahStore((s) => s.getCurrentUser());
  const resetDemo = useBarakahStore((s) => s.resetDemo);
  const updateProfile = useBarakahStore((s) => s.updateProfile);
  const useDeviceLocation = useBarakahStore((s) => s.useDeviceLocation);
  const community = useBarakahStore((s) => s.community);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? '');
  const [locating, setLocating] = useState(false);

  const emailInvalid = email.trim().length > 0 && !email.includes('@');

  function save() {
    if (emailInvalid) return;
    updateProfile({ name, email });
    setEditing(false);
  }

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
              <Text style={styles.meta}>{user.email ?? 'No email on file'}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <StatusChip label={`Tier ${user.trustTier}`} tone="primary" />
                {user.isNewHelper ? <StatusChip label="New helper" tone="warning" /> : null}
              </View>
            </View>
            <Pressable onPress={() => setEditing((v) => !v)} hitSlop={10}>
              <Ionicons
                name={editing ? 'close' : 'create-outline'}
                size={20}
                color={colors.primary}
              />
            </Pressable>
          </View>

          {editing ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <Text style={styles.meta}>
                {emailInvalid
                  ? 'That does not look like an email address.'
                  : emailConfigured()
                    ? `Accept and completion notices are emailed here via ${emailProviderName()}.`
                    : 'Notices appear in the app. Add an email provider key to also send email.'}
              </Text>
              <PillButton
                label="Save"
                onPress={save}
                disabled={emailInvalid}
                style={{ marginTop: 12 }}
              />
            </View>
          ) : null}

          <View style={styles.stats}>
            <Stat label="Points" value={String(user.points)} />
            <Stat label="Helps" value={String(user.completedHelps)} />
            <Stat
              label="Rating"
              value={user.ratingAvg != null ? user.ratingAvg.toFixed(1) : 'n/a'}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.section}>Your area</Text>
          <Text style={styles.meta}>
            Barakah is not tied to one masjid or city. Set your location and the community
            re-centres around you.
          </Text>
          <View style={styles.areaRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.areaLabel}>{community.label}</Text>
          </View>
          <PillButton
            label={locating ? 'Locating...' : 'Use my location'}
            variant="ghost"
            disabled={locating}
            onPress={async () => {
              setLocating(true);
              try {
                await useDeviceLocation();
              } finally {
                setLocating(false);
              }
            }}
          />
        </GlassCard>

        <GlassCard>
          <Text style={styles.section}>Badges</Text>
          <View style={styles.badges}>
            {user.badges.length ? (
              user.badges.map((b) => (
                <StatusChip key={b} label={BADGE_LABELS[b] ?? b} tone="success" />
              ))
            ) : (
              <Text style={styles.meta}>Complete one help to get a badge.</Text>
            )}
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.section}>More</Text>
          <NavRow label="Help settings" hint="Categories & verification" href="/help-settings" />
          <NavRow label="Partners" hint="Local institutions & offers" href="/partners" />
          <NavRow label="Notifications" hint="What was sent, and how" href="/notifications" />
        </GlassCard>

        <PillButton label="Reset demo data" variant="ghost" onPress={resetDemo} />
      </ScrollView>
    </View>
  );
}

function NavRow({
  label,
  hint,
  href,
}: {
  label: string;
  hint: string;
  href: '/help-settings' | '/partners' | '/notifications';
}) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={styles.navRow}
      accessibilityRole="button">
      <View style={{ flex: 1 }}>
        <Text style={styles.navLabel}>{label}</Text>
        <Text style={styles.meta}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
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
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  navLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  input: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 10 },
  areaLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
});
