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
}

// ─── Internal Mutable State (stored in ref, not React state) ──────────────────
interface GameRef {
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  score: number;
  distanceM: number;
  sessionCrystals: number;
  worldIndex: number;
  speed: number;
  playerLane: 0 | 1 | 2;
  obstacles: SpawnedObstacle[];
  crystalObjects: SpawnedCrystal[];
  obstacleTimer: number;
  nextObstacleIn: number;
  crystalTimer: number;
  nextCrystalIn: number;
  scrollOffset: number;
  showPortal: boolean;
  portalTimer: number;
  jumping: boolean;
  jumpTimer: number;
  lastTs: number;
  idCounter: number;
}

function makeGameRef(): GameRef {
  return {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    distanceM: 0,
    sessionCrystals: 0,
    worldIndex: 0,
    speed: GAME_CONFIG.INITIAL_SPEED,
    playerLane: 1,
    obstacles: [],
    crystalObjects: [],
    obstacleTimer: 0,
    nextObstacleIn: 1600,
    crystalTimer: 0,
    nextCrystalIn: 1000,
    scrollOffset: 0,
    showPortal: false,
    portalTimer: 0,
    jumping: false,
    jumpTimer: 0,
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
  distanceM: number;
  sessionCrystals: number;
  worldIndex: number;
  worldProgress: number;
  showPortal: boolean;
  scrollOffset: number;
  /** Current forward speed — read-only, used for visual effects only. */
  speed: number;
  obstacles: SpawnedObstacle[];
  crystalObjects: SpawnedCrystal[];
}

function makeDisplayState(): GameDisplayState {
  return {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    distanceM: 0,
    sessionCrystals: 0,
    worldIndex: 0,
    worldProgress: 0,
    showPortal: false,
    scrollOffset: 0,
    speed: GAME_CONFIG.INITIAL_SPEED,
    obstacles: [],
    crystalObjects: [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Spawn an obstacle that is guaranteed to leave at least one lane clear.
 * Rule: count lanes with obstacles in the mid-field (progress 0.15–0.90).
 * If 2 lanes are already occupied, skip. Otherwise pick an unoccupied lane.
 */
function spawnObstacle(g: GameRef) {
  if (g.obstacles.length >= GAME_CONFIG.MAX_OBSTACLES) return;

  // Enforce vertical spacing: never spawn while another obstacle is still
  // near the horizon — guarantees the player always has time to react and
  // make up to two lane changes between walls of obstacles.
  if (g.obstacles.some((o) => !o.hit && o.progress < 0.3)) return;

  // Lanes that currently have ANY live obstacle approaching (from horizon
  // to just before the player). Counting the full window means at most 2
  // lanes can ever hold live obstacles — one lane is always clear.
  const occupiedLanes = new Set<number>(
    g.obstacles
      .filter((o) => o.progress < 0.92 && !o.hit)
      .map((o) => o.lane)
  );

  // If 2 lanes are already occupied, spawning would block all 3 — skip
  if (occupiedLanes.size >= 2) return;

  // Pick a lane that isn't occupied
  const available = ([0, 1, 2] as const).filter((l) => !occupiedLanes.has(l));
  const lane = available[Math.floor(Math.random() * available.length)];

  const worldId = WORLDS[g.worldIndex].id;
  const types = OBSTACLE_TYPES_BY_WORLD[worldId] ?? ['block'];
  const type = types[Math.floor(Math.random() * types.length)] as ObstacleType;

  g.obstacles.push({ id: `o${g.idCounter++}`, lane, progress: 0, type, hit: false });
}

/**
 * Spawn 1–3 crystals in a row in the same lane, staggered along the track.
 * Crystals never go in a lane that has an obstacle very close ahead.
 */
function spawnCrystals(g: GameRef) {
  if (g.crystalObjects.length >= GAME_CONFIG.MAX_CRYSTALS) return;

  // Avoid lanes that have a close obstacle (would overlap visually)
  const dangerLanes = new Set<number>(
    g.obstacles
      .filter((o) => o.progress > 0.0 && o.progress < 0.5 && !o.hit)
      .map((o) => o.lane)
  );
  const available = ([0, 1, 2] as const).filter((l) => !dangerLanes.has(l));
  if (available.length === 0) return;

  const lane = available[Math.floor(Math.random() * available.length)];
  const count = Math.random() > 0.45 ? 3 : 1;

  for (let i = 0; i < count; i++) {
    if (g.crystalObjects.length >= GAME_CONFIG.MAX_CRYSTALS) break;
    g.crystalObjects.push({
      id: `c${g.idCounter++}`,
      lane,
      progress: 0 - i * 0.13,
      collected: false,
    });
  }
}

// ─── Audio Event Hooks ────────────────────────────────────────────────────────
export interface GameSounds {
  pickup?: () => void;
  crash?: () => void;
  swipe?: () => void;
  jump?: () => void;
}

// ─── Core Tick Function ───────────────────────────────────────────────────────
function tick(
  g: GameRef,
  dt: number,
  haptics: boolean,
  sounds: GameSounds,
  onGameOver: (score: number, crystals: number, distance: number) => void
): boolean {
  // 1. Speed ramp
  g.speed = Math.min(g.speed + GAME_CONFIG.SPEED_RAMP * dt, GAME_CONFIG.MAX_SPEED);

  // 2. Score + distance
  const speedRatio = g.speed / GAME_CONFIG.INITIAL_SPEED;
  g.score += (GAME_CONFIG.SCORE_PER_SEC * speedRatio * dt) / 1000;
  g.distanceM += g.speed * GAME_CONFIG.DIST_SCALE * (dt / 1000);

  // 3. Move objects
  const inc = g.speed * (dt / 1000);
  for (const o of g.obstacles) o.progress += inc;
  for (const c of g.crystalObjects) c.progress += inc;

  // 4. Jump timer — while airborne the player clears obstacles
  if (g.jumping) {
    g.jumpTimer -= dt;
    if (g.jumpTimer <= 0) g.jumping = false;
  }

  // 5. Collision detection — one hit = instant death (skipped mid-jump)
  for (const o of g.obstacles) {
    if (
      !g.jumping &&
      !o.hit &&
      o.lane === g.playerLane &&
      o.progress >= GAME_CONFIG.COLLISION_NEAR &&
      o.progress <= GAME_CONFIG.COLLISION_FAR
    ) {
      o.hit = true;
      g.running = false;
      g.gameOver = true;
      sounds.crash?.();
      if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onGameOver(Math.floor(g.score), g.sessionCrystals, Math.floor(g.distanceM));
      return false;
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
      sounds.pickup?.();
      if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // 6. Spawn obstacles — interval shrinks as speed rises
  g.obstacleTimer += dt;
  if (g.obstacleTimer >= g.nextObstacleIn) {
    g.obstacleTimer = 0;
    const base = Math.max(550, 1800 - g.speed * 520);
    g.nextObstacleIn = randRange(base * 0.72, base * 1.28);
    spawnObstacle(g);
  }

  // 7. Spawn crystals
  g.crystalTimer += dt;
  if (g.crystalTimer >= g.nextCrystalIn) {
    g.crystalTimer = 0;
    const base = Math.max(350, 1000 - g.speed * 250);
    g.nextCrystalIn = randRange(base * 0.65, base * 1.35);
    spawnCrystals(g);
  }

  // 8. Cleanup passed objects
  g.obstacles = g.obstacles.filter((o) => o.progress < 1.2 && !o.hit);
  g.crystalObjects = g.crystalObjects.filter((c) => c.progress < 1.2 && !c.collected);

  // 9. Scroll offset (track grid animation)
  g.scrollOffset = (g.scrollOffset + g.speed * 0.40 * (dt / 1000)) % 1;

  // 10. World progression
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
export function useGame(hapticsEnabled = true, sounds: GameSounds = {}) {
  const gameRef = useRef<GameRef>(makeGameRef());
  // Ref so audio callbacks never destabilize game-loop callbacks
  const soundsRef = useRef<GameSounds>(sounds);
  soundsRef.current = sounds;
  const [displayState, setDisplayState] = useState<GameDisplayState>(makeDisplayState());

  // Stable animated values
  const playerX = useRef(new Animated.Value(LANE_X_BOTTOM[1])).current;
  const boardTilt = useRef(new Animated.Value(0)).current;
  const jumpY = useRef(new Animated.Value(0)).current;
  // Damped follow camera — trails the player's lane with a soft spring (visual only)
  const cameraX = useRef(new Animated.Value(LANE_X_BOTTOM[1])).current;
  const cameraAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const playerLaneRef = useRef<0 | 1 | 2>(1);
  const animFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | undefined>(undefined);
  const gameOverCallbackRef = useRef<((score: number, crystals: number, distance: number) => void) | null>(null);
  const laneAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const syncDisplay = useCallback(() => {
    const g = gameRef.current;
    setDisplayState({
      running: g.running,
      paused: g.paused,
      gameOver: g.gameOver,
      score: Math.floor(g.score),
      distanceM: Math.floor(g.distanceM),
      sessionCrystals: g.sessionCrystals,
      worldIndex: g.worldIndex,
      worldProgress: (g.score % GAME_CONFIG.WORLD_SCORE_INTERVAL) / GAME_CONFIG.WORLD_SCORE_INTERVAL,
      showPortal: g.showPortal,
      scrollOffset: g.scrollOffset,
      speed: g.speed,
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

  const onGameOverCallback = useCallback(
    (score: number, crystals: number, distance: number) => {
      gameOverCallbackRef.current?.(score, crystals, distance);
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
      gCurrent.playerLane = playerLaneRef.current;

      const keepGoing = tick(gCurrent, dt, hapticsEnabled, soundsRef.current, onGameOverCallback);

      // Drive the jump arc from the game clock so pausing freezes the
      // visual and the collision immunity together (no desync).
      if (gCurrent.jumping) {
        const t = 1 - gCurrent.jumpTimer / GAME_CONFIG.JUMP_MS; // 0 → 1
        jumpY.setValue(-GAME_CONFIG.JUMP_HEIGHT * 4 * t * (1 - t)); // parabola
      } else {
        jumpY.setValue(0);
      }

      syncDisplay();

      if (!keepGoing) {
        stopLoop();
        return;
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [hapticsEnabled, onGameOverCallback, stopLoop, syncDisplay, jumpY]);

  const startGame = useCallback(
    (worldIndex = 0, onGameOver?: (score: number, crystals: number, distance: number) => void) => {
      stopLoop();
      gameOverCallbackRef.current = onGameOver ?? null;

      const g = makeGameRef();
      g.running = true;
      g.worldIndex = worldIndex;
      gameRef.current = g;

      playerLaneRef.current = 1;
      playerX.setValue(LANE_X_BOTTOM[1]);
      boardTilt.setValue(0);
      jumpY.setValue(0);
      cameraAnimRef.current?.stop();
      cameraX.setValue(LANE_X_BOTTOM[1]);
      syncDisplay();
      startLoop();
    },
    [stopLoop, syncDisplay, startLoop, playerX, boardTilt, jumpY]
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

  /**
   * Lane change with banking tilt animation.
   * Fires immediately when called (from swipe gesture in GameScene).
   */
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

      // Stop any in-progress tilt/move
      laneAnimRef.current?.stop();

      const tiltAngle = side === 'left' ? -22 : 22;

      laneAnimRef.current = Animated.parallel([
        // Slide to new lane
        Animated.timing(playerX, {
          toValue: LANE_X_BOTTOM[next],
          duration: GAME_CONFIG.LANE_CHANGE_MS,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Bank into turn, then straighten
        Animated.sequence([
          Animated.timing(boardTilt, {
            toValue: tiltAngle,
            duration: 70,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(boardTilt, {
            toValue: 0,
            duration: GAME_CONFIG.LANE_CHANGE_MS + 30,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ]),
      ]);
      laneAnimRef.current.start();

      // Camera follows with soft damping — lags slightly behind the board
      cameraAnimRef.current?.stop();
      cameraAnimRef.current = Animated.spring(cameraX, {
        toValue: LANE_X_BOTTOM[next],
        useNativeDriver: true,
        damping: 16,
        stiffness: 70,
        mass: 1,
      });
      cameraAnimRef.current.start();

      soundsRef.current.swipe?.();
      if (hapticsEnabled) Haptics.selectionAsync();
    },
    [playerX, boardTilt, cameraX, hapticsEnabled]
  );

  /**
   * Jump: swipe up. Board rises in an arc; obstacles are cleared mid-air.
   */
  const handleJump = useCallback(() => {
    const g = gameRef.current;
    if (!g.running || g.paused || g.gameOver || g.jumping) return;

    // The game loop drives the jump arc (see startLoop) so that pause
    // freezes both the visual position and the collision immunity.
    g.jumping = true;
    g.jumpTimer = GAME_CONFIG.JUMP_MS;

    soundsRef.current.jump?.();
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [hapticsEnabled]);

  useEffect(
    () => () => {
      stopLoop();
      laneAnimRef.current?.stop();
      cameraAnimRef.current?.stop();
    },
    [stopLoop]
  );

  return {
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
  };
}
