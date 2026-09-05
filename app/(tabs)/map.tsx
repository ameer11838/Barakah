import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapView, Marker } from '@/components/NativeMap';
import { StatusChip } from '@/components/ui/Chips';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import {
  categoryEmoji,
  categoryLabel,
  requestSnippet,
  statusLabel,
  statusTone,
} from '@/lib/format';
import { MAP_REGION } from '@/seed/paterson-icpc';
import { useBarakahStore } from '@/store/barakahStore';
import type { HelpRequest } from '@/types/barakah';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const requests = useBarakahStore((s) => s.requests);
  const currentUserId = useBarakahStore((s) => s.currentUserId);
  const acceptRequest = useBarakahStore((s) => s.acceptRequest);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openRequests = useMemo(
    () => requests.filter((r) => r.status === 'open' || r.status === 'matching'),
    [requests]
  );
  const selected = openRequests.find((r) => r.id === selectedId) ?? null;

  return (
    <View style={styles.root}>
      {Platform.OS === 'web' ? (
        <View style={[styles.webFallback, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.webTitle}>Map · ICPC Paterson</Text>
          <Text style={styles.webSub}>Open needs around Derrom Ave</Text>
          {openRequests.map((r) => (
            <Pressable key={r.id} onPress={() => setSelectedId(r.id)} style={{ marginTop: 10 }}>
              <GlassCard strong={selectedId === r.id}>
                <Text style={styles.pinTitle}>
                  {categoryEmoji[r.category]} {categoryLabel(r.category)}
                </Text>
                <Text style={styles.pinBody}>{requestSnippet(r)}</Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      ) : (
        <MapView style={StyleSheet.absoluteFill} initialRegion={MAP_REGION}>
          {openRequests.map((r) => (
            <Marker
              key={r.id}
              coordinate={r.location}
              title={categoryLabel(r.category)}
              description={r.locationText}
              onPress={() => setSelectedId(r.id)}
            />
          ))}
        </MapView>
      )}

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 90 }]}>
        {selected ? (
          <SelectedSheet
            request={selected}
            isMine={selected.requesterId === currentUserId}
            onAccept={() => {
              const res = acceptRequest(selected.id);
              if (res.ok) router.push(`/request/${selected.id}`);
            }}
            onOpen={() => router.push(`/request/${selected.id}`)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <GlassCard strong>
            <Text style={styles.sheetTitle}>Nearby requests</Text>
            <Text style={styles.sheetBody}>
              Tap a pin around ICPC to help. Your own asks stay under Activity.
            </Text>
          </GlassCard>
        )}
      </View>
    </View>
  );
}

function SelectedSheet({
  request,
  isMine,
  onAccept,
  onOpen,
  onClose,
}: {
  request: HelpRequest;
  isMine: boolean;
  onAccept: () => void;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <GlassCard strong>
      <View style={styles.sheetTop}>
        <Text style={styles.sheetTitle}>
          {categoryEmoji[request.category]} {categoryLabel(request.category)}
        </Text>
        <StatusChip label={statusLabel(request.status)} tone={statusTone(request.status)} />
      </View>
      <Text style={styles.sheetBody}>{requestSnippet(request)}</Text>
      <Text style={styles.meta}>
        {request.locationText} · {request.timeWindow}
      </Text>
      {request.aiMatchReason ? (
        <Text style={styles.reason}>Match reason: {request.aiMatchReason}</Text>
      ) : null}
      <View style={styles.actions}>
        {!isMine ? <PillButton label="Accept" onPress={onAccept} style={{ flex: 1 }} /> : null}
        <PillButton
          label={isMine ? 'View' : 'Details'}
          variant="secondary"
          onPress={onOpen}
          style={{ flex: 1 }}
        />
        <PillButton label="Close" variant="ghost" onPress={onClose} />
      </View>
      {isMine ? (
        <Text style={styles.note}>This is your request — track it in Activity.</Text>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  webFallback: { flex: 1, paddingHorizontal: 20 },
  webTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  webSub: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  pinTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  pinBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  sheet: { position: 'absolute', left: 16, right: 16, bottom: 0 },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, flex: 1 },
  sheetBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 8 },
  reason: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
    marginTop: 10,
    lineHeight: 18,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  note: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 10 },
});
