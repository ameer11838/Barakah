import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { RequestCard } from '@/components/RequestCard';
import { Avatar } from '@/components/ui/Chips';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import { useBarakahStore } from '@/store/barakahStore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useBarakahStore((s) => s.getCurrentUser());
  const requests = useBarakahStore((s) => s.requests);
  const partners = useBarakahStore((s) => s.partners);

  const nearby = requests
    .filter((r) => r.status === 'open' || r.status === 'matching')
    .slice(0, 3);
  const grocer = partners.find((p) => p.type === 'business');

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 120,
          paddingHorizontal: 20,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Barakah</Text>
            <Text style={styles.hello}>Assalamu alaikum, {user.name.split(' ')[0]}</Text>
          </View>
          <Avatar name={user.name} color={user.avatarColor} size={48} />
        </View>

        <GlassCard strong>
          <Text style={styles.cardTitle}>Need a hand near ICPC?</Text>
          <Text style={styles.cardBody}>
            Ask in your own words — rides, food, and more. We parse it and route to a verified
            neighbor.
          </Text>
          <PillButton
            label="Request help"
            onPress={() => router.push('/request')}
            style={{ marginTop: 14 }}
          />
        </GlassCard>

        {grocer?.standingOffer ? (
          <GlassCard>
            <Text style={styles.offerEyebrow}>Partner offer</Text>
            <Text style={styles.cardTitle}>{grocer.name}</Text>
            <Text style={styles.cardBody}>{grocer.standingOffer}</Text>
          </GlassCard>
        ) : null}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Nearby needs</Text>
          <Text style={styles.sectionLink} onPress={() => router.push('/map')}>
            Open map
          </Text>
        </View>

        {nearby.map((r) => (
          <RequestCard key={r.id} request={r} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brand: { fontFamily: fonts.bold, fontSize: 32, color: colors.text, letterSpacing: -0.8 },
  hello: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary, marginTop: 2 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: 6,
  },
  offerEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  sectionLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
});
