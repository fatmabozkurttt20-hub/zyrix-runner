const colors = {
  dark: {
    text: '#FFFFFF',
    tint: '#00E5FF',
    background: '#090912',
    foreground: '#FFFFFF',
    card: '#12121F',
    cardForeground: '#FFFFFF',
    primary: '#00E5FF',
    primaryForeground: '#090912',
    secondary: '#1A1A30',
    secondaryForeground: '#CCCCFF',
    muted: '#1A1A2E',
    mutedForeground: '#8888AA',
    accent: '#FF3CAC',
    accentForeground: '#FFFFFF',
    destructive: '#FF4444',
    destructiveForeground: '#FFFFFF',
    border: '#2A2A40',
    input: '#1A1A30',
    // Game-specific
    crystal: '#FFD700',
    crystalGlow: 'rgba(255,215,0,0.35)',
    neonGreen: '#00FF88',
    neonPurple: '#B24BF3',
    livesColor: '#FF4444',
    comboColor: '#FFD700',
  },
  radius: 12,
};

export type ColorTheme = typeof colors.dark;
export default colors;
