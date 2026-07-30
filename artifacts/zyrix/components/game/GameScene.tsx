import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import {
  SCREEN_W,
  SCREEN_H,
  HORIZON_Y,
  PLAYER_Y,
  VP_X,
  TRACK_LEFT_X,
  TRACK_RIGHT_X,
  LANE_X_BOTTOM,
  LANE_X_HORIZON,
  GAME_CONFIG,
  OBSTACLE_DIMS,
  WORLDS,
  World,
  ObstacleType,
} from '@/constants/game';
import { GameDisplayState, SpawnedObstacle, SpawnedCrystal } from '@/hooks/useGame';

// ─── Constants ────────────────────────────────────────────────────────────────
const BOARD_W = GAME_CONFIG.PLAYER_W;
const BOARD_H = GAME_CONFIG.PLAYER_H;
const BOARD_HALF_W = BOARD_W / 2;
const TRACK_H = PLAYER_Y + 120 - HORIZON_Y;

// ─── Track Lines (SVG) ────────────────────────────────────────────────────────
const TrackLines = React.memo(({ world }: { world: World }) => {
  const div1X = VP_X + (LANE_X_BOTTOM[0] + (LANE_X_BOTTOM[1] - LANE_X_BOTTOM[0]) / 2 - VP_X) * 1;
  const div2X = VP_X + (LANE_X_BOTTOM[1] + (LANE_X_BOTTOM[2] - LANE_X_BOTTOM[1]) / 2 - VP_X) * 1;
  const laneHalfW = (LANE_X_BOTTOM[1] - LANE_X_BOTTOM[0]) / 2;
  const divH1 = LANE_X_BOTTOM[0] + laneHalfW;
  const divH2 = LANE_X_BOTTOM[1] + laneHalfW;
  return (
    <Svg
      width={SCREEN_W}
      height={TRACK_H}
      style={[StyleSheet.absoluteFill, { top: HORIZON_Y }]}
    >
      {/* Outer edges */}
      <Line x1={VP_X} y1={0} x2={TRACK_LEFT_X} y2={TRACK_H} stroke={world.trackColor} strokeWidth={2} opacity={0.85} />
      <Line x1={VP_X} y1={0} x2={TRACK_RIGHT_X} y2={TRACK_H} stroke={world.trackColor} strokeWidth={2} opacity={0.85} />
      {/* Lane dividers */}
      <Line x1={LANE_X_HORIZON[0] + (LANE_X_HORIZON[1] - LANE_X_HORIZON[0]) / 2} y1={0} x2={divH1} y2={TRACK_H} stroke={world.trackColor} strokeWidth={1} opacity={0.3} />
      <Line x1={LANE_X_HORIZON[1] + (LANE_X_HORIZON[2] - LANE_X_HORIZON[1]) / 2} y1={0} x2={divH2} y2={TRACK_H} stroke={world.trackColor} strokeWidth={1} opacity={0.3} />
    </Svg>
  );
});

// ─── Speed Lines (scrolling horizontal grid) ──────────────────────────────────
function SpeedLines({ scrollOffset, world }: { scrollOffset: number; world: World }) {
  const lines = [];
  const N = 8;
  for (let i = 0; i < N; i++) {
    const progress = ((i / N) + scrollOffset) % 1;
    if (progress < 0.04) continue;
    const y = HORIZON_Y + (PLAYER_Y - HORIZON_Y) * progress;
    const leftX = VP_X + (TRACK_LEFT_X - VP_X) * progress;
    const rightX = VP_X + (TRACK_RIGHT_X - VP_X) * progress;
    lines.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left: leftX,
          top: y,
          width: rightX - leftX,
          height: 1,
          backgroundColor: world.trackColor,
          opacity: 0.08 + 0.22 * progress,
        }}
      />
    );
  }
  return <>{lines}</>;
}

