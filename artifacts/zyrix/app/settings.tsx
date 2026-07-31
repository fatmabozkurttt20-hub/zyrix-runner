import React from 'react';
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlayer } from '@/context/PlayerContext';
import { useMenuAudio } from '@/hooks/useMenuAudio';
import colors from '@/constants/colors';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: () => void;
  color?: string;
}

function SettingRow({ icon, label, sublabel, value, onToggle, color = colors.dark.primary }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sublabel && <Text style={styles.settingSubLabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.dark.border, true: `${color}88` }}
        thumbColor={value ? color : colors.dark.mutedForeground}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { hapticsEnabled, soundEnabled, toggleHaptics, toggleSound, totalRuns, highScore, crystals } = usePlayer();
  const { playTap } = useMenuAudio(soundEnabled);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

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
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 20 }]}>
        {/* Preferences */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow
            icon="phone-portrait-outline"
            label="Haptic Feedback"
            sublabel="Vibration on moves and hits"
            value={hapticsEnabled}
            onToggle={toggleHaptics}
            color={colors.dark.primary}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="musical-notes-outline"
            label="Sound Effects"
            sublabel="Music and in-game audio"
            value={soundEnabled}
            onToggle={toggleSound}
            color={colors.dark.accent}
          />
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>STATS</Text>
        <View style={styles.card}>
          <InfoRow label="Total Runs" value={totalRuns.toString()} />
          <View style={styles.rowDivider} />
          <InfoRow label="Best Score" value={highScore.toLocaleString()} />
          <View style={styles.rowDivider} />
          <InfoRow label="Crystals Collected" value={crystals.toLocaleString()} />
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <InfoRow label="Game" value="ZYRIX" />
          <View style={styles.rowDivider} />
          <InfoRow label="Version" value="1.0.0" />
          <View style={styles.rowDivider} />
          <InfoRow label="Worlds" value="6 Biomes" />
          <View style={styles.rowDivider} />
          <InfoRow label="Hoverboards" value="7 Boards" />
        </View>

        {/* Future features hint */}
        <View style={styles.futureHint}>
          <Ionicons name="rocket-outline" size={16} color={colors.dark.mutedForeground} />
          <Text style={styles.futureText}>
            Achievements, leaderboards, and more coming in future updates
          </Text>
        </View>
      </View>
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
  content: {
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    color: colors.dark.mutedForeground,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 3,
    paddingHorizontal: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: colors.dark.foreground,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  settingSubLabel: {
    color: colors.dark.mutedForeground,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoLabel: {
    color: colors.dark.mutedForeground,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  infoValue: {
    color: colors.dark.foreground,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.dark.border,
    marginHorizontal: 16,
  },
  futureHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  futureText: {
    flex: 1,
    color: colors.dark.mutedForeground,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
