import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { NeonButton } from '@/components/ui/NeonButton';
import { usePlayer } from '@/context/PlayerContext';
import { useMenuAudio } from '@/hooks/useMenuAudio';
import colors from '@/constants/colors';

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.floor(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

interface StatRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

function StatRow({ icon, label, value, color }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function GameOverScreen() {
  const { score, crystals, distance } = useLocalSearchParams<{
    score: string;
    crystals: string;
    distance: string;
  }>();
  const { highScore, soundEnabled } = usePlayer();
  const { playTap } = useMenuAudio(soundEnabled);
  const insets = useSafeAreaInsets();

  const finalScore = parseInt(score ?? '0', 10);
  const earnedCrystals = parseInt(crystals ?? '0', 10);
  const finalDistance = parseInt(distance ?? '0', 10);
  const isNewRecord = finalScore >= highScore && finalScore > 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <LinearGradient colors={['#08020F', '#100A18', '#08020F']} style={styles.container}>
      <View style={{ paddingTop: topPad }} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.gameOverLabel}>GAME OVER</Text>
          {isNewRecord && (
            <View style={styles.newRecordBadge}>
              <Ionicons name="star" size={12} color="#000" />
              <Text style={styles.newRecordText}>NEW RECORD</Text>
            </View>
          )}
        </View>

        {/* Distance — the headline number */}
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreNumber}>{formatDistance(finalDistance)}</Text>
          <Text style={styles.scoreCaption}>DISTANCE</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <StatRow
            icon="speedometer"
            label="Score"
            value={finalScore.toLocaleString()}
            color={colors.dark.foreground}
          />
          <View style={styles.statDivider} />
          <StatRow
            icon="diamond"
            label="Crystals Collected"
            value={`+${earnedCrystals}`}
            color={colors.dark.primary}
          />
          <View style={styles.statDivider} />
          <StatRow
            icon="trophy"
            label="Best Score"
            value={highScore.toLocaleString()}
            color={colors.dark.crystal}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <NeonButton
            label="RESTART"
            onPress={() => {
              playTap();
              router.replace('/game');
            }}
            color={colors.dark.primary}
            size="lg"
            style={styles.fullBtn}
          />
          <NeonButton
            label="MAIN MENU"
            onPress={() => {
              playTap();
              router.replace('/menu');
            }}
            color={colors.dark.mutedForeground}
            size="md"
            outlined
            style={styles.fullBtn}
          />
        </View>
      </Animated.View>

      <View style={{ paddingBottom: bottomPad }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },
  headerBlock: {
    alignItems: 'center',
    gap: 10,
  },
  gameOverLabel: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.foreground,
    letterSpacing: 8,
    textShadowColor: colors.dark.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  newRecordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.dark.crystal,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  newRecordText: {
    color: '#000',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  scoreBlock: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 58,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.primary,
    letterSpacing: 3,
    textShadowColor: colors.dark.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  scoreCaption: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.mutedForeground,
    letterSpacing: 5,
    marginTop: -4,
  },
  statsCard: {
    width: '100%',
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: colors.dark.mutedForeground,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  statDivider: {
    height: 1,
    backgroundColor: colors.dark.border,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  fullBtn: {
    width: '100%',
  },
});
