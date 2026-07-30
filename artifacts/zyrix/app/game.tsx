import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GameScene } from '@/components/game/GameScene';
import { HUD } from '@/components/game/HUD';
import { PauseOverlay } from '@/components/game/PauseOverlay';
import { useGame } from '@/hooks/useGame';
import { usePlayer } from '@/context/PlayerContext';

export default function GameScreen() {
  const { hapticsEnabled, addCrystals, updateHighScore, incrementRuns, selectedBoardId } = usePlayer();
  const { displayState, playerX, startGame, pauseGame, resumeGame, handleTouch } = useGame(hapticsEnabled);

  const handleGameOver = useCallback(
    (score: number, crystals: number) => {
      updateHighScore(score);
      addCrystals(crystals);
      incrementRuns();
      router.replace({
        pathname: '/gameover',
        params: { score: String(score), crystals: String(crystals) },
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

  const onTouchLeft = useCallback(() => handleTouch('left'), [handleTouch]);
  const onTouchRight = useCallback(() => handleTouch('right'), [handleTouch]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <GameScene
        displayState={displayState}
        playerX={playerX}
        onTouchLeft={onTouchLeft}
        onTouchRight={onTouchRight}
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
