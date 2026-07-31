import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GameScene } from '@/components/game/GameScene';
import { HUD } from '@/components/game/HUD';
import { PauseOverlay } from '@/components/game/PauseOverlay';
import { useGame } from '@/hooks/useGame';
import { usePlayer } from '@/context/PlayerContext';

export default function GameScreen() {
  const { hapticsEnabled, addCrystals, updateHighScore, incrementRuns } = usePlayer();
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  } = useGame(hapticsEnabled);

  const handleGameOver = useCallback(
    (score: number, crystals: number, distance: number) => {
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
  }, [startGame, handleGameOver]);

  const handleQuit = useCallback(() => {
    router.replace('/menu');
  }, []);

  // Start game when screen mounts
  useEffect(() => {
    startGame(0, handleGameOver);
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

      <HUD displayState={displayState} onPause={pauseGame} />

      {displayState.paused && (
        <PauseOverlay
          onResume={resumeGame}
          onRestart={handleRestart}
          onQuit={handleQuit}
        />
      )}
    </View>
  );
}
