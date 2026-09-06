import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { StatusChip } from '@/components/ui/Chips';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { fonts, radii, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { emailConfigured, emailProviderName } from '@/lib/email';
import { useBarakahStore } from '@/store/barakahStore';
import type { AppNotification, NotificationKind } from '@/types/barakah';

/**
 * What Barakah sent, and how it went.
 *
 * Deliberately shows delivery outcome per notice rather than assuming success.
 * A push can be refused at the OS level and an email can be unconfigured or
 * bounce; the app should say which happened instead of implying every notice
 * reached an inbox.
 */

const KIND_ICON: Record<NotificationKind, keyof typeof Ionicons.glyphMap> = {
  request_created: 'paper-plane-outline',
  request_accepted: 'checkmark-circle-outline',
  request_completed: 'ribbon-outline',
  escalated: 'business-outline',
};

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const currentUserId = useBarakahStore((s) => s.currentUserId);
  const notifications = useBarakahStore((s) => s.notifications);
  const markRead = useBarakahStore((s) => s.markNotificationsRead);

  const mine = notifications.filter((n) => n.userId === currentUserId);

  // Opening the screen is the read receipt.
  useEffect(() => {
    markRead();
  }, [markRead]);

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
          gap: 12,
        }}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Notifications</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        <GlassCard>
          <Text style={styles.section}>Delivery</Text>
          <Text style={styles.meta}>
            {emailConfigured()
              ? `Email is on via ${emailProviderName()}. Notices go to the address on your profile.`
              : 'Email is off. Add an EmailJS or Resend key to send these as email too — everything still appears here and as a device notification.'}
          </Text>
        </GlassCard>

        {mine.length === 0 ? (
          <GlassCard>
            <Text style={styles.section}>Nothing yet</Text>
            <Text style={styles.meta}>
              Send a request or accept one and the notice will appear here.
            </Text>
            <PillButton
              label="Request help"
              onPress={() => router.push('/request')}
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        ) : (
          mine.map((n) => <NotificationRow key={n.id} notification={n} />)
        )}
      </ScrollView>
    </View>
  );
}

function NotificationRow({ notification: n }: { notification: AppNotification }) {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <GlassCard>
      <Pressable
        onPress={() => (n.requestId ? router.push(`/request/${n.requestId}`) : undefined)}
        disabled={!n.requestId}>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Ionicons name={KIND_ICON[n.kind]} size={18} color={c.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{n.title}</Text>
            <Text style={styles.rowBody}>{n.body}</Text>
            <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
          </View>
          {!n.read ? <View style={styles.dot} /> : null}
        </View>

        {/* Channel outcomes, stated rather than assumed. */}
        <View style={styles.channels}>
          <StatusChip
            label={n.pushed ? 'Notification sent' : 'Notification off'}
            tone={n.pushed ? 'success' : 'neutral'}
          />
          {n.emailStatus === 'sent' ? (
            <StatusChip label={`Emailed ${n.emailedTo}`} tone="success" />
          ) : n.emailStatus === 'failed' ? (
            <StatusChip label="Email failed" tone="warning" />
          ) : n.emailStatus === 'skipped' ? (
            <StatusChip label="Email skipped" tone="neutral" />
          ) : null}
        </View>
      </Pressable>
    </GlassCard>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontFamily: fonts.bold, fontSize: 28, color: c.text, letterSpacing: -0.5 },
    close: { fontFamily: fonts.semibold, fontSize: 16, color: c.primary },
    section: { fontFamily: fonts.bold, fontSize: 16, color: c.text },
    meta: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: radii.sm,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTitle: { fontFamily: fonts.semibold, fontSize: 15, color: c.text },
    rowBody: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 3,
      lineHeight: 18,
    },
    time: { fontFamily: fonts.medium, fontSize: 11, color: c.textMuted, marginTop: 6 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primary,
      marginTop: 6,
    },
    channels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  });
