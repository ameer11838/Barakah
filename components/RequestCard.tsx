import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusChip } from '@/components/ui/Chips';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { GlassCard } from '@/components/ui/GlassCard';
import { fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/lib/theme';
import { requestSnippet, requestTitle, statusLabel, statusTone } from '@/lib/format';
import type { HelpRequest } from '@/types/barakah';

export function RequestCard({
  request,
  onPress,
}: {
  request: HelpRequest;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);

  const body = (
    <GlassCard>
      <View style={styles.row}>
        <CategoryIcon category={request.category} />
        <View style={{ flex: 1 }}>
          <View style={styles.top}>
            <Text style={styles.category} numberOfLines={1}>
              {requestTitle(request)}
            </Text>
            <StatusChip label={statusLabel(request.status)} tone={statusTone(request.status)} />
          </View>
          <Text style={styles.snippet}>{requestSnippet(request)}</Text>
          <Text style={styles.meta}>
            {request.locationText} · {request.timeWindow}
          </Text>
          {request.aiMatchReason ? (
            <Text style={styles.reason}>{request.aiMatchReason}</Text>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.92 }}>
        {body}
      </Pressable>
    );
  }

  return (
    <Link href={`/request/${request.id}`} asChild>
      <Pressable style={({ pressed }) => pressed && { opacity: 0.92 }}>{body}</Pressable>
    </Link>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    category: { fontFamily: fonts.semibold, fontSize: 16, color: c.text, flex: 1 },
    snippet: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 6,
      lineHeight: 20,
    },
    meta: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted, marginTop: 8 },
    reason: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: c.primaryDark,
      marginTop: 8,
      lineHeight: 17,
    },
  });
