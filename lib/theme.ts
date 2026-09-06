import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import {
  darkPalette,
  lightPalette,
  type Palette,
  type ThemePreference,
} from '@/constants/theme';
import { useBarakahStore } from '@/store/barakahStore';

/**
 * Resolving the theme.
 *
 * Two inputs, one answer: what the OS reports, and what the user picked in
 * Profile. The preference wins unless it is 'system', in which case the OS
 * does — and because useColorScheme subscribes to appearance changes, flipping
 * the phone to dark while the app is open re-renders straight away.
 */

export type Scheme = 'light' | 'dark';

export function useTheme() {
  const system = useColorScheme();
  const preference = useBarakahStore((s) => s.themePreference);
  const setPreference = useBarakahStore((s) => s.setThemePreference);

  const scheme: Scheme =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  return {
    scheme,
    palette: scheme === 'dark' ? darkPalette : lightPalette,
    preference,
    setPreference,
  };
}

/**
 * Build a stylesheet against the active palette.
 *
 * The factory MUST be defined at module scope — passing an inline arrow
 * rebuilds the stylesheet on every render, which is exactly the cost this
 * memo exists to avoid. The convention across this codebase is:
 *
 *   const makeStyles = (c: Palette) => StyleSheet.create({ ... });
 *   ...
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const { palette } = useTheme();
  return useMemo(() => factory(palette), [factory, palette]);
}

export type { Palette, ThemePreference };
