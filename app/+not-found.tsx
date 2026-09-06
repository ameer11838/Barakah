import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, type Palette } from '@/constants/theme';
import { useThemedStyles } from '@/lib/theme';

export default function NotFoundScreen() {
  const styles = useThemedStyles(makeStyles);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&rsquo;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: c.bg,
    },
    title: { fontFamily: fonts.bold, fontSize: 20, color: c.text },
    link: { marginTop: 15, paddingVertical: 15 },
    linkText: { fontFamily: fonts.semibold, fontSize: 14, color: c.primary },
  });
