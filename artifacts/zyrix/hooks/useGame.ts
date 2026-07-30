import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  GAME_CONFIG,
  WORLDS,
  LANE_X_BOTTOM,
  OBSTACLE_TYPES_BY_WORLD,
  ObstacleType,
} from '@/constants/game';

// ─── Game Object Types ────────────────────────────────────────────────────────
export interface SpawnedObstacle {
  id: string;
  lane: 0 | 1 | 2;
  progress: number;
  type: ObstacleType;
  hit: boolean;
}

export interface SpawnedCrystal {
  id: string;
  lane: 0 | 1 | 2;
  progress: number;
  collected: boolean;
  rotation: number;
}

// ─── Internal Mutable State (stored in ref, not React state) ──────────────────
interface GameRef {
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  score: number;
  sessionCrystals: number;
  lives: number;
  worldIndex: number;
  speed: number;
  playerLane: 0 | 1 | 2;
  invincible: boolean;
  invincibleTimer: number;
  obstacles: SpawnedObstacle[];
  crystalObjects: SpawnedCrystal[];
  obstacleTimer: number;
  nextObstacleIn: number;
  crystalTimer: number;
  nextCrystalIn: number;
  scrollOffset: number;
  showPortal: boolean;
  portalTimer: number;
  lastTs: number;
  idCounter: number;
}

function makeGameRef(): GameRef {
  return {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    sessionCrystals: 0,
    lives: GAME_CONFIG.LIVES,
    worldIndex: 0,
    speed: GAME_CONFIG.INITIAL_SPEED,
    playerLane: 1,
    invincible: false,
    invincibleTimer: 0,
    obstacles: [],
    crystalObjects: [],
    obstacleTimer: 0,
    nextObstacleIn: 1400,
    crystalTimer: 0,
    nextCrystalIn: 900,
    scrollOffset: 0,
    showPortal: false,
    portalTimer: 0,
    lastTs: 0,
    idCounter: 0,
  };
}

// ─── React Display State (drives rendering) ───────────────────────────────────
export interface GameDisplayState {
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  score: number;
  sessionCrystals: number;
  lives: number;
  worldIndex: number;
  worldProgress: number; // 0–1 progress to next world
  invincible: boolean;
  showPortal: boolean;
  scrollOffset: number;
  obstacles: SpawnedObstacle[];
  crystalObjects: SpawnedCrystal[];
}

