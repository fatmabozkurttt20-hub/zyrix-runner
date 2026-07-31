import { useCallback, useEffect, useRef } from 'react';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Bundled audio assets
const MUSIC_LOOP = require('@/assets/audio/music_loop.mp3');
const SFX_PICKUP = require('@/assets/audio/pickup.mp3');
const SFX_JUMP = require('@/assets/audio/jump.mp3');
const SFX_SWIPE = require('@/assets/audio/swipe.mp3');
const SFX_CRASH = require('@/assets/audio/crash.mp3');

export type SfxName = 'pickup' | 'jump' | 'swipe' | 'crash';

export interface GameAudio {
  /** Fire-and-forget SFX (restarts from 0 if already playing). */
  playSfx: (name: SfxName) => void;
  /** Start the music loop from the beginning. */
  startMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  stopMusic: () => void;
}

interface Players {
  music: AudioPlayer;
  pickup: AudioPlayer;
  jump: AudioPlayer;
  swipe: AudioPlayer;
  crash: AudioPlayer;
}

/**
 * Game audio: synthwave music loop + SFX, gated by the sound setting.
 * Players are created once per mount and released on unmount.
 */
export function useGameAudio(soundEnabled: boolean): GameAudio {
  const playersRef = useRef<Players | null>(null);
  const enabledRef = useRef(soundEnabled);
  enabledRef.current = soundEnabled;
  // Tracks whether music *should* be audible (started and not paused/stopped),
  // so toggling sound back on mid-run resumes the loop.
  const musicActiveRef = useRef(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

    const music = createAudioPlayer(MUSIC_LOOP);
    music.loop = true;
    music.volume = 0.5;

    const pickup = createAudioPlayer(SFX_PICKUP);
    pickup.volume = 0.8;
    const jump = createAudioPlayer(SFX_JUMP);
    jump.volume = 0.7;
    const swipe = createAudioPlayer(SFX_SWIPE);
    swipe.volume = 0.5;
    const crash = createAudioPlayer(SFX_CRASH);
    crash.volume = 0.9;

    playersRef.current = { music, pickup, jump, swipe, crash };

    return () => {
      const players = playersRef.current;
      playersRef.current = null;
      if (players) {
        Object.values(players).forEach((p) => {
          try {
            p.remove();
          } catch {
            // player already released
          }
        });
      }
    };
  }, []);

  // React to the settings toggle mid-game
  useEffect(() => {
    const music = playersRef.current?.music;
    if (!music) return;
    if (!soundEnabled) {
      music.pause();
    } else if (musicActiveRef.current) {
      music.play();
    }
  }, [soundEnabled]);

  const playSfx = useCallback((name: SfxName) => {
    if (!enabledRef.current) return;
    const player = playersRef.current?.[name];
    if (!player) return;
    player.seekTo(0);
    player.play();
  }, []);

  const startMusic = useCallback(() => {
    musicActiveRef.current = true;
    const music = playersRef.current?.music;
    if (!music) return;
    music.seekTo(0);
    if (enabledRef.current) music.play();
  }, []);

  const pauseMusic = useCallback(() => {
    musicActiveRef.current = false;
    playersRef.current?.music.pause();
  }, []);

  const resumeMusic = useCallback(() => {
    musicActiveRef.current = true;
    if (enabledRef.current) playersRef.current?.music.play();
  }, []);

  const stopMusic = useCallback(() => {
    musicActiveRef.current = false;
    const music = playersRef.current?.music;
    if (!music) return;
    music.pause();
    music.seekTo(0);
  }, []);

  return { playSfx, startMusic, pauseMusic, resumeMusic, stopMusic };
}
