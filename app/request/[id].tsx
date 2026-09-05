import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { Avatar, StatusChip } from '@/components/ui/Chips';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import {
  categoryEmoji,
  categoryLabel,
  formatConfidence,
  statusLabel,
  statusTone,
} from '@/lib/format';
import { useBarakahStore } from '@/store/barakahStore';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const request = useBarakahStore((s) => s.requests.find((r) => r.id === id));
  const currentUserId = useBarakahStore((s) => s.currentUserId);
  const getUser = useBarakahStore((s) => s.getUser);
  const acceptRequest = useBarakahStore((s) => s.acceptRequest);
  const confirmCompletion = useBarakahStore((s) => s.confirmCompletion);
  const submitRating = useBarakahStore((s) => s.submitRating);
  const escalateToIcpc = useBarakahStore((s) => s.escalateToIcpc);
  const ratings = useBarakahStore((s) => s.ratings);

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  if (!request) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingHorizontal: 20 }]}>
        <Text style={styles.title}>Request not found</Text>
        <PillButton label="Go back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isRequester = request.requesterId === currentUserId;
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
            <Text style={styles.emoji}>{categoryEmoji[request.category]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{categoryLabel(request.category)}</Text>
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
                ? 'Looking for a nearby verified helper… Omar often accepts within a couple seconds in the demo.'
                : 'This request is open — you can accept it if you offer this category.'}
            </Text>
            {!isRequester ? (
              <PillButton
                label="Accept request"
                onPress={() => acceptRequest(request.id)}
                style={{ marginTop: 12 }}
              />
            ) : (
              <PillButton
                label="Escalate to ICPC"
                variant="secondary"
                onPress={() => escalateToIcpc(request.id)}
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
                <Text style={styles.meta}>
                  Tier {helper.trustTier}
                  {helper.isNewHelper
                    ? ' · New helper'
                    : helper.ratingAvg != null
                      ? ` · ${helper.ratingAvg.toFixed(1)}★`
                      : ''}
                </Text>
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
              Both sides confirm after the help happens. Points only unlock on mutual confirm
              (not for childcare / elder transport).
            </Text>
            <Text style={styles.meta}>
              Requester: {request.requesterConfirmed ? 'confirmed' : 'pending'} · Helper:{' '}
              {request.helperConfirmed ? 'confirmed' : 'pending'}
            </Text>
            <PillButton
              label={
                (isRequester && request.requesterConfirmed) ||
                (isHelper && request.helperConfirmed)
                  ? 'Waiting on the other side'
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

        {request.status === 'completed' && (isRequester || isHelper) && !alreadyRated ? (
          <GlassCard>
            <Text style={styles.section}>Rate</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStars(n)}>
                  <Text style={[styles.star, n <= stars && styles.starOn]}>★</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Optional short comment"
              placeholderTextColor={colors.textMuted}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, letterSpacing: -0.5 },
  close: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primary },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  emoji: { fontSize: 32 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: 10,
  },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 8 },
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  reason: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
    marginTop: 10,
    lineHeight: 18,
  },
  stars: { flexDirection: 'row', gap: 8, marginTop: 10 },
  star: { fontSize: 28, color: '#c5cdd8' },
  starOn: { color: colors.warning },
  comment: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
});
