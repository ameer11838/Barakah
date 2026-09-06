import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { Confetti } from '@/components/motion/Confetti';
import { Reveal, STAGGER_MS } from '@/components/motion/Reveal';
import { Avatar, StatusChip } from '@/components/ui/Chips';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { fonts, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { formatConfidence, requestTitle, statusLabel, statusTone } from '@/lib/format';
import { blockedReason } from '@/lib/matching';
import { POINTS_PER_HELP, useBarakahStore } from '@/store/barakahStore';
import { POINTS_EXCLUDED } from '@/types/barakah';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const request = useBarakahStore((s) => s.requests.find((r) => r.id === id));
  const currentUserId = useBarakahStore((s) => s.currentUserId);
  const getUser = useBarakahStore((s) => s.getUser);
  const acceptRequest = useBarakahStore((s) => s.acceptRequest);
  const confirmCompletion = useBarakahStore((s) => s.confirmCompletion);
  const submitRating = useBarakahStore((s) => s.submitRating);
  const escalateToPartner = useBarakahStore((s) => s.escalateToPartner);
  const partners = useBarakahStore((s) => s.partners);
  const me = useBarakahStore((s) => s.getCurrentUser());
  const ratings = useBarakahStore((s) => s.ratings);

  const escalationPartner = partners.find((p) => p.isEscalationPartner);

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  /**
   * Fire the celebration on the transition into 'completed', not on the state
   * itself — otherwise re-opening a finished request replays the confetti and
   * the moment stops meaning anything. Tier 3 categories earn no points, so
   * they get the confirmation without the fanfare.
   */
  const earnsPoints = request ? !POINTS_EXCLUDED.includes(request.category) : false;
  const prevStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const before = prevStatus.current;
    prevStatus.current = request?.status;
    if (before && before !== 'completed' && request?.status === 'completed' && earnsPoints) {
      setCelebrate(true);
    }
  }, [request?.status, earnsPoints]);

  if (!request) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingHorizontal: 20 }]}>
        <Text style={styles.title}>Request not found</Text>
        <PillButton label="Go back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isRequester = request.requesterId === currentUserId;
  const blocked = blockedReason(request, me);
  const isHelper = request.matchedHelperId === currentUserId;
  const helper = request.matchedHelperId ? getUser(request.matchedHelperId) : undefined;
  const alreadyRated = ratings.some(
    (r) => r.requestId === request.id && r.fromUserId === currentUserId
  );

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
          <Text style={styles.title}>Request</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.close}>Back</Text>
          </Pressable>
        </View>

        <GlassCard strong>
          <View style={styles.row}>
            <CategoryIcon category={request.category} size={26} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{requestTitle(request)}</Text>
              <StatusChip
                label={statusLabel(request.status)}
                tone={statusTone(request.status)}
              />
            </View>
          </View>
          <Text style={styles.body}>{request.rawText}</Text>
          <Text style={styles.meta}>
            {request.locationText} · {request.timeWindow} · {request.urgency}
          </Text>
          <Text style={styles.meta}>Parse confidence {formatConfidence(request.confidence)}</Text>
          {request.preference ? <Text style={styles.meta}>Preference: {request.preference}</Text> : null}
        </GlassCard>

        {request.status === 'matching' || request.status === 'open' ? (
          <GlassCard>
            <Text style={styles.section}>Matching</Text>
            <Text style={styles.body}>
              {isRequester
                ? 'Waiting for a helper nearby. Switch person in Profile to accept it from the other side, or send it to a partner.'
                : 'This request is open.'}
            </Text>
            {!isRequester ? (
              blocked ? (
                <Text style={styles.warnBlocked}>{blocked}</Text>
              ) : (
                <PillButton
                  label="Accept request"
                  onPress={() => void acceptRequest(request.id)}
                  style={{ marginTop: 12 }}
                />
              )
            ) : (
              <PillButton
                label={`Send to ${escalationPartner?.name ?? "a partner"}`}
                variant="secondary"
                onPress={() => void escalateToPartner(request.id)}
                style={{ marginTop: 12 }}
              />
            )}
          </GlassCard>
        ) : null}

        {helper ? (
          <GlassCard>
            <Text style={styles.section}>Matched helper</Text>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Avatar name={helper.name} color={helper.avatarColor} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{helper.name}</Text>
                <View style={styles.helperMeta}>
                  <Text style={styles.metaInline}>Tier {helper.trustTier}</Text>
                  {helper.isNewHelper ? (
                    <Text style={styles.metaInline}> · New helper</Text>
                  ) : helper.ratingAvg != null ? (
                    <View style={styles.ratingInline}>
                      <Text style={styles.metaInline}> · {helper.ratingAvg.toFixed(1)} </Text>
                      <Ionicons name="star" size={12} color={c.warning} />
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            {request.aiMatchReason ? (
              <Text style={styles.reason}>{request.aiMatchReason}</Text>
            ) : null}
          </GlassCard>
        ) : null}

        {(request.status === 'matched' || request.status === 'in_progress') &&
        (isRequester || isHelper) ? (
          <GlassCard>
            <Text style={styles.section}>Completion</Text>
            <Text style={styles.body}>
              After the help, both people confirm. Points post when both confirm (not for
              childcare or elder transport).
            </Text>
            <Text style={styles.meta}>
              Requester: {request.requesterConfirmed ? 'confirmed' : 'pending'} · Helper:{' '}
              {request.helperConfirmed ? 'confirmed' : 'pending'}
            </Text>
            <PillButton
              label={
                (isRequester && request.requesterConfirmed) ||
                (isHelper && request.helperConfirmed)
                  ? 'Waiting on the other person'
                  : 'Confirm completion'
              }
              onPress={() => confirmCompletion(request.id)}
              disabled={
                (isRequester && request.requesterConfirmed) ||
                (isHelper && request.helperConfirmed)
              }
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        ) : null}

        {request.status === 'completed' && earnsPoints ? (
          <Reveal delay={STAGGER_MS} distance={16}>
            <GlassCard strong>
              <View style={styles.row}>
                <View style={styles.pointsBadge}>
                  <Ionicons name="sparkles" size={18} color={c.onPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>+{POINTS_PER_HELP} points</Text>
                  <Text style={styles.metaInline}>Both sides confirmed the help.</Text>
                </View>
              </View>
            </GlassCard>
          </Reveal>
        ) : null}

        {request.status === 'completed' && (isRequester || isHelper) && !alreadyRated ? (
          <GlassCard>
            <Text style={styles.section}>Rate</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
                  <Ionicons
                    name={n <= stars ? 'star' : 'star-outline'}
                    size={28}
                    color={n <= stars ? c.warning : c.textMuted}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Optional short comment"
              placeholderTextColor={c.textMuted}
              style={styles.comment}
            />
            <PillButton
              label="Submit rating"
              onPress={() => {
                submitRating(request.id, stars, comment);
                router.replace('/activity');
              }}
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        ) : null}
      </ScrollView>
      {celebrate ? <Confetti onDone={() => setCelebrate(false)} /> : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontFamily: fonts.bold, fontSize: 28, color: c.text, letterSpacing: -0.5 },
    close: { fontFamily: fonts.semibold, fontSize: 16, color: c.primary },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: c.text },
    body: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 21,
      marginTop: 10,
    },
    meta: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted, marginTop: 8 },
    helperMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
    metaInline: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted },
    ratingInline: { flexDirection: 'row', alignItems: 'center' },
    section: { fontFamily: fonts.bold, fontSize: 16, color: c.text },
    reason: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: c.primaryDark,
      marginTop: 10,
      lineHeight: 18,
    },
    pointsBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    warnBlocked: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: c.warning,
      marginTop: 12,
      lineHeight: 18,
    },
    stars: { flexDirection: 'row', gap: 8, marginTop: 10 },
    comment: {
      marginTop: 12,
      borderRadius: 14,
      backgroundColor: c.inputBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: c.text,
    },
  });
