import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  Platform,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Path, Circle, Ellipse } from 'react-native-svg';
import {
  SCREEN_W,
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
} from '@/constants/game';
import { GameDisplayState, SpawnedObstacle, SpawnedCrystal } from '@/hooks/useGame';

// ─── Constants ────────────────────────────────────────────────────────────────
const BOARD_W = GAME_CONFIG.PLAYER_W;
const BOARD_H = GAME_CONFIG.PLAYER_H;
const BOARD_HALF_W = BOARD_W / 2;
const TRACK_H = PLAYER_Y + 120 - HORIZON_Y;

// ─── Perspective Helper ───────────────────────────────────────────────────────
function perspPos(lane: 0 | 1 | 2, progress: number) {
  const t = Math.max(0, Math.min(1.3, progress));
  const ease = Math.pow(t, 0.85);
  const x = LANE_X_HORIZON[lane] + (LANE_X_BOTTOM[lane] - LANE_X_HORIZON[lane]) * ease;
  const y = HORIZON_Y + (PLAYER_Y - HORIZON_Y) * ease;
  const scale = Math.max(0.04, 0.05 + 0.95 * ease);
  return { x, y, scale };
}

// ─── Track Lines (SVG) ────────────────────────────────────────────────────────
const TrackLines = React.memo(({ world }: { world: World }) => {
  const laneHalfW = (LANE_X_BOTTOM[1] - LANE_X_BOTTOM[0]) / 2;
  const divH1 = LANE_X_BOTTOM[0] + laneHalfW;
  const divH2 = LANE_X_BOTTOM[1] + laneHalfW;
  return (
    <Svg
      width={SCREEN_W}
      height={TRACK_H}
      style={[StyleSheet.absoluteFill, { top: HORIZON_Y }]}
    >
      <Line x1={VP_X} y1={0} x2={TRACK_LEFT_X} y2={TRACK_H} stroke={world.trackColor} strokeWidth={2.5} opacity={0.9} />
      <Line x1={VP_X} y1={0} x2={TRACK_RIGHT_X} y2={TRACK_H} stroke={world.trackColor} strokeWidth={2.5} opacity={0.9} />
      <Line x1={LANE_X_HORIZON[0] + (LANE_X_HORIZON[1] - LANE_X_HORIZON[0]) / 2} y1={0} x2={divH1} y2={TRACK_H} stroke={world.trackColor} strokeWidth={1} opacity={0.32} />
      <Line x1={LANE_X_HORIZON[1] + (LANE_X_HORIZON[2] - LANE_X_HORIZON[1]) / 2} y1={0} x2={divH2} y2={TRACK_H} stroke={world.trackColor} strokeWidth={1} opacity={0.32} />
    </Svg>
  );
});

// ─── Speed Lines (scrolling horizontal grid) ──────────────────────────────────
function SpeedLines({ scrollOffset, world }: { scrollOffset: number; world: World }) {
  const lines = [];
  const N = 9;
  for (let i = 0; i < N; i++) {
    const progress = ((i / N) + scrollOffset) % 1;
    if (progress < 0.04) continue;
    const eased = Math.pow(progress, 0.85);
    const y = HORIZON_Y + (PLAYER_Y + 60 - HORIZON_Y) * eased;
    const leftX = VP_X + (TRACK_LEFT_X - VP_X) * eased;
    const rightX = VP_X + (TRACK_RIGHT_X - VP_X) * eased;
    lines.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left: leftX,
          top: y,
          width: rightX - leftX,
          height: Math.max(1, 2.5 * eased),
          backgroundColor: world.trackColor,
          opacity: 0.06 + 0.26 * eased,
        }}
      />
    );
  }
  return <>{lines}</>;
}

