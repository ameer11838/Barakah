import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { PressScale } from '@/components/motion/PressScale';
import { Reveal, STAGGER_MS } from '@/components/motion/Reveal';
import { Avatar } from '@/components/ui/Chips';
import { PillButton } from '@/components/ui/PillButton';
import { fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/lib/theme';
import { useBarakahStore, useStoreHydrated } from '@/store/barakahStore';
import { hasRealName } from '@/types/barakah';

/** One primary action, then a quieter secondary path. */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const user = useBarakahStore((s) => s.getCurrentUser());
  const named = hasRealName(user.name);
  const hasOnboarded = useBarakahStore((s) => s.hasOnboarded);
  const storeReady = useStoreHydrated();

  // Wait for storage before routing. Deciding on the default value would send
  // returning users back through onboarding on every cold start.
  if (storeReady && !hasOnboarded) return <Redirect href="/welcome" />;

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}>
        <Reveal style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Barakah</Text>
            <Text style={styles.hello}>
              {named ? `Assalamu alaikum, ${user.name.trim().split(' ')[0]}` : 'Assalamu alaikum'}
            </Text>
            {!named ? (
              <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
                <Text style={styles.setName}>Add your name</Text>
              </Pressable>
            ) : null}
          </View>
          <PressScale
            onPress={() => router.push('/profile')}
            scaleTo={0.92}
            accessibilityRole="button"
            accessibilityLabel="Open profile">
            <Avatar name={user.name} color={user.avatarColor} size={44} />
          </PressScale>
        </Reveal>

        <View style={styles.hero}>
          <Reveal delay={STAGGER_MS}>
            <Text style={styles.headline}>Need help nearby?</Text>
          </Reveal>
          <Reveal delay={STAGGER_MS * 2}>
            <Text style={styles.support}>
              Type what you need. We’ll find a verified neighbor nearby.
            </Text>
          </Reveal>
          <Reveal delay={STAGGER_MS * 3}>
            <PillButton
              label="Request help"
              onPress={() => router.push('/request')}
              style={styles.cta}
            />
          </Reveal>
          <Reveal delay={STAGGER_MS * 4}>
            <PressScale
              onPress={() => router.push('/map')}
              scaleTo={0.94}
              accessibilityRole="button"
              style={styles.secondary}>
              <Text style={styles.secondaryText}>Or help someone nearby</Text>
            </PressScale>
          </Reveal>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'space-between',
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    brand: { fontFamily: fonts.bold, fontSize: 34, color: c.primaryDark, letterSpacing: -0.8 },
    hello: { fontFamily: fonts.medium, fontSize: 15, color: c.textSecondary, marginTop: 4 },
    setName: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: c.primary,
      marginTop: 4,
    },
    hero: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
    headline: {
      fontFamily: fonts.bold,
      fontSize: 28,
      color: c.text,
      letterSpacing: -0.5,
      lineHeight: 34,
    },
    support: {
      fontFamily: fonts.regular,
      fontSize: 16,
      color: c.textSecondary,
      lineHeight: 24,
      marginTop: 12,
      maxWidth: 320,
    },
    cta: { marginTop: 28, alignSelf: 'stretch' },
    secondary: { marginTop: 18, alignSelf: 'center', paddingVertical: 8 },
    secondaryText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: c.primary,
    },
  });
