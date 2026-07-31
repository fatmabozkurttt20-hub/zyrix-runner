import colors from '@/constants/colors';

/**
 * Returns the design tokens for the app palette.
 * ZYRIX is a dark-only neon game, so this always returns the dark palette.
 */
export function useColors() {
  return { ...colors.dark, radius: colors.radius };
}
