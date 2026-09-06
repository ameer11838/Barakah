import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { Avatar, StatusChip } from '@/components/ui/Chips';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import { categoryLabel, formatConfidence, statusLabel, statusTone } from '@/lib/format';
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
            <CategoryIcon category={request.category} size={26} />
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
                ? 'Waiting for a helper nearby. In the demo, Omar usually accepts in a few seconds.'
                : 'This request is open. Accept it if you offer this category.'}
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
                <View style={styles.helperMeta}>
                  <Text style={styles.metaInline}>Tier {helper.trustTier}</Text>
                  {helper.isNewHelper ? (
                    <Text style={styles.metaInline}> · New helper</Text>
                  ) : helper.ratingAvg != null ? (
                    <View style={styles.ratingInline}>
                      <Text style={styles.metaInline}> · {helper.ratingAvg.toFixed(1)} </Text>
                      <Ionicons name="star" size={12} color={colors.warning} />
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

        {request.status === 'completed' && (isRequester || isHelper) && !alreadyRated ? (
          <GlassCard>
            <Text style={styles.section}>Rate</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
                  <Ionicons
                    name={n <= stars ? 'star' : 'star-outline'}
                    size={28}
                    color={n <= stars ? colors.warning : colors.textMuted}
                  />
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
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: 10,
  },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 8 },
  helperMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  metaInline: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  ratingInline: { flexDirection: 'row', alignItems: 'center' },
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  reason: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
    marginTop: 10,
    lineHeight: 18,
  },
  stars: { flexDirection: 'row', gap: 8, marginTop: 10 },
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