// ─── Obstacle View ────────────────────────────────────────────────────────────
function ObstacleView({ obstacle, world }: { obstacle: SpawnedObstacle; world: World }) {
  const { x, y, scale } = usePerspPos(obstacle.lane, obstacle.progress);
  const base = GAME_CONFIG.OBSTACLE_BASE_SIZE * scale;
  const dims = OBSTACLE_DIMS[obstacle.type] ?? OBSTACLE_DIMS.block;
  const w = base * dims.w;
  const h = base * dims.h;
  const radius = Math.max(2, base * 0.07);
  const opacity = obstacle.hit ? 0 : 1;

  if (obstacle.type === 'ring') {
    return (
      <View
        style={{
          position: 'absolute',
          left: x - w / 2,
          top: y - h / 2,
          width: w,
          height: h,
          borderRadius: w / 2,
          borderWidth: Math.max(1.5, w * 0.11),
          borderColor: world.obstacleColor,
          backgroundColor: 'transparent',
          opacity,
        }}
      />
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        backgroundColor: world.obstacleColor,
        borderRadius: radius,
        opacity,
        shadowColor: world.obstacleColor,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: Math.max(4, base * 0.18),
        shadowOpacity: 0.85,
        elevation: 5,
      }}
    />
  );
}

// ─── Crystal View ─────────────────────────────────────────────────────────────
function CrystalView({ crystal, world }: { crystal: SpawnedCrystal; world: World }) {
  const { x, y, scale } = usePerspPos(crystal.lane, crystal.progress);
  const size = GAME_CONFIG.CRYSTAL_BASE_SIZE * scale;
  const radius = Math.max(1.5, size * 0.14);
  if (crystal.collected) return null;
  return (
    <View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        backgroundColor: world.crystalColor,
        borderRadius: radius,
        transform: [{ rotate: `${crystal.rotation}deg` }],
        shadowColor: world.crystalColor,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: Math.max(6, size * 0.45),
        shadowOpacity: 1,
        elevation: 6,
      }}
    />
  );
}

// ─── Player View ──────────────────────────────────────────────────────────────
function PlayerView({
  playerX,
  invincible,
  world,
}: {
  playerX: Animated.Value;
  invincible: boolean;
  world: World;
}) {
  const hoverY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;
  const playerOpacity = useRef(new Animated.Value(1)).current;
  const flashRef = useRef<Animated.CompositeAnimation | null>(null);

  const translateX = useRef(Animated.subtract(playerX, BOARD_HALF_W)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverY, { toValue: -5, duration: 820, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(hoverY, { toValue: 0, duration: 820, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [hoverY]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1.0, duration: 650, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [glowOpacity]);

  useEffect(() => {
    if (invincible) {
      flashRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(playerOpacity, { toValue: 0.15, duration: 110, useNativeDriver: true }),
          Animated.timing(playerOpacity, { toValue: 1, duration: 110, useNativeDriver: true }),
        ])
      );
      flashRef.current.start();
    } else {
      flashRef.current?.stop();
      flashRef.current = null;
      playerOpacity.setValue(1);
    }
  }, [invincible, playerOpacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: PLAYER_Y - BOARD_H / 2,
        width: BOARD_W,
        height: BOARD_H,
        opacity: playerOpacity,
        transform: [{ translateX }, { translateY: hoverY }],
      }}
    >
      {/* Thruster glow */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -14,
          left: BOARD_W * 0.12,
          right: BOARD_W * 0.12,
          height: 14,
          borderRadius: 7,
          backgroundColor: world.trackColor,
          opacity: glowOpacity,
          shadowColor: world.trackColor,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 22,
          shadowOpacity: 1,
          elevation: 14,
        }}
      />
      {/* Board body */}
      <View
        style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          borderRadius: 8,
          backgroundColor: '#0C0C20',
          borderWidth: 1.5,
          borderColor: world.trackColor,
        }}
      />
      {/* Accent stripe */}
      <View
        style={{
          position: 'absolute',
          left: BOARD_W * 0.22,
          right: BOARD_W * 0.22,
          top: BOARD_H * 0.32,
          height: BOARD_H * 0.36,
          backgroundColor: world.accentColor,
          opacity: 0.55,
          borderRadius: 2,
        }}
      />
      {/* Rider silhouette */}
      <View
        style={{
          position: 'absolute',
          left: BOARD_W * 0.36,
          bottom: BOARD_H + 1,
          width: BOARD_W * 0.28,
          height: BOARD_W * 0.36,
          backgroundColor: '#EEEEFF',
          borderRadius: BOARD_W * 0.14,
          opacity: 0.88,
        }}
      />
    </Animated.View>
  );
}

