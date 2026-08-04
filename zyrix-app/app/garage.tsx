import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BoardCard } from '@/components/ui/BoardCard';
import { usePlayer } from '@/context/PlayerContext';
import { useMenuAudio } from '@/hooks/useMenuAudio';
import { BOARDS } from '@/constants/game';
import colors from '@/constants/colors';

export default function GarageScreen() {
  const insets = useSafeAreaInsets();
  const { crystals, selectedBoardId, unlockedBoards, purchaseBoard, selectBoard, highScore, soundEnabled } =
    usePlayer();
  const { playTap } = useMenuAudio(soundEnabled);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const handleAction = (boardId: string) => {
    playTap();
    if (unlockedBoards.includes(boardId)) {
      selectBoard(boardId);
    } else {
      purchaseBoard(boardId);
    }
  };

  return (
    <LinearGradient colors={['#090912', '#0C0C18', '#090912']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => {
            playTap();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.dark.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GARAGE</Text>
        <View style={styles.crystalChip}>
          <Ionicons name="diamond" size={14} color={colors.dark.crystal} />
          <Text style={styles.crystalCount}>{crystals.toLocaleString()}</Text>
        </View>
      </View>

      {/* High score unlock hint */}
      <View style={styles.unlockHint}>
        <Ionicons name="information-circle-outline" size={14} color={colors.dark.mutedForeground} />
        <Text style={styles.hintText}>
          Best score: {highScore.toLocaleString()} — earn crystals in-game to unlock boards
        </Text>
      </View>

      {/* Boards list */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {BOARDS.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            isUnlocked={unlockedBoards.includes(board.id)}
            isSelected={selectedBoardId === board.id}
            canAfford={crystals >= board.price}
            onSelect={() => {
              playTap();
              selectBoard(board.id);
            }}
            onPurchase={() => handleAction(board.id)}
          />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.dark.foreground,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 4,
  },
  crystalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  crystalCount: {
    color: colors.dark.crystal,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  unlockHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  hintText: {
    color: colors.dark.mutedForeground,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  list: {
    padding: 16,
  },
});
