import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { RequestCard } from '@/components/RequestCard';
import { colors, fonts } from '@/constants/theme';
import { useBarakahStore } from '@/store/barakahStore';

type TabKey = 'requests' | 'helps';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('requests');
  const currentUserId = useBarakahStore((s) => s.currentUserId);
  const requests = useBarakahStore((s) => s.requests);

  const mine = useMemo(
    () => requests.filter((r) => r.requesterId === currentUserId),
    [requests, currentUserId]
  );
  const helping = useMemo(
    () => requests.filter((r) => r.matchedHelperId === currentUserId),
    [requests, currentUserId]
  );
  const list = tab === 'requests' ? mine : helping;

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
        <Text style={styles.sub}>Requests you made and ones you accepted.</Text>

        <View style={styles.segment}>
          <Seg label="My requests" active={tab === 'requests'} onPress={() => setTab('requests')} />
          <Seg label="My helps" active={tab === 'helps'} onPress={() => setTab('helps')} />
        </View>

        {list.length === 0 ? (
          <Text style={styles.empty}>
            {tab === 'requests'
              ? 'No requests yet. Start one from Home.'
              : 'Nothing accepted yet. Open the Map and pick a pin.'}
          </Text>
        ) : (
          list.map((r) => (
            <RequestCard key={r.id} request={r} onPress={() => router.push(`/request/${r.id}`)} />
          ))
        )}
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
  return (
    <Pressable onPress={onPress} style={[styles.segBtn, active && styles.segActive]}>
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.glassStrong,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  segActive: { backgroundColor: colors.primary },
  segText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textSecondary },
  segTextActive: { color: colors.onPrimary },
  empty: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 24,
    lineHeight: 20,
  },
});