// ─── Obstacle View ────────────────────────────────────────────────────────────
function ObstacleView({ obstacle, world }: { obstacle: SpawnedObstacle; world: World }) {
  const { x, y, scale } = perspPos(obstacle.lane, obstacle.progress);
  const base = GAME_CONFIG.OBSTACLE_BASE_SIZE * scale;
  const dims = OBSTACLE_DIMS[obstacle.type] ?? OBSTACLE_DIMS.block;
  const w = base * dims.w;
  const h = base * dims.h;
  const radius = Math.max(2, base * 0.07);
  if (obstacle.hit) return null;

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
          borderWidth: Math.max(1.5, w * 0.12),
          borderColor: world.obstacleColor,
          backgroundColor: 'transparent',
        }}
      />
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h,
        width: w,
        height: h,
        backgroundColor: world.obstacleColor,
        borderRadius: radius,
        borderWidth: Math.max(1, base * 0.03),
        borderColor: 'rgba(255,255,255,0.55)',
        shadowColor: world.obstacleColor,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: Math.max(4, base * 0.2),
        shadowOpacity: 0.9,
        elevation: 5,
      }}
    />
  );
}

// ─── Crystal View (diamond shape) ─────────────────────────────────────────────
function CrystalView({ crystal, world }: { crystal: SpawnedCrystal; world: World }) {
  const { x, y, scale } = perspPos(crystal.lane, crystal.progress);
  const size = GAME_CONFIG.CRYSTAL_BASE_SIZE * scale;
  if (crystal.collected || crystal.progress < 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size,
        width: size,
        height: size,
        backgroundColor: world.crystalColor,
        borderRadius: Math.max(1, size * 0.12),
        transform: [{ rotate: '45deg' }],
        borderWidth: Math.max(0.5, size * 0.06),
        borderColor: 'rgba(255,255,255,0.8)',
        shadowColor: world.crystalColor,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: Math.max(6, size * 0.5),
        shadowOpacity: 1,
        elevation: 6,
      }}
    />
  );
}

// ─── Player View: ZYRIX mascot rider + anti-grav hoverboard ──────────────────
const NEON = '#22E5FF';
const NEON_DIM = 'rgba(34,229,255,0.45)';
const SUIT_DARK = '#0B0B12';
const SUIT_GRAY = '#23232E';
const HOVER_GAP = 15; // "15 cm" — visual gap between board and ground

const RIDER_H = BOARD_W * 1.0;
const RIDER_W = BOARD_W * 0.82;

/** Mysterious gender-neutral rider seen from behind — black/gray suit,
 *  cyan neon seams, half-face visor helmet, glowing energy core on back. */