// ─── Portal Flash ─────────────────────────────────────────────────────────────
function PortalFlash({ world }: { world: World }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.92, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [opacity]);
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: world.trackColor, opacity, zIndex: 90 }]}
      pointerEvents="none"
    />
  );
}

// ─── Stars (background particles) ────────────────────────────────────────────
const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * SCREEN_W,
  y: Math.random() * HORIZON_Y * 0.9,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.6 + 0.2,
}));

function Stars({ world }: { world: World }) {
  return (
    <>
      {STARS.map((s) => (
        <View
          key={s.id}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: world.starColor,
            opacity: s.opacity,
          }}
        />
      ))}
    </>
  );
}

// ─── Perspective Helper ───────────────────────────────────────────────────────
function usePerspPos(lane: 0 | 1 | 2, progress: number) {
  const t = Math.max(0, Math.min(1.3, progress));
  const ease = Math.pow(t, 0.88);
  const x = LANE_X_HORIZON[lane] + (LANE_X_BOTTOM[lane] - LANE_X_HORIZON[lane]) * ease;
  const y = HORIZON_Y + (PLAYER_Y - HORIZON_Y) * ease;
  const scale = Math.max(0.05, 0.06 + 0.94 * ease);
  return { x, y, scale };
}

// ─── Main GameScene ───────────────────────────────────────────────────────────
interface GameSceneProps {
  displayState: GameDisplayState;
  playerX: Animated.Value;
  onTouchLeft: () => void;
  onTouchRight: () => void;
}

export function GameScene({ displayState, playerX, onTouchLeft, onTouchRight }: GameSceneProps) {
  const world = WORLDS[displayState.worldIndex];

  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => false,
        onPanResponderGrant: (e) => {
          const { locationX } = e.nativeEvent;
          if (locationX < SCREEN_W / 2) {
            onTouchLeft();
          } else {
            onTouchRight();
          }
        },
      }).panHandlers,
    [onTouchLeft, onTouchRight]
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: world.skyTop }]} {...panHandlers}>
      {/* Sky gradient */}
      <LinearGradient
        colors={[world.skyTop, world.skyBottom]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HORIZON_Y + 20 }}
      />

      {/* Stars */}
      <Stars world={world} />

      {/* Horizon glow */}
      <View
        style={{
          position: 'absolute',
          top: HORIZON_Y - 18,
          left: 0,
          right: 0,
          height: 36,
          backgroundColor: world.horizonGlow,
        }}
      />

      {/* Ground gradient */}
      <LinearGradient
        colors={[world.groundTop, world.groundBottom]}
        style={{ position: 'absolute', top: HORIZON_Y, left: 0, right: 0, bottom: 0 }}
      />

      {/* Track perspective lines */}
      <TrackLines world={world} />

      {/* Scrolling speed lines */}
      <SpeedLines scrollOffset={displayState.scrollOffset} world={world} />

      {/* Crystals (render below obstacles) */}
      {displayState.crystalObjects.map((c) => (
        <CrystalView key={c.id} crystal={c} world={world} />
      ))}

      {/* Obstacles */}
      {displayState.obstacles.map((o) => (
        <ObstacleView key={o.id} obstacle={o} world={world} />
      ))}

      {/* Player */}
      <PlayerView playerX={playerX} invincible={displayState.invincible} world={world} />

      {/* Portal transition flash */}
      {displayState.showPortal && <PortalFlash key={displayState.worldIndex} world={world} />}

      {/* Web padding */}
      {Platform.OS === 'web' && <View style={{ height: 34 }} />}
    </View>
  );
}
