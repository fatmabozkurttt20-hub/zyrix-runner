import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { NeonButton } from '@/components/ui/NeonButton';
import { usePlayer } from '@/context/PlayerContext';
import colors from '@/constants/colors';

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.8,
  opacity: Math.random() * 0.6 + 0.2,
  twinkleDelay: Math.random() * 2000,
}));

function StarField() {
  return (
    <>
      {STARS.map((s) => (
        <View
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: 'rgba(180,200,255,0.7)',
            opacity: s.opacity,
          }}
        />
      ))}
    </>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { highScore, crystals, isLoaded } = usePlayer();

  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 4 }),
      ]),
      Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <LinearGradient colors={['#020215', '#060820', '#0A0A14']} style={styles.container}>
      <StarField />

      {/* Top: stats bar */}
      <View style={[styles.statsBar, { paddingTop: topPad + 8 }]}>
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={14} color={colors.dark.crystal} />
          <Text style={styles.statText}>{highScore.toLocaleString()}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="diamond" size={14} color={colors.dark.primary} />
          <Text style={styles.statText}>{crystals.toLocaleString()}</Text>
        </View>
      </View>

      {/* Center: Logo */}
      <View style={styles.centerContent}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center' }}>
          {/* Logo glow */}
          <Animated.View
            style={[styles.logoGlow, { opacity: glowAnim }]}
          />
          {/* ZYRIX text */}
          <Text style={styles.logoText}>ZYRIX</Text>
          <Text style={styles.tagline}>RIDE THE INFINITE</Text>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View style={[styles.buttons, { paddingBottom: bottomPad + 28, opacity: buttonsOpacity }]}>
        <NeonButton
          label="PLAY"
          onPress={() => router.push('/game')}
          color={colors.dark.primary}
          size="lg"
          style={styles.playBtn}
        />
        <View style={styles.secondaryRow}>
          <NeonButton
            label="GARAGE"
            onPress={() => router.push('/garage')}
            color={colors.dark.accent}
            size="md"
            outlined
            style={styles.halfBtn}
          />
          <NeonButton
            label="SETTINGS"
            onPress={() => router.push('/settings')}
            color={colors.dark.mutedForeground}
            size="md"
            outlined
            style={styles.halfBtn}
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statText: {
    color: colors.dark.foreground,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 260,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.dark.primary,
    opacity: 0.12,
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 60,
    shadowOpacity: 1,
    elevation: 20,
  },
  logoText: {
    fontSize: 72,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.primary,
    letterSpacing: 12,
    textShadowColor: colors.dark.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.mutedForeground,
    letterSpacing: 5,
    marginTop: 8,
  },
  buttons: {
    paddingHorizontal: 28,
    gap: 14,
  },
  playBtn: {
    width: '100%',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfBtn: {
    flex: 1,
  },
});
