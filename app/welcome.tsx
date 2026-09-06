import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { Reveal, STAGGER_MS } from '@/components/motion/Reveal';
import { PressScale } from '@/components/motion/PressScale';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { fonts, radii, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { useBarakahStore } from '@/store/barakahStore';

type Point = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
};

/**
 * Three claims, and they are the three the app actually has to make good on.
 * No feature tour — someone opening this for the first time wants to know what
 * it is for, not what buttons exist.
 */
const POINTS: Point[] = [
  {
    icon: 'chatbubble-ellipses',
    title: 'Ask in your own words',
    body: 'Type what you need like you would say it. Barakah works out the rest and shows you what it understood.',
  },
  {
    icon: 'location',
    title: 'Answered by neighbours',
    body: 'Requests go to verified people nearby who offer that kind of help — not to a call centre.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Care stays vetted',
    body: 'Childcare and elder transport only ever reach background-checked helpers. That rule is never bent.',
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const completeOnboarding = useBarakahStore((s) => s.completeOnboarding);
  const hasOnboarded = useBarakahStore((s) => s.hasOnboarded);

  function start() {
    completeOnboarding();
    router.replace('/');
  }

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.mark}>
            <Ionicons name="people" size={26} color={c.onPrimary} />
          </View>
        </Reveal>

        <Reveal delay={STAGGER_MS}>
          <Text style={styles.brand}>Barakah</Text>
        </Reveal>

        <Reveal delay={STAGGER_MS * 2}>
          <Text style={styles.headline}>Help is closer than you think.</Text>
        </Reveal>

        <Reveal delay={STAGGER_MS * 3}>
          <Text style={styles.support}>
            A ride to Jummah. Groceries on a hard week. A hand moving boxes. Barakah connects
            the people who need something with the neighbours who can give it.
          </Text>
        </Reveal>

        <View style={styles.points}>
          {POINTS.map((point, i) => (
            <Reveal key={point.title} delay={STAGGER_MS * (4 + i)}>
              <GlassCard style={styles.point}>
                <View style={styles.pointRow}>
                  <View style={styles.pointIcon}>
                    <Ionicons name={point.icon} size={18} color={c.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pointTitle}>{point.title}</Text>
                    <Text style={styles.pointBody}>{point.body}</Text>
                  </View>
                </View>
              </GlassCard>
            </Reveal>
          ))}
        </View>

        <Reveal delay={STAGGER_MS * 7}>
          <PillButton label="Get started" onPress={start} style={styles.cta} />
          <Text style={styles.footnote}>
            Nothing to sign up for. Everything stays on this device.
          </Text>
        </Reveal>

        {/* Reachable again from Profile, so this is a way back rather than a
            dead end when someone opens it deliberately. */}
        {hasOnboarded ? (
          <Reveal delay={STAGGER_MS * 8}>
            <PressScale onPress={() => router.back()} scaleTo={0.94} style={styles.back}>
              <Text style={styles.backText}>Back</Text>
            </PressScale>
          </Reveal>
        ) : null}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    mark: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: {
      fontFamily: fonts.bold,
      fontSize: 34,
      color: c.primaryDark,
      letterSpacing: -0.8,
      marginTop: 18,
    },
    headline: {
      fontFamily: fonts.bold,
      fontSize: 28,
      color: c.text,
      letterSpacing: -0.5,
      lineHeight: 34,
      marginTop: 8,
    },
    support: {
      fontFamily: fonts.regular,
      fontSize: 16,
      color: c.textSecondary,
      lineHeight: 24,
      marginTop: 12,
    },
    points: { marginTop: 26, gap: 10 },
    point: { borderRadius: radii.md },
    pointRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    pointIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pointTitle: { fontFamily: fonts.semibold, fontSize: 15, color: c.text },
    pointBody: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
      marginTop: 3,
    },
    cta: { marginTop: 28 },
    footnote: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 14,
    },
    back: { alignSelf: 'center', paddingVertical: 10, marginTop: 6 },
    backText: { fontFamily: fonts.semibold, fontSize: 15, color: c.primary },
  });
