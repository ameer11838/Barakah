import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii } from '@/constants/theme';
import { useBarakahStore } from '@/store/barakahStore';

export function ToastHost() {
  const toast = useBarakahStore((s) => s.toast);
  const setToast = useBarakahStore((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{toast.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
    alignItems: 'center',
    zIndex: 50,
  },
  bubble: {
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.pill,
    maxWidth: 360,
  },
  text: {
    color: '#fff',
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
});
