import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Circle, MapView, Marker } from '@/components/NativeMap';
import { Reveal, STAGGER_MS } from '@/components/motion/Reveal';
import { PlaceMapPin, RequestMapPin } from '@/components/RequestMapPin';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { StatusChip } from '@/components/ui/Chips';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { fonts, radii, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { mapRegionFor } from '@/lib/community';
import { requestSnippet, requestTitle, statusLabel, statusTone } from '@/lib/format';
import { useBarakahStore } from '@/store/barakahStore';
import type { HelpRequest, LatLng } from '@/types/barakah';

const SHEET_CLEARANCE = 210;
/** Radius of the community ring drawn around the anchor. */
const COMMUNITY_RADIUS_METERS = 900;
/** How long the match pulse runs before the map goes quiet again. */
const PULSE_MS = 4200;

type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };
type MapHandle = { animateToRegion: (region: Region, duration?: number) => void };

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { palette: c, scheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const mapRef = useRef<MapHandle | null>(null);
  const requests = useBarakahStore((s) => s.requests);
  const currentUserId = useBarakahStore((s) => s.currentUserId);
  const acceptRequest = useBarakahStore((s) => s.acceptRequest);
  const community = useBarakahStore((s) => s.community);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // The community anchor moves once the app learns where the user actually
  // is, so the ring and the initial camera have to read it from the store
  // rather than from the seed's compile-time default.
  const anchor = community.anchor;
  const initialRegion = useMemo(() => mapRegionFor(anchor), [anchor]);

  const openRequests = useMemo(
    () => requests.filter((r) => r.status === 'open' || r.status === 'matching'),
    [requests]
  );

  const pulsed = pulseId ? requests.find((r) => r.id === pulseId) : undefined;

  /**
   * A matched request drops out of `openRequests`, so without this the pin
   * would vanish at the exact moment we want to celebrate it. Keep it on the
   * map for as long as the pulse runs.
   */
  const shownRequests = useMemo(() => {
    if (!pulsed || openRequests.some((r) => r.id === pulsed.id)) return openRequests;
    return [...openRequests, pulsed];
  }, [openRequests, pulsed]);

  const selected = shownRequests.find((r) => r.id === selectedId) ?? null;

  function choreographTo(location: LatLng) {
    if (Platform.OS === 'web') return;
    // Two beats: pull back so the viewer sees where they are being taken,
    // then settle in on the pin. A single jump reads as a teleport.
    mapRef.current?.animateToRegion(
      { ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      420
    );
    const t = setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude - 0.003,
          longitude: location.longitude,
          latitudeDelta: 0.014,
          longitudeDelta: 0.014,
        },
        720
      );
    }, 440);
    return () => clearTimeout(t);
  }

  /**
   * Watch for a request crossing into 'matched'. The previous-status map is a
   * ref so a re-render never re-fires a pulse, and an id absent from it is
   * treated as "first seen" rather than "just changed" — otherwise every
   * already-matched request would pulse on mount.
   */
  const prevStatus = useRef<Record<string, HelpRequest['status']>>({});
  useEffect(() => {
    let landed: HelpRequest | undefined;
    for (const r of requests) {
      const before = prevStatus.current[r.id];
      if (before && before !== 'matched' && r.status === 'matched') landed = r;
      prevStatus.current[r.id] = r.status;
    }
    if (!landed) return;

    setPulseId(landed.id);
    setSelectedId(null);
    const cancelCamera = choreographTo(landed.location);
    const stop = setTimeout(() => setPulseId(null), PULSE_MS);
    return () => {
      cancelCamera?.();
      clearTimeout(stop);
    };
  }, [requests]);

  // Custom marker views need a tracksViewChanges window to redraw, then freeze
  // for performance. The pulse is an animation, so it needs that window held
  // open for its whole run.
  useEffect(() => {
    if (pulseId) {
      setTracksViewChanges(true);
      return;
    }
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(t);
  }, [selectedId, shownRequests.length, pulseId]);

  useEffect(() => {
    if (!selected || Platform.OS === 'web') return;
    mapRef.current?.animateToRegion(
      {
        latitude: selected.location.latitude - 0.004,
        longitude: selected.location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      320
    );
  }, [selectedId]);

  // Drives the sheet's morph: a change of key re-runs the reveal, so the
  // panel visibly becomes something else instead of swapping text in place.
  const sheetKey = pulsed ? `matched-${pulsed.id}` : selected ? `sel-${selected.id}` : 'empty';

  return (
    <View style={styles.root}>
      {Platform.OS === 'web' ? (
        <View style={[styles.webFallback, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.webTitle}>Map near you</Text>
          <Text style={styles.webSub}>Open requests around {community.label}</Text>
          {shownRequests.map((r, i) => (
            <Reveal key={r.id} delay={i * STAGGER_MS} style={{ marginTop: 10 }}>
              <Pressable onPress={() => setSelectedId(r.id)}>
                <GlassCard strong={selectedId === r.id}>
                  <View style={styles.pinRow}>
                    <CategoryIcon category={r.category} size={18} />
                    <Text style={styles.pinTitle} numberOfLines={1}>
                      {requestTitle(r)}
                    </Text>
                  </View>
                  <Text style={styles.pinBody}>{requestSnippet(r)}</Text>
                </GlassCard>
              </Pressable>
            </Reveal>
          ))}
        </View>
      ) : (
        <MapView
          ref={mapRef as never}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
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
          userInterfaceStyle={scheme}>
          <Circle
            center={anchor}
            radius={COMMUNITY_RADIUS_METERS}
            strokeColor={c.primary}
            strokeWidth={1.5}
            fillColor="rgba(15,118,110,0.10)"
          />
          <Marker
            coordinate={anchor}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracksViewChanges}>
            <PlaceMapPin />
          </Marker>
          {shownRequests.map((r) => (
            <Marker
              key={r.id}
              coordinate={r.location}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={
                tracksViewChanges || selectedId === r.id || pulseId === r.id
              }
              onPress={() => setSelectedId(r.id)}>
              <RequestMapPin
                category={r.category}
                selected={selectedId === r.id}
                pulsing={pulseId === r.id}
              />
            </Marker>
          ))}
        </MapView>
      )}

      {Platform.OS !== 'web' ? (
        <>
          <View style={[styles.topChip, { top: insets.top + 10 }]} pointerEvents="none">
            <View style={styles.topChipInner}>
              <Text style={styles.topChipTitle}>{community.label}</Text>
              <Text style={styles.topChipSub}>{openRequests.length} open nearby</Text>
            </View>
          </View>

          <Reveal
            delay={STAGGER_MS * 2}
            style={[styles.legend, { top: insets.top + 12 }]}
            pointerEvents="none">
            <View style={styles.legendInner}>
              <LegendRow color={c.primary} label="Open request" />
              <LegendRow color={c.primaryDark} label="Selected" />
              <LegendRow color={c.primaryMuted} label="Community" ring />
            </View>
          </Reveal>
        </>
      ) : null}

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 90 }]}>
        <Reveal key={sheetKey} distance={18} duration={360}>
          {pulsed ? (
            <MatchedSheet
              request={pulsed}
              onOpen={() => router.push(`/request/${pulsed.id}`)}
            />
          ) : selected ? (
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
        </Reveal>
      </View>
    </View>
  );
}

