/**
 * Colour, in two schemes.
 *
 * Every colour the app draws is a token on this palette, and both schemes
 * define every token. That is the whole discipline: a screen never asks "am I
 * in dark mode?", it just reads `c.text`. Adding a token means adding it to
 * both palettes, and the type makes it impossible to forget one.
 *
 * The dark scheme is not the light one inverted. It is built around a near
 * black with a green cast — a neutral grey under a teal brand reads as dirty —
 * and the accent moves *up* the scale rather than down, because a mid teal
 * that looks rich on white turns to mud on black.
 */

export interface Palette {
  /* Grounds */
  bg: string;
  bgSoft: string;
  surface: string;

  /* Translucent panels */
  glass: string;
  glassStrong: string;
  /** Fallbacks for platforms with no real backdrop blur (Android). */
  glassOpaque: string;
  glassStrongOpaque: string;
  /** Specular sheen along a panel's top edge. */
  glassHighlight: string;

  /* Lines */
  border: string;
  borderSubtle: string;

  /* Type */
  text: string;
  textSecondary: string;
  textMuted: string;

  /* Brand */
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  primarySoft: string;
  primaryGlow: string;
  /** Type/icon colour that sits *on* a primary fill. */
  onPrimary: string;

  /* Status */
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;

  /* Fills */
  overlay: string;
  /** Text inputs. */
  inputBg: string;
  /** Inset panels sitting inside a glass card. */
  panelBg: string;

  /* Inverted surface, used by the toast */
  inverseSurface: string;
  onInverseSurface: string;

  /* Ambient backdrop blobs */
  backdropBlobA: string;
  backdropBlobB: string;

  shadow: string;
}

export const lightPalette: Palette = {
  bg: '#E9F0EE',
  bgSoft: '#F5F8F7',
  surface: '#FFFFFF',

  glass: 'rgba(255,255,255,0.74)',
  glassStrong: 'rgba(255,255,255,0.90)',
  glassOpaque: 'rgba(255,255,255,0.92)',
  glassStrongOpaque: 'rgba(255,255,255,0.97)',
  glassHighlight: 'rgba(255,255,255,0.55)',

  border: 'rgba(255,255,255,0.95)',
  borderSubtle: 'rgba(20,34,31,0.08)',

  text: '#14221F',
  textSecondary: '#4F615C',
  textMuted: '#7A8C86',

  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryMuted: '#14B8A6',
  primarySoft: 'rgba(15,118,110,0.12)',
  primaryGlow: 'rgba(15,118,110,0.18)',
  onPrimary: '#FFFFFF',

  success: '#15803D',
  successSoft: 'rgba(21,128,61,0.12)',
  warning: '#B45309',
  warningSoft: 'rgba(180,83,9,0.14)',
  danger: '#BE123C',
  dangerSoft: 'rgba(190,18,60,0.12)',

  overlay: 'rgba(20,34,31,0.05)',
  inputBg: 'rgba(255,255,255,0.70)',
  panelBg: 'rgba(255,255,255,0.55)',

  inverseSurface: '#14221F',
  onInverseSurface: '#FFFFFF',

  backdropBlobA: 'rgba(15,118,110,0.18)',
  backdropBlobB: 'rgba(20,184,166,0.10)',

  shadow: 'rgba(20,34,31,0.12)',
};

export const darkPalette: Palette = {
  bg: '#0B1312',
  bgSoft: '#111C1A',
  surface: '#16211F',

  // Panels are lighter than the ground here, not more opaque versions of it —
  // on a dark scheme a glass card reads by being *lifted*, not by being whiter.
  glass: 'rgba(38,54,51,0.66)',
  glassStrong: 'rgba(38,54,51,0.86)',
  glassOpaque: 'rgba(26,38,36,0.94)',
  glassStrongOpaque: 'rgba(30,44,41,0.98)',
  // A white sheen at light-mode strength looks like a smear on black.
  glassHighlight: 'rgba(255,255,255,0.10)',

  border: 'rgba(255,255,255,0.12)',
  borderSubtle: 'rgba(255,255,255,0.07)',

  text: '#ECF4F2',
  textSecondary: '#A8BCB8',
  textMuted: '#7B8F8B',

  // Up the scale, not down: teal-400 on near-black instead of teal-700.
  primary: '#2DD4BF',
  primaryDark: '#5EEAD4',
  primaryMuted: '#14B8A6',
  primarySoft: 'rgba(45,212,191,0.16)',
  primaryGlow: 'rgba(45,212,191,0.14)',
  // A bright teal fill needs dark type on it, not white.
  onPrimary: '#052E2B',

  success: '#4ADE80',
  successSoft: 'rgba(74,222,128,0.16)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.16)',
  danger: '#FB7185',
  dangerSoft: 'rgba(251,113,133,0.16)',

  overlay: 'rgba(255,255,255,0.07)',
  inputBg: 'rgba(255,255,255,0.06)',
  panelBg: 'rgba(255,255,255,0.05)',

  inverseSurface: '#ECF4F2',
  onInverseSurface: '#0B1312',

  backdropBlobA: 'rgba(45,212,191,0.10)',
  backdropBlobB: 'rgba(20,184,166,0.07)',

  shadow: 'rgba(0,0,0,0.60)',
};

/* Scheme-independent tokens. */

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radii = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 };

export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
};

/**
 * What the user asked for, which is not the same as what is on screen.
 * 'system' defers to the OS and keeps following it when it changes.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
