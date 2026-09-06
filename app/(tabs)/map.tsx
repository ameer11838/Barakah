import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Circle, MapView, Marker } from '@/components/NativeMap';
import { PlaceMapPin, RequestMapPin } from '@/components/RequestMapPin';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { StatusChip } from '@/components/ui/Chips';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import { requestSnippet, requestTitle, statusLabel, statusTone } from '@/lib/format';
import { ANCHOR, MAP_REGION } from '@/seed/community';
import { useBarakahStore } from '@/store/barakahStore';
import type { HelpRequest } from '@/types/barakah';

const SHEET_CLEARANCE = 210;
/** Radius of the community ring drawn around the anchor. */
const COMMUNITY_RADIUS_METERS = 900;

type MapHandle = {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    duration?: number
  ) => void;
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapHandle | null>(null);
  const requests = useBarakahStore((s) => s.requests);
  const currentUserId = useBarakahStore((s) => s.currentUserId);
  const acceptRequest = useBarakahStore((s) => s.acceptRequest);
  const community = useBarakahStore((s) => s.community);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const openRequests = useMemo(
    () => requests.filter((r) => r.status === 'open' || r.status === 'matching'),
    [requests]
  );
  const selected = openRequests.find((r) => r.id === selectedId) ?? null;

  // Custom marker views need a brief tracksViewChanges window, then freeze for perf.
  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(t);
  }, [selectedId, openRequests.length]);

  useEffect(() => {
    if (!selected || Platform.OS === 'web') return;
    mapRef.current?.animateToRegion(
      {
        latitude: selected.location.latitude - 0.004,
        longitude: selected.location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      280
    );
  }, [selectedId]);

  return (
    <View style={styles.root}>
      {Platform.OS === 'web' ? (
        <View style={[styles.webFallback, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.webTitle}>Map near you</Text>
          <Text style={styles.webSub}>Open requests around {community.label}</Text>
          {openRequests.map((r) => (
            <Pressable key={r.id} onPress={() => setSelectedId(r.id)} style={{ marginTop: 10 }}>
              <GlassCard strong={selectedId === r.id}>
                <View style={styles.pinRow}>
                  <CategoryIcon category={r.category} size={18} />
                  <Text style={styles.pinTitle} numberOfLines={1}>{requestTitle(r)}</Text>
                </View>
                <Text style={styles.pinBody}>{requestSnippet(r)}</Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      ) : (
        <MapView
          ref={mapRef as never}
          style={StyleSheet.absoluteFill}
          initialRegion={MAP_REGION}
          mapPadding={{
            top: insets.top + 56,
            right: 16,
            bottom: insets.bottom + SHEET_CLEARANCE,
            left: 16,
          }}
          showsCompass={false}
          showsPointsOfInterest={false}
          showsTraffic={false}
          showsBuildings
          toolbarEnabled={false}
          userInterfaceStyle="light">
          <Circle
            center={ANCHOR}
            radius={COMMUNITY_RADIUS_METERS}
            strokeColor={colors.primary}
            strokeWidth={1.5}
            fillColor="rgba(15,118,110,0.10)"
          />
          <Marker coordinate={ANCHOR} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={tracksViewChanges}>
            <PlaceMapPin />
          </Marker>
          {openRequests.map((r) => (
            <Marker
              key={r.id}
              coordinate={r.location}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={tracksViewChanges || selectedId === r.id}
              onPress={() => setSelectedId(r.id)}>
              <RequestMapPin category={r.category} selected={selectedId === r.id} />
            </Marker>
          ))}
        </MapView>
      )}

      {Platform.OS !== 'web' ? (
        <View style={[styles.topChip, { top: insets.top + 10 }]} pointerEvents="none">
          <View style={styles.topChipInner}>
            <Text style={styles.topChipTitle}>{community.label}</Text>
            <Text style={styles.topChipSub}>{openRequests.length} open nearby</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 90 }]}>
        {selected ? (
          <SelectedSheet
            request={selected}
            isMine={selected.requesterId === currentUserId}
            onAccept={async () => {
              const res = await acceptRequest(selected.id);
              if (res.ok) router.push(`/request/${selected.id}`);
            }}
            onOpen={() => router.push(`/request/${selected.id}`)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <GlassCard strong>
            <Text style={styles.sheetTitle}>Nearby requests</Text>
            <Text style={styles.sheetBody}>
              Tap a teal pin to help. Your own requests are on Activity.
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
        <View style={styles.pinRow}>
          <CategoryIcon category={request.category} size={18} />
          <Text style={styles.sheetTitle} numberOfLines={1}>{requestTitle(request)}</Text>
        </View>
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
        <Text style={styles.note}>This is your request. Track it on Activity.</Text>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  webFallback: { flex: 1, paddingHorizontal: 20 },
  webTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  webSub: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  topChip: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'flex-start',
  },
  topChipInner: {
    backgroundColor: colors.glassStrong,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  topChipTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  topChipSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pinTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, flex: 1 },
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
