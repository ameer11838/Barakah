import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { RequestCard } from '@/components/RequestCard';
import { Reveal, STAGGER_MS } from '@/components/motion/Reveal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { fonts, type Palette } from '@/constants/theme';
import { requestTitle } from '@/lib/format';
import { blockedReason } from '@/lib/matching';
import { useThemedStyles } from '@/lib/theme';
import { useBarakahStore } from '@/store/barakahStore';


type TabKey = 'incoming' | 'requests' | 'helps';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const [tab, setTab] = useState<TabKey>('incoming');
  const currentUserId = useBarakahStore((s) => s.currentUserId);
  const requests = useBarakahStore((s) => s.requests);
  const me = useBarakahStore((s) => s.getCurrentUser());
  const acceptRequest = useBarakahStore((s) => s.acceptRequest);

  const incoming = useMemo(
    () =>
      requests
        .filter(
          (r) =>
            (r.status === 'open' || r.status === 'matching') &&
            r.requesterId !== currentUserId
        )
        .map((r) => ({ request: r, blocked: blockedReason(r, me) }))
        // Ones you can actually take come first.
        .sort((a, b) => Number(Boolean(a.blocked)) - Number(Boolean(b.blocked))),
    [requests, currentUserId, me]
  );

  const mine = useMemo(
    () => requests.filter((r) => r.requesterId === currentUserId),
    [requests, currentUserId]
  );
  const helping = useMemo(
    () => requests.filter((r) => r.matchedHelperId === currentUserId),
    [requests, currentUserId]
  );

  const openCount = incoming.filter((i) => !i.blocked).length;

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 120,
          paddingHorizontal: 20,
          gap: 12,
        }}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.sub}>
          You are acting as <Text style={styles.meName}>{me.name}</Text> · Tier {me.trustTier}
        </Text>

        <View style={styles.segment}>
          <Seg
            label={openCount ? `Incoming (${openCount})` : 'Incoming'}
            active={tab === 'incoming'}
            onPress={() => setTab('incoming')}
          />
          <Seg label="My requests" active={tab === 'requests'} onPress={() => setTab('requests')} />
          <Seg label="My helps" active={tab === 'helps'} onPress={() => setTab('helps')} />
        </View>

        {tab === 'incoming' ? (
          incoming.length === 0 ? (
            <Text style={styles.empty}>
              Nothing waiting. Switch to another person in Profile and send a request, then come
              back here to accept it.
            </Text>
          ) : (
            incoming.map(({ request, blocked }, i) => (
              <Reveal key={request.id} delay={i * STAGGER_MS}>
                <GlassCard>
                  <Text style={styles.cardTitle}>{requestTitle(request)}</Text>
                  <Text style={styles.cardBody}>{request.rawText}</Text>
                  <Text style={styles.meta}>
                    {request.locationText} · {request.timeWindow} · {request.urgency}
                  </Text>
                  {blocked ? (
                    <Text style={styles.blocked}>{blocked}</Text>
                  ) : (
                    <View style={styles.actions}>
                      <PillButton
                        label="Accept"
                        style={{ flex: 1 }}
                        onPress={async () => {
                          const res = await acceptRequest(request.id);
                          if (res.ok) router.push(`/request/${request.id}`);
                        }}
                      />
                      <PillButton
                        label="Details"
                        variant="secondary"
                        style={{ flex: 1 }}
                        onPress={() => router.push(`/request/${request.id}`)}
                      />
                    </View>
                  )}
                </GlassCard>
              </Reveal>
            ))
          )
        ) : null}

        {tab !== 'incoming'
          ? (() => {
              const list = tab === 'requests' ? mine : helping;
              if (list.length === 0) {
                return (
                  <Text style={styles.empty}>
                    {tab === 'requests'
                      ? 'No requests yet. Start one from Home.'
                      : 'Nothing accepted yet. Take one from Incoming or the Map.'}
                  </Text>
                );
              }
              return list.map((r, i) => (
                <Reveal key={r.id} delay={i * STAGGER_MS}>
                  <RequestCard request={r} onPress={() => router.push(`/request/${r.id}`)} />
                </Reveal>
              ));
            })()
          : null}
      </ScrollView>
    </View>
  );
}

function Seg({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable onPress={onPress} style={[styles.segBtn, active && styles.segActive]}>
      <Text style={[styles.segText, active && styles.segTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    title: { fontFamily: fonts.bold, fontSize: 28, color: c.text, letterSpacing: -0.5 },
    sub: { fontFamily: fonts.regular, fontSize: 14, color: c.textSecondary, marginBottom: 4 },
    meName: { fontFamily: fonts.semibold, color: c.primaryDark },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.glassStrong,
      borderRadius: 999,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    segBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
    segActive: { backgroundColor: c.primary },
    segText: { fontFamily: fonts.semibold, fontSize: 12, color: c.textSecondary },
    segTextActive: { color: c.onPrimary },
    cardTitle: { fontFamily: fonts.bold, fontSize: 17, color: c.text },
    cardBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 6,
      lineHeight: 20,
    },
    meta: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted, marginTop: 8 },
    blocked: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: c.warning,
      marginTop: 12,
      lineHeight: 18,
    },
    actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
    empty: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: c.textMuted,
      marginTop: 24,
      lineHeight: 20,
    },
  });
