import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WORLDS } from '@/constants/game';
import { GameDisplayState } from '@/hooks/useGame';
import colors from '@/constants/colors';

interface HUDProps {
  displayState: GameDisplayState;
  onPause: () => void;
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.floor(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function HUD({ displayState, onPause }: HUDProps) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const world = WORLDS[displayState.worldIndex];

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
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{displayState.score.toLocaleString()}</Text>
        </View>

        {/* Pause */}
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={onPause}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pause" size={20} color={colors.dark.foreground} />
        </TouchableOpacity>
      </View>

      {/* Crystal counter */}
      <View style={styles.crystalRow}>
        <Ionicons name="diamond" size={14} color={colors.dark.crystal} />
        <Text style={styles.crystalText}>{displayState.sessionCrystals}</Text>
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
});
