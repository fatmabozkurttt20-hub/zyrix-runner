import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GameScene } from '@/components/game/GameScene';
import { HUD } from '@/components/game/HUD';
import { PauseOverlay } from '@/components/game/PauseOverlay';
import { useGame } from '@/hooks/useGame';
import { usePlayer } from '@/context/PlayerContext';

export default function GameScreen() {
  const { hapticsEnabled, addCrystals, updateHighScore, incrementRuns } = usePlayer();
  const {
    displayState,
    playerX,
    boardTilt,
    jumpY,
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
      router.replace({
        pathname: '/gameover',
        params: {
          score: String(score),
          crystals: String(crystals),
          distance: String(distance),
        },
      });
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
