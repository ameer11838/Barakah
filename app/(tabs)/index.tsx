import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { Avatar } from '@/components/ui/Chips';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts } from '@/constants/theme';
import { useBarakahStore } from '@/store/barakahStore';
import { hasRealName } from '@/types/barakah';

/** One primary action, then a quieter secondary path. */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useBarakahStore((s) => s.getCurrentUser());
  const named = hasRealName(user.name);

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}>
        <View style={styles.header}>
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
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile">
            <Avatar name={user.name} color={user.avatarColor} size={44} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.headline}>Need help nearby?</Text>
          <Text style={styles.support}>
            Type what you need. We’ll find a verified neighbor nearby.
          </Text>
          <PillButton
            label="Request help"
            onPress={() => router.push('/request')}
            style={styles.cta}
          />
          <Pressable
            onPress={() => router.push('/map')}
            accessibilityRole="button"
            style={styles.secondary}>
            <Text style={styles.secondaryText}>Or help someone nearby</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brand: { fontFamily: fonts.bold, fontSize: 34, color: colors.primaryDark, letterSpacing: -0.8 },
  hello: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  setName: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
  },
  hero: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  support: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 320,
  },
  cta: { marginTop: 28, alignSelf: 'stretch' },
  secondary: { marginTop: 18, alignSelf: 'center', paddingVertical: 8 },
  secondaryText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primary,
  },
});
