import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HoverBoard } from '@/constants/game';
import { NeonButton } from '@/components/ui/NeonButton';
import colors from '@/constants/colors';

interface BoardCardProps {
  board: HoverBoard;
  isUnlocked: boolean;
  isSelected: boolean;
  canAfford: boolean;
  onSelect: () => void;
  onPurchase: () => void;
}

export function BoardCard({
  board,
  isUnlocked,
  isSelected,
  canAfford,
  onSelect,
  onPurchase,
}: BoardCardProps) {
  return (
    <View
      style={[
        styles.card,
        isSelected && { borderColor: board.color, shadowColor: board.color, shadowOpacity: 0.4 },
      ]}
    >
      {/* Board visual */}
      <View style={styles.boardVisual}>
        <View style={[styles.boardBody, { borderColor: board.color, backgroundColor: '#0C0C20' }]}>
          <View style={[styles.boardAccent, { backgroundColor: board.accentColor }]} />
        </View>
        <View style={[styles.boardGlow, { backgroundColor: board.color }]} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: board.color }]}>{board.name}</Text>
        <Text style={styles.description}>{board.description}</Text>
      </View>

      {/* Action */}
      <View style={styles.action}>
        {isUnlocked ? (
          <NeonButton
            label={isSelected ? 'EQUIPPED' : 'EQUIP'}
            onPress={onSelect}
            color={isSelected ? board.color : colors.dark.mutedForeground}
            outlined={!isSelected}
            size="sm"
          />
        ) : (
          <View style={styles.priceRow}>
            <Ionicons name="diamond" size={13} color={colors.dark.crystal} />
            <Text style={styles.price}>{board.price.toLocaleString()}</Text>
            <NeonButton
              label="BUY"
              onPress={onPurchase}
              color={canAfford ? colors.dark.crystal : colors.dark.mutedForeground}
              size="sm"
              disabled={!canAfford}
              style={{ marginLeft: 8 }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  boardVisual: {
    width: 64,
    alignItems: 'center',
  },
  boardBody: {
    width: 64,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  boardAccent: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '30%',
    bottom: '30%',
    borderRadius: 2,
    opacity: 0.5,
  },
  boardGlow: {
    marginTop: 3,
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  description: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.dark.mutedForeground,
  },
  action: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    color: colors.dark.crystal,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