const RiderFigure = React.memo(() => (
  <Svg
    width={RIDER_W}
    height={RIDER_H}
    viewBox="0 0 100 122"
    style={{ position: 'absolute', bottom: BOARD_H - 3, left: (BOARD_W - RIDER_W) / 2 }}
  >
    {/* Legs — wide riding stance */}
    <Path d="M42 64 Q37 84 28 98 L24 114 L39 116 L43 100 Q49 86 50 70 Z" fill={SUIT_DARK} />
    <Path d="M58 64 Q63 84 72 98 L76 114 L61 116 L57 100 Q51 86 50 70 Z" fill={SUIT_DARK} />
    {/* Boots */}
    <Path d="M21 111 L41 113 L40 121 L20 119 Z" fill={SUIT_GRAY} />
    <Path d="M79 111 L59 113 L60 121 L80 119 Z" fill={SUIT_GRAY} />
    {/* Neon leg seams */}
    <Path d="M43 68 Q38 86 30 102" stroke={NEON} strokeWidth="1.8" fill="none" opacity="0.9" />
    <Path d="M57 68 Q62 86 70 102" stroke={NEON} strokeWidth="1.8" fill="none" opacity="0.9" />
    {/* Arms — out for balance */}
    <Path d="M37 30 Q21 37 10 49 L16 58 Q28 47 41 43 Z" fill={SUIT_GRAY} />
    <Path d="M63 30 Q79 37 90 49 L84 58 Q72 47 59 43 Z" fill={SUIT_GRAY} />
    {/* Gloves */}
    <Circle cx="13" cy="53" r="4.4" fill={SUIT_DARK} />
    <Circle cx="87" cy="53" r="4.4" fill={SUIT_DARK} />
    {/* Neon arm seams */}
    <Path d="M38 36 Q25 42 16 52" stroke={NEON} strokeWidth="1.4" fill="none" opacity="0.85" />
    <Path d="M62 36 Q75 42 84 52" stroke={NEON} strokeWidth="1.4" fill="none" opacity="0.85" />
    {/* Torso — slight forward lean */}
    <Path d="M37 28 Q50 23 63 28 L61 62 Q50 68 39 62 Z" fill={SUIT_DARK} stroke={SUIT_GRAY} strokeWidth="1.5" />
    {/* Neon spine + shoulder lines */}
    <Path d="M50 30 L50 62" stroke={NEON} strokeWidth="1.6" opacity="0.9" />
    <Path d="M39 33 L61 33" stroke={NEON} strokeWidth="1.2" opacity="0.7" />
    <Path d="M41 58 L59 58" stroke={NEON} strokeWidth="1.2" opacity="0.7" />
    {/* Energy core on back */}
    <Circle cx="50" cy="43" r="9" fill={NEON} opacity="0.18" />
    <Circle cx="50" cy="43" r="5.5" fill={NEON} opacity="0.5" />
    <Circle cx="50" cy="43" r="3" fill="#CFFAFF" />
    {/* Helmet */}
    <Circle cx="50" cy="14" r="11" fill={SUIT_DARK} stroke={SUIT_GRAY} strokeWidth="1.5" />
    {/* Half-face visor band, glimpsed from behind */}
    <Path d="M39.5 12.5 Q50 6.5 60.5 12.5" stroke={NEON} strokeWidth="2.4" fill="none" opacity="0.95" />
    <Path d="M40 16 Q50 11 60 16" stroke={NEON_DIM} strokeWidth="1.2" fill="none" />
    {/* Neck */}
    <Path d="M46 23 L54 23 L53 28 L47 28 Z" fill={SUIT_GRAY} />
  </Svg>
));