function LegendRow({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.legendRow}>
      <View
        style={[
          styles.legendDot,
          ring
            ? { borderColor: color, borderWidth: 2, backgroundColor: 'transparent' }
            : { backgroundColor: color },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

/** Shown for the few seconds after a helper accepts. */
function MatchedSheet({ request, onOpen }: { request: HelpRequest; onOpen: () => void }) {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <GlassCard strong>
      <View style={styles.sheetTop}>
        <View style={styles.pinRow}>
          <View style={styles.matchBadge}>
            <Ionicons name="checkmark" size={14} color={c.onPrimary} />
          </View>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            Matched
          </Text>
        </View>
        <StatusChip label={statusLabel(request.status)} tone={statusTone(request.status)} />
      </View>
      <Text style={styles.sheetBody}>
        A helper accepted {requestTitle(request).toLowerCase()}. Contact details are on the
        request.
      </Text>
      {request.aiMatchReason ? (
        <Text style={styles.reason}>{request.aiMatchReason}</Text>
      ) : null}
      <PillButton label="Open request" onPress={onOpen} style={{ marginTop: 14 }} />
    </GlassCard>
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
  const styles = useThemedStyles(makeStyles);

  return (
    <GlassCard strong>
      <View style={styles.sheetTop}>
        <View style={styles.pinRow}>
          <CategoryIcon category={request.category} size={18} />
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {requestTitle(request)}
          </Text>
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    webFallback: { flex: 1, paddingHorizontal: 20 },
    webTitle: { fontFamily: fonts.bold, fontSize: 24, color: c.text },
    webSub: { fontFamily: fonts.medium, fontSize: 14, color: c.textSecondary, marginTop: 4 },
    topChip: {
      position: 'absolute',
      left: 16,
      right: 16,
      alignItems: 'flex-start',
    },
    topChipInner: {
      backgroundColor: c.glassStrong,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowColor: c.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    topChipTitle: { fontFamily: fonts.bold, fontSize: 14, color: c.text },
    topChipSub: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    legend: { position: 'absolute', right: 16 },
    legendInner: {
      backgroundColor: c.glassStrong,
      borderRadius: radii.sm,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: c.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 6,
      shadowColor: c.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { fontFamily: fonts.medium, fontSize: 11, color: c.textSecondary },
    pinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    pinTitle: { fontFamily: fonts.semibold, fontSize: 16, color: c.text, flex: 1 },
    pinBody: { fontFamily: fonts.regular, fontSize: 13, color: c.textSecondary, marginTop: 4 },
    matchBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheet: { position: 'absolute', left: 16, right: 16, bottom: 0 },
    sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    sheetTitle: { fontFamily: fonts.bold, fontSize: 18, color: c.text, flex: 1 },
    sheetBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 8,
      lineHeight: 20,
    },
    meta: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted, marginTop: 8 },
    reason: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: c.primaryDark,
      marginTop: 10,
      lineHeight: 18,
    },
    actions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
    note: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted, marginTop: 10 },
  });