function makeDisplayState(): GameDisplayState {
  return {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    sessionCrystals: 0,
    lives: GAME_CONFIG.LIVES,
    worldIndex: 0,
    worldProgress: 0,
    invincible: false,
    showPortal: false,
    scrollOffset: 0,
    obstacles: [],
    crystalObjects: [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function spawnObstacle(g: GameRef) {
  if (g.obstacles.length >= GAME_CONFIG.MAX_OBSTACLES) return;
  const worldId = WORLDS[g.worldIndex].id;
  const types = OBSTACLE_TYPES_BY_WORLD[worldId] ?? ['block'];
  const type = types[Math.floor(Math.random() * types.length)] as ObstacleType;

  // Avoid the same lane as the last 2 obstacles (gives player room)
  const recentLanes = g.obstacles.slice(-2).map((o) => o.lane);
  let lane: 0 | 1 | 2;
  let tries = 0;
  do {
    lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    tries++;
  } while (recentLanes.includes(lane) && tries < 8 && Math.random() > 0.25);

  g.obstacles.push({ id: `o${g.idCounter++}`, lane, progress: -0.06, type, hit: false });
}

function spawnCrystals(g: GameRef) {
  const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
  const count = Math.random() > 0.55 ? 3 : 1;
  for (let i = 0; i < count; i++) {
    if (g.crystalObjects.length >= GAME_CONFIG.MAX_CRYSTALS) break;
    g.crystalObjects.push({
      id: `c${g.idCounter++}`,
      lane,
      progress: -0.06 - i * 0.14,
      collected: false,
      rotation: Math.random() * 360,
    });
  }
}

// ─── Core Tick Function (pure, no React deps) ─────────────────────────────────
function tick(
  g: GameRef,
  dt: number,
  haptics: boolean,
  onHit: () => void,
  onGameOver: (score: number, crystals: number) => void
): boolean {
  // 1. Speed / difficulty scaling
  g.speed = Math.min(g.speed + GAME_CONFIG.SPEED_RAMP * dt, GAME_CONFIG.MAX_SPEED);

  // 2. Score
  const speedRatio = g.speed / GAME_CONFIG.INITIAL_SPEED;
  g.score += (GAME_CONFIG.SCORE_PER_SEC * speedRatio * dt) / 1000;

  // 3. Move game objects
  const inc = g.speed * (dt / 1000);
  for (const o of g.obstacles) o.progress += inc;
  for (const c of g.crystalObjects) {
    c.progress += inc;
    c.rotation = (c.rotation + 180 * (dt / 1000)) % 360;
  }

  // 4. Collision detection
  if (!g.invincible) {
    for (const o of g.obstacles) {
      if (
        !o.hit &&
        o.lane === g.playerLane &&
        o.progress >= GAME_CONFIG.COLLISION_NEAR &&
        o.progress <= GAME_CONFIG.COLLISION_FAR
      ) {
        o.hit = true;
        g.lives--;
        g.invincible = true;
        g.invincibleTimer = GAME_CONFIG.INVINCIBLE_MS;
        if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onHit();
        if (g.lives <= 0) {
          g.running = false;
          g.gameOver = true;
          onGameOver(Math.floor(g.score), g.sessionCrystals);
          return false;
        }
        break;
      }
    }
  }

  // 5. Crystal collection
  for (const c of g.crystalObjects) {
    if (
      !c.collected &&
      c.lane === g.playerLane &&
      c.progress >= GAME_CONFIG.CRYSTAL_NEAR &&
      c.progress <= GAME_CONFIG.CRYSTAL_FAR
    ) {
      c.collected = true;
      g.sessionCrystals++;
      g.score += GAME_CONFIG.CRYSTAL_SCORE;
      if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // 6. Invincibility timer
  if (g.invincible) {
    g.invincibleTimer -= dt;
    if (g.invincibleTimer <= 0) g.invincible = false;
  }

  // 7. Spawn obstacles
  g.obstacleTimer += dt;
  if (g.obstacleTimer >= g.nextObstacleIn) {
    g.obstacleTimer = 0;
    const base = Math.max(600, 1900 - g.speed * 600);
    g.nextObstacleIn = randRange(base * 0.75, base * 1.25);
    spawnObstacle(g);
  }

  // 8. Spawn crystals
  g.crystalTimer += dt;
  if (g.crystalTimer >= g.nextCrystalIn) {
    g.crystalTimer = 0;
    const base = Math.max(380, 1100 - g.speed * 300);
    g.nextCrystalIn = randRange(base * 0.7, base * 1.3);
    spawnCrystals(g);
  }

  // 9. Cleanup off-screen objects
  g.obstacles = g.obstacles.filter((o) => o.progress < 1.25 && !o.hit);
  g.crystalObjects = g.crystalObjects.filter((c) => c.progress < 1.25 && !c.collected);

  // 10. Scroll offset (drives track grid animation)
  g.scrollOffset = (g.scrollOffset + g.speed * 0.38 * (dt / 1000)) % 1;

  // 11. World progression
  const newWorld = Math.floor(g.score / GAME_CONFIG.WORLD_SCORE_INTERVAL) % WORLDS.length;
  if (newWorld !== g.worldIndex) {
    g.worldIndex = newWorld;
    g.showPortal = true;
    g.portalTimer = 1400;
  }
  if (g.showPortal) {
    g.portalTimer -= dt;
    if (g.portalTimer <= 0) g.showPortal = false;
  }

  return true;
}

// ─── useGame Hook ─────────────────────────────────────────────────────────────
export function useGame(hapticsEnabled = true) {
  const gameRef = useRef<GameRef>(makeGameRef());
  const [displayState, setDisplayState] = useState<GameDisplayState>(makeDisplayState());

  // Animated values (stable refs, never recreated)
  const playerX = useRef(new Animated.Value(LANE_X_BOTTOM[1])).current;
  const playerLaneRef = useRef<0 | 1 | 2>(1);
  const animFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | undefined>(undefined);
  const gameOverCallbackRef = useRef<((score: number, crystals: number) => void) | null>(null);

  const syncDisplay = useCallback(() => {
    const g = gameRef.current;
    setDisplayState({
      running: g.running,
      paused: g.paused,
      gameOver: g.gameOver,
      score: Math.floor(g.score),
      sessionCrystals: g.sessionCrystals,
      lives: g.lives,
      worldIndex: g.worldIndex,
      worldProgress: (g.score % GAME_CONFIG.WORLD_SCORE_INTERVAL) / GAME_CONFIG.WORLD_SCORE_INTERVAL,
      invincible: g.invincible,
      showPortal: g.showPortal,
      scrollOffset: g.scrollOffset,
      obstacles: [...g.obstacles],
      crystalObjects: [...g.crystalObjects],
    });
  }, []);

  const stopLoop = useCallback(() => {
    if (animFrameRef.current !== undefined) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = undefined;
    }
  }, []);

  const onHitCallback = useCallback(() => {
    // Invincibility flash is handled in GameScene via displayState.invincible
  }, []);

  const onGameOverCallback = useCallback(
    (score: number, crystals: number) => {
      gameOverCallbackRef.current?.(score, crystals);
    },
    []
  );

  const startLoop = useCallback(() => {
    const g = gameRef.current;
    g.lastTs = Date.now();

    const loop = () => {
      const gCurrent = gameRef.current;
      if (!gCurrent.running || gCurrent.paused) return;

      const now = Date.now();
      const dt = Math.min(now - gCurrent.lastTs, 50);
      gCurrent.lastTs = now;
      // Sync player lane from animated ref
      gCurrent.playerLane = playerLaneRef.current;

      const keepGoing = tick(gCurrent, dt, hapticsEnabled, onHitCallback, onGameOverCallback);
      syncDisplay();

      if (!keepGoing) {
        stopLoop();
        return;
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [hapticsEnabled, onHitCallback, onGameOverCallback, stopLoop, syncDisplay]);

  // Public: start a new game
  const startGame = useCallback(
    (worldIndex = 0, onGameOver?: (score: number, crystals: number) => void) => {
      stopLoop();
      gameOverCallbackRef.current = onGameOver ?? null;

      const g = makeGameRef();
      g.running = true;
      g.worldIndex = worldIndex;
      gameRef.current = g;

      playerLaneRef.current = 1;
      playerX.setValue(LANE_X_BOTTOM[1]);
      syncDisplay();
      startLoop();
    },
    [stopLoop, syncDisplay, startLoop, playerX]
  );

  const pauseGame = useCallback(() => {
    gameRef.current.paused = true;
    stopLoop();
    syncDisplay();
  }, [stopLoop, syncDisplay]);

  const resumeGame = useCallback(() => {
    const g = gameRef.current;
    if (!g.running || g.gameOver) return;
    g.paused = false;
    g.lastTs = Date.now();
    startLoop();
    syncDisplay();
  }, [startLoop, syncDisplay]);

  // One-finger control: left half = move left, right half = move right
  const handleTouch = useCallback(
    (side: 'left' | 'right') => {
      const g = gameRef.current;
      if (!g.running || g.paused || g.gameOver) return;

      const current = playerLaneRef.current;
      let next = current;
      if (side === 'left' && current > 0) next = (current - 1) as 0 | 1 | 2;
      else if (side === 'right' && current < 2) next = (current + 1) as 0 | 1 | 2;
      else return;

      playerLaneRef.current = next;
      Animated.timing(playerX, {
        toValue: LANE_X_BOTTOM[next],
        duration: GAME_CONFIG.LANE_CHANGE_MS,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }).start();

      if (hapticsEnabled) Haptics.selectionAsync();
    },
    [playerX, hapticsEnabled]
  );

  // Cleanup on unmount
  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    displayState,
    playerX,
    startGame,
    pauseGame,
    resumeGame,
    handleTouch,
  };
}
