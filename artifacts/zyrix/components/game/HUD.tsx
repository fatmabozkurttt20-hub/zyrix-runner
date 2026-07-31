import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WORLDS } from '@/constants/game';
import { GameDisplayState } from '@/hooks/useGame';
import colors from '@/constants/colors';

interface HUDProps {
  displayState: GameDisplayState;
  onPause: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.floor(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function HUD({ displayState, onPause, soundEnabled, onToggleSound }: HUDProps) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const world = WORLDS[displayState.worldIndex];

  // Smooth pop animation when crystals are collected (score bumps with them)
  const scorePop = useRef(new Animated.Value(1)).current;
  const crystalPop = useRef(new Animated.Value(1)).current;
  const prevCrystals = useRef(displayState.sessionCrystals);

  useEffect(() => {
    if (displayState.sessionCrystals > prevCrystals.current) {
      const pop = (v: Animated.Value, to: number) =>
        Animated.sequence([
          Animated.timing(v, { toValue: to, duration: 110, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.spring(v, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 220 }),
        ]);
      Animated.parallel([pop(scorePop, 1.14), pop(crystalPop, 1.3)]).start();
    }
    prevCrystals.current = displayState.sessionCrystals;
  }, [displayState.sessionCrystals, scorePop, crystalPop]);

  return (
    <View style={[styles.container, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
      {/* Top row: distance | score | pause */}
      <View style={styles.topRow}>
        {/* Distance — the primary metric */}
        <View style={styles.distanceBox}>
          <Text style={[styles.distanceText, { color: world.trackColor }]}>
            {formatDistance(displayState.distanceM)}
          </Text>
        </View>

        {/* Score */}
        <Animated.View style={[styles.scoreBox, { transform: [{ scale: scorePop }] }]}>
          <Text style={styles.scoreText}>{displayState.score.toLocaleString()}</Text>
        </Animated.View>

        {/* Sound + Pause */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={onToggleSound}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            <Ionicons
              name={soundEnabled ? 'volume-high' : 'volume-mute'}
              size={20}
              color={colors.dark.foreground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={onPause}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pause" size={20} color={colors.dark.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Crystal counter */}
      <Animated.View style={[styles.crystalRow, { transform: [{ scale: crystalPop }] }]}>
        <Ionicons name="diamond" size={14} color={colors.dark.crystal} />
        <Text style={styles.crystalText}>{displayState.sessionCrystals}</Text>
      </Animated.View>

      {/* Overdrive meter */}
      <View style={styles.odRow}>
        <Ionicons
          name="flash"
          size={11}
          color={displayState.overdriveActive ? '#E3B8FF' : '#B44CFF'}
        />
        <View style={[styles.odTrack, displayState.overdriveActive && styles.odTrackActive]}>
          <View
            style={[
              styles.odFill,
              { width: `${Math.round(Math.max(0, Math.min(1, displayState.overdriveMeter)) * 100)}%` },
              displayState.overdriveActive && styles.odFillActive,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceBox: {
    minWidth: 76,
  },
  distanceText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,229,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreBox: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 36,
  },
  crystalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  crystalText: {
    color: colors.dark.crystal,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  odRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  odTrack: {
    width: 92,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(180,76,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180,76,255,0.45)',
    overflow: 'hidden',
  },
  odTrackActive: {
    borderColor: 'rgba(227,184,255,0.9)',
    shadowColor: '#B44CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.9,
    elevation: 4,
  },
  odFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#B44CFF',
  },
  odFillActive: {
    backgroundColor: '#E3B8FF',
  },
});
