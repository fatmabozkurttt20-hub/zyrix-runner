import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GAME_CONFIG, WORLDS } from '@/constants/game';
import { GameDisplayState } from '@/hooks/useGame';
import colors from '@/constants/colors';

interface HUDProps {
  displayState: GameDisplayState;
  onPause: () => void;
}

function LivesDisplay({ lives }: { lives: number }) {
  return (
    <View style={styles.livesRow}>
      {Array.from({ length: GAME_CONFIG.LIVES }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < lives ? 'heart' : 'heart-outline'}
          size={18}
          color={i < lives ? colors.dark.livesColor : colors.dark.mutedForeground}
          style={{ marginRight: 3 }}
        />
      ))}
    </View>
  );
}

export function HUD({ displayState, onPause }: HUDProps) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const world = WORLDS[displayState.worldIndex];

  return (
    <View style={[styles.container, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
      {/* Top row: Lives | Score | Pause */}
      <View style={styles.topRow}>
        {/* Lives */}
        <LivesDisplay lives={displayState.lives} />

        {/* Score */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{displayState.score.toString().padStart(6, '0')}</Text>
        </View>

        {/* Pause */}
        <TouchableOpacity style={styles.pauseBtn} onPress={onPause} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pause" size={20} color={colors.dark.foreground} />
        </TouchableOpacity>
      </View>

      {/* World name + progress bar */}
      <View style={styles.worldRow}>
        <Text style={[styles.worldName, { color: world.trackColor }]}>{world.name}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(displayState.worldProgress * 100, 100)}%` as any,
                backgroundColor: world.trackColor,
              },
            ]}
          />
        </View>
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
  livesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 64,
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
    fontSize: 20,
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
  worldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  worldName: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
    minWidth: 90,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  crystalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  crystalText: {
    color: colors.dark.crystal,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