/** Futuristic anti-grav board with cyan energy rings underneath. */
const BoardBody = React.memo(() => (
  <>
    <Svg
      width={BOARD_W}
      height={BOARD_H + HOVER_GAP + 14}
      viewBox={`0 0 ${BOARD_W} ${BOARD_H + HOVER_GAP + 14}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {/* Deck — tapered nose/tail */}
      <Path
        d={`M${BOARD_W * 0.04} ${BOARD_H * 0.55}
            Q${BOARD_W * 0.02} ${BOARD_H * 0.18} ${BOARD_W * 0.18} ${BOARD_H * 0.12}
            L${BOARD_W * 0.82} ${BOARD_H * 0.12}
            Q${BOARD_W * 0.98} ${BOARD_H * 0.18} ${BOARD_W * 0.96} ${BOARD_H * 0.55}
            Q${BOARD_W * 0.94} ${BOARD_H * 0.92} ${BOARD_W * 0.78} ${BOARD_H * 0.95}
            L${BOARD_W * 0.22} ${BOARD_H * 0.95}
            Q${BOARD_W * 0.06} ${BOARD_H * 0.92} ${BOARD_W * 0.04} ${BOARD_H * 0.55} Z`}
        fill="#0C0C1A"
        stroke={NEON}
        strokeWidth="2"
      />
      {/* Deck top glow strip */}
      <Path
        d={`M${BOARD_W * 0.16} ${BOARD_H * 0.3} L${BOARD_W * 0.84} ${BOARD_H * 0.3}`}
        stroke={NEON}
        strokeWidth="2.5"
        opacity="0.85"
        strokeLinecap="round"
      />
      {/* Center emblem line */}
      <Path
        d={`M${BOARD_W * 0.28} ${BOARD_H * 0.62} L${BOARD_W * 0.72} ${BOARD_H * 0.62}`}
        stroke={NEON_DIM}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Energy rings underneath (anti-grav field) */}
      <Ellipse cx={BOARD_W / 2} cy={BOARD_H + HOVER_GAP * 0.4} rx={BOARD_W * 0.30} ry={4.2} stroke={NEON} strokeWidth="1.8" fill="none" opacity="0.8" />
      <Ellipse cx={BOARD_W / 2} cy={BOARD_H + HOVER_GAP * 0.78} rx={BOARD_W * 0.40} ry={5.2} stroke={NEON} strokeWidth="1.4" fill="none" opacity="0.45" />
      <Ellipse cx={BOARD_W / 2} cy={BOARD_H + HOVER_GAP + 4} rx={BOARD_W * 0.48} ry={6} stroke={NEON} strokeWidth="1" fill="none" opacity="0.2" />
    </Svg>
  </>
));

const PlayerView = React.memo(function PlayerView({
  playerX,
  boardTilt,
  jumpY,
  forwardTiltDeg,
  world,
}: {
  playerX: Animated.Value;
  boardTilt: Animated.Value;
  jumpY: Animated.Value;
  /** Quantized (whole degrees) so this component only re-renders on step changes. */
  forwardTiltDeg: number;
  world: World;
}) {
  const hoverY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;

  const translateX = useRef(Animated.subtract(playerX, BOARD_HALF_W)).current;
  const tiltDeg = useRef(
    boardTilt.interpolate({
      inputRange: [-30, 0, 30],
      outputRange: ['-30deg', '0deg', '30deg'],
    })
  ).current;

  const forwardTilt = `${forwardTiltDeg}deg`;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverY, { toValue: -5, duration: 780, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(hoverY, { toValue: 0, duration: 780, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [hoverY]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.35, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [glowOpacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: PLAYER_Y - BOARD_H / 2,
        width: BOARD_W,
        height: BOARD_H,
        transform: [
          { translateX },
          { translateY: Animated.add(hoverY, jumpY) },
          { rotate: tiltDeg },
          { perspective: 600 },
          { rotateX: forwardTilt },
        ],
      }}
    >
      {/* Neon energy trail (fades toward the viewer, behind the board) */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: BOARD_H + HOVER_GAP + 2,
          left: BOARD_W * 0.28,
          width: BOARD_W * 0.44,
          height: 58,
          opacity: Animated.multiply(glowOpacity, 0.5),
        }}
      >
        <LinearGradient
          colors={[NEON, 'rgba(34,229,255,0)']}
          style={{ flex: 1, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}
        />
      </Animated.View>

      {/* Anti-grav under-glow on the ground */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: BOARD_H + HOVER_GAP - 2,
          left: BOARD_W * 0.08,
          right: BOARD_W * 0.08,
          height: 10,
          borderRadius: 5,
          backgroundColor: NEON,
          opacity: Animated.multiply(glowOpacity, 0.55),
          shadowColor: NEON,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 18,
          shadowOpacity: 1,
          elevation: 12,
        }}
      />

      <BoardBody />
      <RiderFigure />
    </Animated.View>
  );
});

// ─── Particle Burst ───────────────────────────────────────────────────────────
// One Animated.Value drives the whole burst — cheap enough for Android.
interface Burst {
  id: number;
  x: number;
  y: number;
  color: string;
  kind: 'crystal' | 'hit';
}

const BURST_DIRS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.35;
  return { dx: Math.cos(a), dy: Math.sin(a), r: 0.6 + ((i * 37) % 10) / 14 };
});

function ParticleBurst({ burst, onDone }: { burst: Burst; onDone: (id: number) => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: burst.kind === 'hit' ? 560 : 420,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => onDone(burst.id));
  }, [progress, burst.id, burst.kind, onDone]);

  const dist = burst.kind === 'hit' ? 74 : 46;
  const size = burst.kind === 'hit' ? 7 : 5;
  const opacity = progress.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 0.9, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] });

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: burst.x, top: burst.y, zIndex: 60 }}>
      {BURST_DIRS.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            borderRadius: burst.kind === 'crystal' ? 1 : size / 2,
            backgroundColor: burst.color,
            opacity,
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, d.dx * dist * d.r] }) },
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, d.dy * dist * d.r - (burst.kind === 'crystal' ? 18 : 0)] }) },
              { scale },
              ...(burst.kind === 'crystal' ? [{ rotate: '45deg' as const }] : []),
            ],
          }}
        />
      ))}
    </View>
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

// ─── Stars ────────────────────────────────────────────────────────────────────
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

// ─── Main GameScene ───────────────────────────────────────────────────────────
interface GameSceneProps {
  displayState: GameDisplayState;
  playerX: Animated.Value;
  boardTilt: Animated.Value;
  jumpY: Animated.Value;
  cameraX: Animated.Value;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
}

export function GameScene({
  displayState,
  playerX,
  boardTilt,
  jumpY,
  cameraX,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}: GameSceneProps) {
  const world = WORLDS[displayState.worldIndex];
  const firedRef = useRef(false);

  // ── Camera: damped horizontal pan following the player's lane ──
  const camPan = useRef(
    cameraX.interpolate({
      inputRange: [LANE_X_BOTTOM[0], LANE_X_BOTTOM[2]],
      outputRange: [(LANE_X_BOTTOM[2] - LANE_X_BOTTOM[0]) * 0.09, -(LANE_X_BOTTOM[2] - LANE_X_BOTTOM[0]) * 0.09],
    })
  ).current;

  // ── Dynamic FOV: subtle zoom as speed climbs (quantized → rare re-renders) ──
  const speedStep = Math.round(
    8 *
      Math.max(
        0,
        Math.min(
          1,
          (displayState.speed - GAME_CONFIG.INITIAL_SPEED) /
            (GAME_CONFIG.MAX_SPEED - GAME_CONFIG.INITIAL_SPEED)
        )
      )
  );
  const fovScale = 1 + speedStep * 0.008; // up to +6.4% zoom at max speed

  // ── Screen shake on collision ──
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;

  // ── Particle bursts (crystal pickups + collision) ──
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstIdRef = useRef(0);
  const playerXValRef = useRef(LANE_X_BOTTOM[1]);
  const removeBurst = useCallback((id: number) => {
    setBursts((b) => b.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const sub = playerX.addListener(({ value }) => {
      playerXValRef.current = value;
    });
    return () => playerX.removeListener(sub);
  }, [playerX]);

  const prevCrystalsRef = useRef(displayState.sessionCrystals);
  useEffect(() => {
    if (displayState.sessionCrystals > prevCrystalsRef.current) {
      setBursts((b) => [
        ...b.slice(-3), // cap live bursts for Android perf
        {
          id: burstIdRef.current++,
          x: playerXValRef.current,
          y: PLAYER_Y - BOARD_H,
          color: world.crystalColor,
          kind: 'crystal' as const,
        },
      ]);
    }
    prevCrystalsRef.current = displayState.sessionCrystals;
  }, [displayState.sessionCrystals, world.crystalColor]);

  const prevGameOverRef = useRef(displayState.gameOver);
  useEffect(() => {
    if (displayState.gameOver && !prevGameOverRef.current) {
      // Collision burst
      setBursts((b) => [
        ...b,
        {
          id: burstIdRef.current++,
          x: playerXValRef.current,
          y: PLAYER_Y - BOARD_H / 2,
          color: world.obstacleColor,
          kind: 'hit' as const,
        },
      ]);
      // Small screen shake
      const mk = (v: Animated.Value, seq: number[]) =>
        Animated.sequence(
          seq.map((to, i) =>
            Animated.timing(v, { toValue: to, duration: 46 + i * 4, useNativeDriver: true })
          )
        );
      Animated.parallel([
        mk(shakeX, [-9, 8, -6, 4, -2, 0]),
        mk(shakeY, [5, -6, 4, -3, 1, 0]),
      ]).start();
    }
    prevGameOverRef.current = displayState.gameOver;
  }, [displayState.gameOver, world.obstacleColor, shakeX, shakeY]);

  // Swipe detection: fires as soon as movement crosses the threshold —
  // no waiting for finger release. Horizontal beats vertical unless the
  // gesture is clearly upward.
  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
        onPanResponderGrant: () => {
          firedRef.current = false;
        },
        onPanResponderMove: (_, g) => {
          if (firedRef.current) return;
          const T = GAME_CONFIG.SWIPE_THRESHOLD;
          if (g.dy < -T && Math.abs(g.dy) > Math.abs(g.dx)) {
            firedRef.current = true;
            onSwipeUp();
          } else if (g.dx > T && Math.abs(g.dx) >= Math.abs(g.dy)) {
            firedRef.current = true;
            onSwipeRight();
          } else if (g.dx < -T && Math.abs(g.dx) >= Math.abs(g.dy)) {
            firedRef.current = true;
            onSwipeLeft();
          }
        },
        onPanResponderRelease: () => {
          firedRef.current = false;
        },
      }).panHandlers,
    [onSwipeLeft, onSwipeRight, onSwipeUp]
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: world.skyTop }]} {...panHandlers}>
      {/* World container: damped camera pan + speed FOV zoom + collision shake */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              { translateX: Animated.add(camPan, shakeX) },
              { translateY: shakeY },
              { scale: fovScale },
            ],
          },
        ]}
      >
        {/* Sky gradient */}
        <LinearGradient
          colors={[world.skyTop, world.skyBottom]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HORIZON_Y + 20 }}
        />

        <Stars world={world} />

        {/* Horizon glow */}
        <View
          style={{
            position: 'absolute',
            top: HORIZON_Y - 16,
            left: 0,
            right: 0,
            height: 32,
            backgroundColor: world.horizonGlow,
          }}
        />

        {/* Ground gradient */}
        <LinearGradient
          colors={[world.groundTop, world.groundBottom]}
          style={{ position: 'absolute', top: HORIZON_Y, left: 0, right: 0, bottom: 0 }}
        />

        <TrackLines world={world} />
        <SpeedLines scrollOffset={displayState.scrollOffset} world={world} />

        {/* Crystals */}
        {displayState.crystalObjects.map((c) => (
          <CrystalView key={c.id} crystal={c} world={world} />
        ))}

        {/* Obstacles */}
        {displayState.obstacles.map((o) => (
          <ObstacleView key={o.id} obstacle={o} world={world} />
        ))}

        {/* Player */}
        <PlayerView
          playerX={playerX}
          boardTilt={boardTilt}
          jumpY={jumpY}
          forwardTiltDeg={Math.round(
            14 *
              Math.max(
                0,
                Math.min(
                  1,
                  (displayState.speed - GAME_CONFIG.INITIAL_SPEED) /
                    (GAME_CONFIG.MAX_SPEED - GAME_CONFIG.INITIAL_SPEED)
                )
              )
          )}
          world={world}
        />

        {/* Particle bursts */}
        {bursts.map((b) => (
          <ParticleBurst key={b.id} burst={b} onDone={removeBurst} />
        ))}
      </Animated.View>

      {/* Portal transition flash */}
      {displayState.showPortal && <PortalFlash key={displayState.worldIndex} world={world} />}

      {Platform.OS === 'web' && <View style={{ height: 34 }} />}
    </View>
  );
}
