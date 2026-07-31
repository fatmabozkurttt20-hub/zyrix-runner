import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Bundled audio assets
const MENU_LOOP = require('@/assets/audio/menu_loop.mp3');
const SFX_TAP = require('@/assets/audio/ui_tap.mp3');

/**
 * Shared (module-level) menu audio controller.
 *
 * Menu, garage, game-over, and settings screens each "claim" the ambient
 * loop while focused. The loop keeps playing seamlessly while navigating
 * between those screens (release is deferred slightly so the next screen's
 * claim lands first) and stops once no menu screen is focused — e.g. when
 * entering the game, so it never overlaps the gameplay music.
 */
let players: { music: AudioPlayer; tap: AudioPlayer } | null = null;
let claims = 0;
let enabled = true;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

function ensurePlayers() {
  if (players) return players;
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  const music = createAudioPlayer(MENU_LOOP);
  music.loop = true;
  music.volume = 0.35;
  const tap = createAudioPlayer(SFX_TAP);
  tap.volume = 0.5;
  players = { music, tap };
  return players;
}

function acquire() {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  claims += 1;
  const { music } = ensurePlayers();
  if (claims === 1) {
    music.seekTo(0);
  }
  if (enabled && !music.playing) {
    music.play();
  }
}

function release() {
  claims = Math.max(0, claims - 1);
  if (claims > 0) return;
  // Defer the stop so a sibling menu screen gaining focus keeps the loop
  // going without a restart.
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    if (claims === 0 && players) {
      players.music.pause();
      players.music.seekTo(0);
    }
  }, 250);
}

/** Immediately silence the menu loop (used by the game screen on mount). */
export function stopMenuMusicNow() {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (players) {
    players.music.pause();
    players.music.seekTo(0);
  }
}

function setEnabled(value: boolean) {
  enabled = value;
  if (!players) return;
  if (!value) {
    players.music.pause();
  } else if (claims > 0) {
    players.music.play();
  }
}

export interface MenuAudio {
  /** Light UI tap sound for buttons. */
  playTap: () => void;
}

/**
 * Ambient menu music + UI tap SFX, gated by the sound setting.
 * Mount on menu/garage/gameover/settings screens.
 */
export function useMenuAudio(soundEnabled: boolean): MenuAudio {
  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled]);

  useFocusEffect(
    useCallback(() => {
      acquire();
      return () => release();
    }, [])
  );

  const playTap = useCallback(() => {
    if (!enabled) return;
    const { tap } = ensurePlayers();
    tap.seekTo(0);
    tap.play();
  }, []);

  return { playTap };
}
