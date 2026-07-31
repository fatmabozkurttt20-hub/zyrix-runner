import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeonButton } from '@/components/ui/NeonButton';
import colors from '@/constants/colors';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function PauseOverlay({
  onResume,
  onRestart,
  onQuit,
  soundEnabled,
  onToggleSound,
}: PauseOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.title}>PAUSED</Text>
        <Pressable
          onPress={onToggleSound}
          accessibilityRole="button"
          accessibilityLabel={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          hitSlop={8}
          style={({ pressed }) => [styles.soundButton, pressed && styles.soundButtonPressed]}
          testID="pause-sound-toggle"
        >
          <Ionicons
            name={soundEnabled ? 'volume-high' : 'volume-mute'}
            size={22}
            color={soundEnabled ? colors.dark.primary : colors.dark.mutedForeground}
          />
        </Pressable>
        <View style={styles.divider} />
        <View style={styles.buttons}>
          <NeonButton label="RESUME" onPress={onResume} color={colors.dark.primary} />
          <NeonButton label="RESTART" onPress={onRestart} color={colors.dark.accent} />
          <NeonButton label="QUIT" onPress={onQuit} color={colors.dark.mutedForeground} outlined />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(6,6,15,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    width: 280,
    backgroundColor: colors.dark.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    shadowOpacity: 0.25,
    elevation: 12,
  },
  title: {
    color: colors.dark.foreground,
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 8,
    marginBottom: 4,
  },
  soundButton: {
    marginTop: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  soundButtonPressed: {
    opacity: 0.6,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: colors.dark.border,
    marginVertical: 20,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
});
