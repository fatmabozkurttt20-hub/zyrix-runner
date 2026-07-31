import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GameScene } from '@/components/game/GameScene';
import { HUD } from '@/components/game/HUD';
import { PauseOverlay } from '@/components/game/PauseOverlay';
import { useGame } from '@/hooks/useGame';
import { useGameAudio } from '@/hooks/useGameAudio';
import { stopMenuMusicNow } from '@/hooks/useMenuAudio';
import { usePlayer } from '@/context/PlayerContext';

export default function GameScreen() {
  const { hapticsEnabled, soundEnabled, toggleSound, addCrystals, updateHighScore, incrementRuns } =
    usePlayer();
  const audio = useGameAudio(soundEnabled);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean handoff: silence the ambient menu loop before gameplay music starts
  useEffect(() => {
    stopMenuMusicNow();
  }, []);

  // Cancel any pending game-over navigation if the screen unmounts
  useEffect(
    () => () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    },
    []
  );
  const {
    displayState,
    playerX,
    boardTilt,
    jumpY,
    cameraX,
    startGame,
    pauseGame,
    resumeGame,
    handleTouch,
    handleJump,
  } = useGame(hapticsEnabled, {
    pickup: () => audio.playSfx('pickup'),
    crash: () => audio.playSfx('crash'),
    swipe: () => audio.playSfx('swipe'),
    jump: () => audio.playSfx('jump'),
  });

  const handleGameOver = useCallback(
    (score: number, crystals: number, distance: number) => {
      audio.stopMusic();
      updateHighScore(score);
      addCrystals(crystals);
      incrementRuns();
      // Brief hold so the collision burst + screen shake are visible
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        router.replace({
          pathname: '/gameover',
          params: {
            score: String(score),
            crystals: String(crystals),
            distance: String(distance),
          },
        });
      }, 700);
    },
    [updateHighScore, addCrystals, incrementRuns]
  );

  const handleRestart = useCallback(() => {
    startGame(0, handleGameOver);
    audio.startMusic();
  }, [startGame, handleGameOver, audio]);

  const handleQuit = useCallback(() => {
    audio.stopMusic();
    router.replace('/menu');
  }, [audio]);

  const handlePause = useCallback(() => {
    pauseGame();
    audio.pauseMusic();
  }, [pauseGame, audio]);

  const handleResume = useCallback(() => {
    resumeGame();
    audio.resumeMusic();
  }, [resumeGame, audio]);

  // Start game when screen mounts
  useEffect(() => {
    startGame(0, handleGameOver);
    audio.startMusic();
  }, []); // intentionally run once on mount

  const onSwipeLeft = useCallback(() => handleTouch('left'), [handleTouch]);
  const onSwipeRight = useCallback(() => handleTouch('right'), [handleTouch]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <GameScene
        displayState={displayState}
        playerX={playerX}
        boardTilt={boardTilt}
        jumpY={jumpY}
        cameraX={cameraX}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        onSwipeUp={handleJump}
      />

      <HUD
        displayState={displayState}
        onPause={handlePause}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      {displayState.paused && (
        <PauseOverlay
          onResume={handleResume}
          onRestart={handleRestart}
          onQuit={handleQuit}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      )}
    </View>
  );
}
