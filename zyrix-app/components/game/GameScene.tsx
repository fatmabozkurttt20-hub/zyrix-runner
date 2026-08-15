import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  Platform,
  PanResponder,
  StyleSheet,
  Text,
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
import { GameDisplayState, SpawnedObstacle, SpawnedCrystal, SpawnedOrb, COUNTDOWN_STEP_MS } from '@/hooks/useGame';

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

// ─────────────────────────────────────────────────────────────────────────────
// ZYRIX 2.0 — CYBER CITY TRACK SURFACE
// ─────────────────────────────────────────────────────────────────────────────

function CyberTrackSurface({ world }: { world: World }) {

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: HORIZON_Y,
        bottom: 0,
      }}
    >
      {/* main wide surf runway */}
      <View
        style={{
          position: 'absolute',
          left: SCREEN_W * 0.07,
          right: SCREEN_W * 0.07,
          top: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={[
            'rgba(78,177,235,0.20)',
            'rgba(56,153,224,0.34)',
            'rgba(34,108,190,0.62)',
            'rgba(16,55,126,0.88)',
          ]}
          style={StyleSheet.absoluteFill}
        />

        {/* glossy central wash */}
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.05)',
            'rgba(160,240,255,0.18)',
            'rgba(255,255,255,0.03)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '23%',
            width: '54%',
          }}
        />
      </View>

      {/* thick side rails */}
      <LinearGradient
        colors={['#243B6E', '#4F78A8', '#2E487C']}
        style={{
          position: 'absolute',
          left: SCREEN_W * 0.025,
          width: SCREEN_W * 0.075,
          top: 0,
          bottom: 0,
          borderRightWidth: 2,
          borderRightColor: '#46E9FF',
        }}
      />

      <LinearGradient
        colors={['#243B6E', '#4F78A8', '#2E487C']}
        style={{
          position: 'absolute',
          right: SCREEN_W * 0.025,
          width: SCREEN_W * 0.075,
          top: 0,
          bottom: 0,
          borderLeftWidth: 2,
          borderLeftColor: '#B66DFF',
        }}
      />

      {/* foreground shine */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          'rgba(94,220,255,0.14)',
          'rgba(255,255,255,0.04)',
        ]}
        style={{
          position: 'absolute',
          left: SCREEN_W * 0.07,
          right: SCREEN_W * 0.07,
          bottom: 0,
          height: '38%',
        }}
      />
    </View>
  );
}

const TrackLines = React.memo(({ world }: { world: World }) => {
  const laneHalfW = (LANE_X_BOTTOM[1] - LANE_X_BOTTOM[0]) / 2;
  const divH1 = LANE_X_BOTTOM[0] + laneHalfW;
  const divH2 = LANE_X_BOTTOM[1] + laneHalfW;

  const roadTopL = VP_X - 5;
  const roadTopR = VP_X + 5;
  const innerBottomL = TRACK_LEFT_X + 8;
  const innerBottomR = TRACK_RIGHT_X - 8;

  return (
    <Svg
      width={SCREEN_W}
      height={TRACK_H}
      style={[StyleSheet.absoluteFill, { top: HORIZON_Y }]}
      pointerEvents="none"
    >
      {/* Deep metallic road */}
      <Path
        d={`M${roadTopL} 0 L${roadTopR} 0 L${TRACK_RIGHT_X} ${TRACK_H} L${TRACK_LEFT_X} ${TRACK_H} Z`}
        fill="#050A12"
        opacity={0.98}
      />

      {/* Inner road panel */}
      <Path
        d={`M${VP_X - 2} 2 L${VP_X + 2} 2 L${innerBottomR} ${TRACK_H} L${innerBottomL} ${TRACK_H} Z`}
        fill="#08121D"
        opacity={0.94}
      />

      {/* Subtle energy reflection */}
      <Path
        d={`M${VP_X - 1} 4 L${VP_X + 1} 4 L${TRACK_RIGHT_X - 20} ${TRACK_H} L${TRACK_LEFT_X + 20} ${TRACK_H} Z`}
        fill={world.trackColor}
        opacity={0.05}
      />

      {/* Wide rail glow */}
      <Line
        x1={VP_X}
        y1={0}
        x2={TRACK_LEFT_X}
        y2={TRACK_H}
        stroke={world.trackColor}
        strokeWidth={5}
        opacity={0.18}
      />
      <Line
        x1={VP_X}
        y1={0}
        x2={TRACK_RIGHT_X}
        y2={TRACK_H}
        stroke={world.trackColor}
        strokeWidth={5}
        opacity={0.18}
      />

      {/* Sharp outer rails */}
      <Line
        x1={VP_X}
        y1={0}
        x2={TRACK_LEFT_X}
        y2={TRACK_H}
        stroke={world.trackColor}
        strokeWidth={2}
        opacity={0.96}
      />
      <Line
        x1={VP_X}
        y1={0}
        x2={TRACK_RIGHT_X}
        y2={TRACK_H}
        stroke={world.trackColor}
        strokeWidth={2}
        opacity={0.96}
      />

      {/* Inner accent rails */}
      <Line
        x1={VP_X - 1}
        y1={0}
        x2={TRACK_LEFT_X + 9}
        y2={TRACK_H}
        stroke={world.accentColor}
        strokeWidth={0.8}
        opacity={0.32}
      />
      <Line
        x1={VP_X + 1}
        y1={0}
        x2={TRACK_RIGHT_X - 9}
        y2={TRACK_H}
        stroke={world.accentColor}
        strokeWidth={0.8}
        opacity={0.32}
      />

      {/* Lane separator glow */}
      <Line
        x1={LANE_X_HORIZON[0] + (LANE_X_HORIZON[1] - LANE_X_HORIZON[0]) / 2}
        y1={0}
        x2={divH1}
        y2={TRACK_H}
        stroke={world.trackColor}
        strokeWidth={2.8}
        opacity={0.10}
      />
      <Line
        x1={LANE_X_HORIZON[1] + (LANE_X_HORIZON[2] - LANE_X_HORIZON[1]) / 2}
        y1={0}
        x2={divH2}
        y2={TRACK_H}
        stroke={world.trackColor}
        strokeWidth={2.8}
        opacity={0.10}
      />

      {/* Lane separator cores */}
      <Line
        x1={LANE_X_HORIZON[0] + (LANE_X_HORIZON[1] - LANE_X_HORIZON[0]) / 2}
        y1={0}
        x2={divH1}
        y2={TRACK_H}
        stroke={world.accentColor}
        strokeWidth={0.9}
        opacity={0.40}
      />
      <Line
        x1={LANE_X_HORIZON[1] + (LANE_X_HORIZON[2] - LANE_X_HORIZON[1]) / 2}
        y1={0}
        x2={divH2}
        y2={TRACK_H}
        stroke={world.accentColor}
        strokeWidth={0.9}
        opacity={0.40}
      />
    </Svg>
  );
});

// —— Speed Lines (scrolling horizontal grid) ——————————————
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
        
      }}
    />
  );
}

// ─── Overdrive orb (purple energy sphere) ─────────────────────────────────────
const ORB_COLOR = '#B44CFF';


// ─────────────────────────────────────────────────────────────────────────────
// ZYRIX 2.0 — CYBER OBSTACLE SKINS
// Fizik / collision sistemi değişmez. Sadece Cyber City görsel katmanıdır.
// ─────────────────────────────────────────────────────────────────────────────

function CyberObstacleSkin({
  obstacle,
  world,
}: {
  obstacle: SpawnedObstacle;
  world: World;
}) {
  if (obstacle.hit) return null;

  const { x, y, scale } = perspPos(obstacle.lane, obstacle.progress);

  const base = Math.max(18, GAME_CONFIG.OBSTACLE_BASE_SIZE * scale);
  const variant =
    obstacle.id.length > 0
      ? obstacle.id.charCodeAt(obstacle.id.length - 1) % 3
      : 0;

  // Existing ring obstacle becomes a large luminous energy hoop.
  if (obstacle.type === 'ring') {
    const ringSize = base * 1.48;

    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - ringSize / 2,
          top: y - ringSize * 0.82,
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: Math.max(3, 7 * scale),
          borderColor: '#54EEFF',
          backgroundColor: 'rgba(35,121,218,0.06)',
          shadowColor: '#21E6FF',
          shadowOpacity: 1,
          shadowRadius: 16,
          elevation: 5,
          zIndex: 19,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: '12%',
            top: '12%',
            right: '12%',
            bottom: '12%',
            borderRadius: 999,
            borderWidth: Math.max(1, 3 * scale),
            borderColor: 'rgba(184,113,255,0.82)',
          }}
        />

        <View
          style={{
            position: 'absolute',
            width: '46%',
            height: 3,
            left: '27%',
            top: '49%',
            borderRadius: 5,
            backgroundColor: '#FFFFFF',
            opacity: 0.72,
          }}
        />
      </View>
    );
  }

  // Alternate between three visual obstacle families.
  if (variant === 0) {
    // ENERGY GATE
    const w = base * 1.18;
    const h = base * 1.08;

    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - w / 2,
          top: y - h,
          width: w,
          height: h,
          zIndex: 20,
        }}
      >
        {/* left pylon */}
        <LinearGradient
          colors={['#77F2FF', '#365CB8', '#142B61']}
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '22%',
            height: '100%',
            borderRadius: Math.max(3, 8 * scale),
            borderWidth: 1,
            borderColor: '#8BF7FF',
          }}
        />

        {/* right pylon */}
        <LinearGradient
          colors={['#CB8AFF', '#5947BA', '#241C62']}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '22%',
            height: '100%',
            borderRadius: Math.max(3, 8 * scale),
            borderWidth: 1,
            borderColor: '#D8A5FF',
          }}
        />

        {/* top bridge */}
        <LinearGradient
          colors={['#284F9C', '#6379DF', '#233F85']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: 'absolute',
            left: '12%',
            right: '12%',
            top: 0,
            height: '20%',
            borderRadius: 7,
            borderWidth: 1,
            borderColor: 'rgba(168,240,255,0.78)',
          }}
        />

        {/* energy field */}
        <LinearGradient
          colors={[
            'rgba(80,235,255,0.18)',
            'rgba(255,255,255,0.48)',
            'rgba(183,91,255,0.18)',
          ]}
          style={{
            position: 'absolute',
            left: '23%',
            right: '23%',
            top: '20%',
            bottom: '5%',
            borderRadius: 5,
          }}
        />

        {/* warning line */}
        <View
          style={{
            position: 'absolute',
            left: '25%',
            right: '25%',
            top: '53%',
            height: Math.max(2, 4 * scale),
            borderRadius: 6,
            backgroundColor: '#FFEB67',
            shadowColor: '#FFED6A',
            shadowOpacity: 1,
            shadowRadius: 8,
          }}
        />
      </View>
    );
  }

  if (variant === 1) {
    // FUTURISTIC BARRIER
    const w = base * 1.38;
    const h = base * 0.72;

    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - w / 2,
          top: y - h,
          width: w,
          height: h,
          zIndex: 20,
        }}
      >
        <LinearGradient
          colors={['#496EB4', '#203D7A', '#152951']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '15%',
            bottom: 0,
            borderRadius: Math.max(4, 11 * scale),
            borderWidth: 1,
            borderColor: 'rgba(114,232,255,0.75)',
          }}
        />

        {/* glowing warning face */}
        <View
          style={{
            position: 'absolute',
            left: '9%',
            right: '9%',
            top: '31%',
            height: '28%',
            borderRadius: 5,
            backgroundColor: '#FF4EA8',
            opacity: 0.84,
            shadowColor: '#FF4EA8',
            shadowOpacity: 1,
            shadowRadius: 10,
          }}
        />

        {/* warning stripes */}
        {[0, 1, 2].map(i => (
          <View
            key={'barrier-stripe-' + i}
            style={{
              position: 'absolute',
              top: '35%',
              left: (16 + i * 27) + '%',
              width: '13%',
              height: '20%',
              borderRadius: 2,
              backgroundColor: '#FFE867',
              transform: [{ skewX: '-18deg' }],
            }}
          />
        ))}

        {/* feet */}
        <View
          style={{
            position: 'absolute',
            left: '12%',
            bottom: -3,
            width: '19%',
            height: 6,
            borderRadius: 5,
            backgroundColor: '#0C1938',
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: '12%',
            bottom: -3,
            width: '19%',
            height: 6,
            borderRadius: 5,
            backgroundColor: '#0C1938',
          }}
        />
      </View>
    );
  }

  // POWER CORE / ROBOTIC CRATE
  const size = base * 0.95;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size,
        width: size,
        height: size,
        borderRadius: Math.max(5, 12 * scale),
        zIndex: 20,
        shadowColor: '#31E9FF',
        shadowOpacity: 0.8,
        shadowRadius: 10,
      }}
    >
      <LinearGradient
        colors={['#567AC1', '#253F82', '#172B5A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: Math.max(5, 12 * scale),
          borderWidth: 1,
          borderColor: '#75EFFF',
        }}
      />

      <View
        style={{
          position: 'absolute',
          width: '46%',
          height: '46%',
          left: '27%',
          top: '27%',
          borderRadius: 999,
          backgroundColor: '#4DF2FF',
          borderWidth: 2,
          borderColor: '#E5FEFF',
          shadowColor: '#4DF2FF',
          shadowOpacity: 1,
          shadowRadius: 13,
        }}
      />

      <View
        style={{
          position: 'absolute',
          width: '18%',
          height: '18%',
          left: '41%',
          top: '41%',
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
        }}
      />

      {/* corner armor */}
      <View
        style={{
          position: 'absolute',
          left: 4,
          top: 4,
          width: '23%',
          height: 4,
          borderRadius: 3,
          backgroundColor: '#C884FF',
        }}
      />

      <View
        style={{
          position: 'absolute',
          right: 4,
          bottom: 4,
          width: '23%',
          height: 4,
          borderRadius: 3,
          backgroundColor: '#C884FF',
        }}
      />
    </View>
  );
}

function OrbView({ orb }: { orb: SpawnedOrb }) {
  const { x, y, scale } = perspPos(orb.lane, orb.progress);
  if (orb.collected || orb.progress < 0) return null;
  const size = GAME_CONFIG.CRYSTAL_BASE_SIZE * 1.25 * scale;
  const halo = size * 2.6;
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - halo / 2,
          top: y - size / 2 - halo / 2,
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: ORB_COLOR,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ORB_COLOR,
          borderWidth: Math.max(0.5, size * 0.08),
          borderColor: 'rgba(255,255,255,0.85)',
          
        }}
      />
      {/* White energy core */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - size * 0.18,
          top: y - size * 0.68,
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: size * 0.18,
          backgroundColor: '#FFFFFF',
          opacity: 0.95,
        }}
      />
    </>
  );
}

// ─── Overdrive FX: neon trail + screen glow + energy particles ────────────────
// Always mounted; fades in/out with `active` and renders nothing while idle.
const OverdriveFX = React.memo(function OverdriveFX({
  active,
  playerX,
}: {
  active: boolean;
  playerX: Animated.Value;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (active) {
      setVisible(true);
      Animated.timing(fade, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else {
      Animated.timing(fade, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(
        ({ finished }) => finished && setVisible(false)
      );
    }
  }, [active, fade]);

  // Shared flicker + particle clock (single loop for all FX)
  const clock = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.timing(clock, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    anim.start();
    return () => {
      anim.stop();
      clock.setValue(0);
    };
  }, [visible, clock]);

  const trailX = useRef(Animated.subtract(playerX, 0)).current;
  if (!visible) return null;

  const flicker = clock.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.55, 1, 0.7, 0.95, 0.55],
  });

  return (
    <>
      {/* Neon trail behind the hoverboard */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -BOARD_HALF_W * 0.55,
          top: PLAYER_Y - 6,
          width: BOARD_HALF_W * 1.1,
          height: 120,
          opacity: Animated.multiply(fade, flicker),
          transform: [{ translateX: trailX }],
        }}
      >
        <LinearGradient
          colors={[`${ORB_COLOR}CC`, `${ORB_COLOR}55`, `${ORB_COLOR}00`]}
          style={{ flex: 1, borderRadius: BOARD_HALF_W * 0.55 }}
        />
      </Animated.View>

      {/* Energy particles rising around the player */}
      {[-30, -12, 14, 32].map((dx, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: dx - 2,
            top: PLAYER_Y - 20,
            width: 4 + (i % 2) * 2,
            height: 4 + (i % 2) * 2,
            borderRadius: 4,
            backgroundColor: i % 2 ? '#E3B8FF' : ORB_COLOR,
            opacity: Animated.multiply(
              fade,
              clock.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: i % 2 ? [0.9, 0.2, 0.9] : [0.25, 0.85, 0.25],
              })
            ),
            transform: [
              { translateX: trailX },
              {
                translateY: clock.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -(46 + i * 14)],
                }),
              },
            ],
          }}
        />
      ))}

      {/* Subtle purple screen glow (edges only, non-blocking) */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: Animated.multiply(fade, 0.5) }]}
      >
        <LinearGradient
          colors={[`${ORB_COLOR}3C`, `${ORB_COLOR}00`]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 110 }}
        />
        <LinearGradient
          colors={[`${ORB_COLOR}00`, `${ORB_COLOR}46`]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 }}
        />
      </Animated.View>
    </>
  );
});

// ─── OVERDRIVE title — one-shot, shows for ~1s on activation ─────────────────
function OverdriveTitle() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 160, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
      Animated.delay(640),
      Animated.timing(t, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: HORIZON_Y + 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        opacity: t,
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1.6, 1] }) }],
      }}
    >
      <Text
        style={{
          fontSize: 40,
          fontFamily: 'Inter_700Bold',
          letterSpacing: 8,
          color: '#F0DBFF',
          textShadowColor: ORB_COLOR,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 24,
        }}
      >
        OVERDRIVE
      </Text>
    </Animated.View>
  );
}

// ─── Crystal View (diamond shape) ─────────────────────────────────────────────
function CrystalView({ crystal, world }: { crystal: SpawnedCrystal; world: World }) {
  const { x, y, scale } = perspPos(crystal.lane, crystal.progress);
  const size = GAME_CONFIG.CRYSTAL_BASE_SIZE * scale;
  if (crystal.collected || crystal.progress < 0) return null;
  const halo = size * 2.2;
  return (
    <>
      {/* Bloom halo */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - halo / 2,
          top: y - size / 2 - halo / 2,
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: world.crystalColor,
          opacity: 0.14,
        }}
      />
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
        
        }}
      />
      {/* Specular sparkle */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - size * 0.1,
          top: y - size * 0.78,
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: size * 0.11,
          backgroundColor: '#FFFFFF',
          opacity: 0.9,
        }}
      />
    </>
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
      {/* Glossy reflection sheen across the deck */}
      <Path
        d={`M${BOARD_W * 0.10} ${BOARD_H * 0.44}
            Q${BOARD_W * 0.34} ${BOARD_H * 0.20} ${BOARD_W * 0.62} ${BOARD_H * 0.24}
            Q${BOARD_W * 0.44} ${BOARD_H * 0.38} ${BOARD_W * 0.14} ${BOARD_H * 0.52} Z`}
        fill="#FFFFFF"
        opacity="0.10"
      />
      <Path
        d={`M${BOARD_W * 0.68} ${BOARD_H * 0.22} Q${BOARD_W * 0.80} ${BOARD_H * 0.22} ${BOARD_W * 0.88} ${BOARD_H * 0.34}`}
        stroke="#FFFFFF"
        strokeWidth="1.4"
        opacity="0.22"
        fill="none"
        strokeLinecap="round"
      />
      {/* Energy rings underneath (anti-grav field) */}
      <Ellipse cx={BOARD_W / 2} cy={BOARD_H + HOVER_GAP * 0.4} rx={BOARD_W * 0.30} ry={4.2} stroke={NEON} strokeWidth="1.8" fill="none" opacity="0.8" />
      <Ellipse cx={BOARD_W / 2} cy={BOARD_H + HOVER_GAP * 0.78} rx={BOARD_W * 0.40} ry={5.2} stroke={NEON} strokeWidth="1.4" fill="none" opacity="0.45" />
      <Ellipse cx={BOARD_W / 2} cy={BOARD_H + HOVER_GAP + 4} rx={BOARD_W * 0.48} ry={6} stroke={NEON} strokeWidth="1" fill="none" opacity="0.2" />
    </Svg>
  </>
));


// ─────────────────────────────────────────────────────────────────────────────
// ZYRIX 2.0 — MASCOT RIDER + ARCADE SURF BOARD
// Gameplay hitbox mantığını değiştirmez; yalnızca görseldir.
// ─────────────────────────────────────────────────────────────────────────────

function CyberMascotRider({ world }: { world: World }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 78,
        height: 92,
        left: 17,
        top: -70,
        alignItems: 'center',
      }}
    >
      {/* antennae */}
      <View
        style={{
          position: 'absolute',
          left: 22,
          top: -14,
          width: 4,
          height: 28,
          borderRadius: 2,
          backgroundColor: '#3E7A6B',
          transform: [{ rotate: '-22deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 17,
          top: -20,
          width: 9,
          height: 9,
          borderRadius: 5,
          backgroundColor: world.accentColor,
          shadowColor: world.accentColor,
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 4,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 22,
          top: -14,
          width: 4,
          height: 28,
          borderRadius: 2,
          backgroundColor: '#3E7A6B',
          transform: [{ rotate: '22deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 17,
          top: -20,
          width: 9,
          height: 9,
          borderRadius: 5,
          backgroundColor: world.accentColor,
          shadowColor: world.accentColor,
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 4,
        }}
      />

      {/* head */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          width: 48,
          height: 56,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: 'rgba(190,255,230,0.55)',
          shadowColor: world.trackColor,
          shadowOpacity: 0.9,
          shadowRadius: 14,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={['#DFFFF3', '#8CF2D0', '#3FBF9A']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={{
            position: 'absolute',
            left: 6,
            top: 20,
            width: 15,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#0A1B18',
            transform: [{ rotate: '-8deg' }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: 4,
              top: 5,
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: world.accentColor,
              shadowColor: world.accentColor,
              shadowOpacity: 1,
              shadowRadius: 6,
            }}
          />
        </View>

        <View
          style={{
            position: 'absolute',
            right: 6,
            top: 20,
            width: 15,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#0A1B18',
            transform: [{ rotate: '8deg' }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: 4,
              top: 5,
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: world.accentColor,
              shadowColor: world.accentColor,
              shadowOpacity: 1,
              shadowRadius: 6,
            }}
          />
        </View>
      </View>

      {/* body */}
      <LinearGradient
        colors={['#DFFFF3', '#8CF2D0', '#3FBF9A']}
        style={{
          position: 'absolute',
          top: 56,
          width: 34,
          height: 34,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(190,255,230,0.5)',
        }}
      />

      {/* glowing chest core */}
      <View
        style={{
          position: 'absolute',
          top: 68,
          width: 13,
          height: 13,
          borderRadius: 8,
          backgroundColor: world.trackColor,
          shadowColor: world.trackColor,
          shadowOpacity: 1,
          shadowRadius: 12,
        }}
      />

      {/* arms */}
      <View
        style={{
          position: 'absolute',
          left: 10,
          top: 62,
          width: 20,
          height: 7,
          borderRadius: 5,
          backgroundColor: '#6FE0BC',
          transform: [{ rotate: '20deg' }],
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: -3,
            top: -1.5,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: world.accentColor,
            shadowColor: world.accentColor,
            shadowOpacity: 1,
            shadowRadius: 6,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          right: 10,
          top: 62,
          width: 20,
          height: 7,
          borderRadius: 5,
          backgroundColor: '#6FE0BC',
          transform: [{ rotate: '-20deg' }],
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: -3,
            top: -1.5,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: world.accentColor,
            shadowColor: world.accentColor,
            shadowOpacity: 1,
            shadowRadius: 6,
          }}
        />
      </View>
    </View>
  );
}

function CyberMascotBoard({ world }: { world: World }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 118,
        height: 36,
        left: -3,
        top: 6,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* underside glow */}
      <View
        style={{
          position: 'absolute',
          bottom: -6,
          width: 86,
          height: 12,
          borderRadius: 999,
          backgroundColor: world.trackColor,
          opacity: 0.24,
          shadowColor: world.trackColor,
          shadowOpacity: 1,
          shadowRadius: 18,
          elevation: 4,
        }}
      />

      {/* board body */}
      <LinearGradient
        colors={['#FFFFFF', '#C9E6FF', '#6D8FEA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 108,
          height: 25,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.75)',
          transform: [{ skewX: '-8deg' }],
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            top: 5,
            height: 3,
            borderRadius: 3,
            backgroundColor: world.trackColor,
            opacity: 0.9,
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 22,
            right: 22,
            bottom: 4,
            height: 3,
            borderRadius: 3,
            backgroundColor: world.accentColor,
            opacity: 0.72,
          }}
        />
      </LinearGradient>

      {/* anti-grav pods */}
      <View
        style={{
          position: 'absolute',
          left: 18,
          bottom: 0,
          width: 17,
          height: 8,
          borderRadius: 8,
          backgroundColor: '#1E3E66',
          borderWidth: 1,
          borderColor: world.trackColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 18,
          bottom: 0,
          width: 17,
          height: 8,
          borderRadius: 8,
          backgroundColor: '#1E3E66',
          borderWidth: 1,
          borderColor: world.trackColor,
        }}
      />
    </View>
  );
}

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

      <CyberMascotBoard world={world} />
      <CyberMascotRider world={world} />
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
  kind: 'crystal' | 'hit' | 'jump';
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
      duration: burst.kind === 'hit' ? 560 : burst.kind === 'jump' ? 300 : 420,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => onDone(burst.id));
  }, [progress, burst.id, burst.kind, onDone]);

  const dist = burst.kind === 'hit' ? 74 : burst.kind === 'jump' ? 30 : 46;
  const size = burst.kind === 'hit' ? 7 : burst.kind === 'jump' ? 4 : 5;
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

// ─── Cyber City Skyline ──────────────────────────────────────────────────────
// Static memoized SVG silhouette + a single shared Animated value pulsing a
// few neon signs. Deterministic layout (no Math.random at render).
const CITY_H = 96;
const BUILDINGS_BACK = Array.from({ length: 14 }, (_, i) => {
  const w = 22 + ((i * 53) % 26);
  const h = 26 + ((i * 37) % 44);
  return { x: (SCREEN_W / 14) * i - 4, w, h };
});
const BUILDINGS_FRONT = Array.from({ length: 9 }, (_, i) => {
  const w = 30 + ((i * 71) % 34);
  const h = 44 + ((i * 61) % 50);
  return { x: (SCREEN_W / 9) * i + ((i * 13) % 12) - 6, w, h };
});
// Deterministic window dots on front buildings
const WINDOWS = BUILDINGS_FRONT.flatMap((b, bi) =>
  Array.from({ length: 4 + (bi % 3) }, (_, wi) => ({
    x: b.x + 5 + ((wi * 29 + bi * 17) % Math.max(8, b.w - 10)),
    y: CITY_H - b.h + 8 + ((wi * 41 + bi * 23) % Math.max(10, b.h - 18)),
  }))
);

const CitySilhouette = React.memo(({ world }: { world: World }) => (
  <Svg width={SCREEN_W} height={CITY_H} style={{ position: 'absolute', top: HORIZON_Y - CITY_H }}>
    {BUILDINGS_BACK.map((b, i) => (
      <Path
        key={`b${i}`}
        d={`M${b.x} ${CITY_H} L${b.x} ${CITY_H - b.h} L${b.x + b.w} ${CITY_H - b.h} L${b.x + b.w} ${CITY_H} Z`}
        fill="#060814"
        opacity={0.85}
      />
    ))}
    {BUILDINGS_FRONT.map((b, i) => (
      <Path
        key={`f${i}`}
        d={`M${b.x} ${CITY_H} L${b.x} ${CITY_H - b.h} L${b.x + b.w * 0.5} ${CITY_H - b.h - (i % 2 === 0 ? 6 : 0)} L${b.x + b.w} ${CITY_H - b.h} L${b.x + b.w} ${CITY_H} Z`}
        fill="#0A0D1E"
      />
    ))}
    {/* Rooftop antenna lights */}
    {BUILDINGS_FRONT.filter((_, i) => i % 3 === 0).map((b, i) => (
      <Circle key={`a${i}`} cx={b.x + b.w * 0.5} cy={CITY_H - b.h - (i % 2 === 0 ? 8 : 2)} r={1.6} fill={world.trackColor} opacity={0.9} />
    ))}
    {/* Windows */}
    {WINDOWS.map((w, i) => (
      <Circle key={`w${i}`} cx={w.x} cy={w.y} r={0.9} fill={i % 4 === 0 ? world.accentColor : world.trackColor} opacity={i % 3 === 0 ? 0.75 : 0.4} />
    ))}
  </Svg>
));

/** Pulsing neon sign strips over the skyline — one shared Animated value. */
function CityNeon({ world }: { world: World }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const signs = [
    { left: SCREEN_W * 0.12, top: HORIZON_Y - 52, w: 18, color: world.trackColor },
    { left: SCREEN_W * 0.46, top: HORIZON_Y - 70, w: 24, color: world.accentColor },
    { left: SCREEN_W * 0.78, top: HORIZON_Y - 44, w: 14, color: world.trackColor },
  ];
  return (
    <>
      {signs.map((s, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: s.w,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: s.color,
            opacity: i === 1 ? pulse : Animated.multiply(pulse, 0.7),
            shadowColor: s.color,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 6,
            shadowOpacity: 0.9,
            elevation: 4,
          }}
        />
      ))}
    </>
  );
}

// ─── Floating Air Particles ───────────────────────────────────────────────────
// 7 dust motes drifting upward on two staggered native-driver loops.
const MOTES = Array.from({ length: 7 }, (_, i) => ({
  x: ((i * 149) % 100) / 100,
  y: 0.42 + (((i * 83) % 50) / 100) * 0.5,
  size: 1.5 + (i % 3),
  group: i % 2,
}));


// ─────────────────────────────────────────────────────────────────────────────
// ZYRIX 2.0 — CYBER CITY WORLD LAYER
// Büyük, renkli ve hacimli mobil-runner şehir atmosferi.
// Gameplay/collision mantığına dokunmaz; tamamen görsel katmandır.
// ─────────────────────────────────────────────────────────────────────────────

const CYBER_FAR_BUILDINGS = [
  { x: 0.01, w: 0.11, h: 94, c: '#172B58', glow: '#38D9FF' },
  { x: 0.10, w: 0.09, h: 138, c: '#20376E', glow: '#7C5CFF' },
  { x: 0.19, w: 0.12, h: 82, c: '#193463', glow: '#2AF2FF' },
  { x: 0.30, w: 0.08, h: 126, c: '#293A77', glow: '#FF63D8' },
  { x: 0.63, w: 0.09, h: 118, c: '#24366C', glow: '#39E8FF' },
  { x: 0.72, w: 0.12, h: 88, c: '#172C5D', glow: '#9A72FF' },
  { x: 0.83, w: 0.08, h: 145, c: '#293A77', glow: '#42ECFF' },
  { x: 0.91, w: 0.10, h: 104, c: '#19315D', glow: '#FF6CDF' },
];

const CYBER_SIDE_TOWERS = [
  { side: 'left',  x: -0.10, y: 0.05, w: 0.29, h: 0.54, color: '#203E78', glow: '#34E5FF' },
  { side: 'left',  x: -0.04, y: 0.32, w: 0.23, h: 0.46, color: '#315395', glow: '#A16BFF' },
  { side: 'right', x: 0.82,  y: 0.08, w: 0.29, h: 0.57, color: '#22417D', glow: '#48ECFF' },
  { side: 'right', x: 0.84,  y: 0.36, w: 0.22, h: 0.43, color: '#3A4F94', glow: '#FF62CF' },
];

function CyberWorld2({
  world,
  scrollOffset,
}: {
  world: World;
  scrollOffset: number;
}) {

  const pulse = 0.45 + Math.sin(scrollOffset * Math.PI * 2) * 0.10;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Bright futuristic daytime/nightfall sky haze */}
      <LinearGradient
        colors={[
          'rgba(82,116,255,0.18)',
          'rgba(50,215,255,0.10)',
          'rgba(0,229,255,0)',
        ]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: HORIZON_Y * 0.16,
          height: HORIZON_Y * 0.88,
        }}
      />

      {/* Distant sun / energy moon */}
      <View
        style={{
          position: 'absolute',
          width: SCREEN_W * 0.23,
          height: SCREEN_W * 0.23,
          borderRadius: SCREEN_W,
          left: SCREEN_W * 0.385,
          top: HORIZON_Y * 0.22,
          backgroundColor: 'rgba(110,225,255,0.10)',
          borderWidth: 2,
          borderColor: 'rgba(139,236,255,0.34)',
          shadowColor: '#69E7FF',
          shadowOpacity: 0.85,
          shadowRadius: 28,
          elevation: 2,
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: '58%',
            height: '58%',
            borderRadius: 999,
            left: '21%',
            top: '21%',
            backgroundColor: 'rgba(220,249,255,0.28)',
          }}
        />
      </View>

      {/* Far skyline */}
      {CYBER_FAR_BUILDINGS.map((b, i) => (
        <View
          key={'cyber-far-' + i}
          style={{
            position: 'absolute',
            left: SCREEN_W * b.x,
            width: SCREEN_W * b.w,
            height: b.h,
            top: HORIZON_Y - b.h + 8,
            backgroundColor: b.c,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            borderWidth: 1,
            borderColor: 'rgba(166,225,255,0.16)',
            opacity: 0.92,
          }}
        >
          {/* illuminated roof */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: '12%',
              right: '12%',
              height: 2,
              backgroundColor: b.glow,
              opacity: 0.85,
            }}
          />

          {/* windows */}
          {[0.22, 0.46, 0.70].map((yy, j) => (
            <View
              key={j}
              style={{
                position: 'absolute',
                top: b.h * yy,
                left: j % 2 === 0 ? '18%' : '52%',
                width: '25%',
                height: 3,
                borderRadius: 2,
                backgroundColor: b.glow,
                opacity: 0.48,
              }}
            />
          ))}
        </View>
      ))}

      {/* Elevated city bridge at horizon */}
      <View
        style={{
          position: 'absolute',
          top: HORIZON_Y + 7,
          left: SCREEN_W * 0.05,
          right: SCREEN_W * 0.05,
          height: 5,
          borderRadius: 4,
          backgroundColor: 'rgba(71,136,205,0.70)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(76,235,255,0.75)',
        }}
      />

      {/* Massive foreground towers — creates depth/parallax */}
      {CYBER_SIDE_TOWERS.map((t, i) => (
        <View
          key={'cyber-side-' + i}
          style={{
            position: 'absolute',
            left: SCREEN_W * t.x,
            top: HORIZON_Y + (PLAYER_Y - HORIZON_Y) * t.y,
            width: SCREEN_W * t.w,
            height: (PLAYER_Y - HORIZON_Y) * t.h,
            backgroundColor: t.color,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(146,211,255,0.20)',
            opacity: 0.94,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.12)',
              'rgba(69,184,255,0.05)',
              'rgba(4,16,50,0.35)',
            ]}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={{
              position: 'absolute',
              top: 12,
              bottom: 14,
              width: 3,
              borderRadius: 4,
              backgroundColor: t.glow,
              opacity: pulse,
              ...(t.side === 'left' ? { right: 12 } : { left: 12 }),
            }}
          />

          {[0.19, 0.34, 0.49, 0.64, 0.79].map((yy, j) => (
            <View
              key={j}
              style={{
                position: 'absolute',
                top: yy * (PLAYER_Y - HORIZON_Y) * t.h,
                left: '18%',
                right: '18%',
                height: 2,
                backgroundColor:
                  j % 2 === 0
                    ? 'rgba(111,230,255,0.32)'
                    : 'rgba(185,116,255,0.25)',
              }}
            />
          ))}
        </View>
      ))}

      {/* Side floating platforms */}
      <View
        style={{
          position: 'absolute',
          top: HORIZON_Y + 92,
          left: -18,
          width: SCREEN_W * 0.31,
          height: 13,
          borderRadius: 7,
          backgroundColor: '#314F83',
          borderTopWidth: 2,
          borderTopColor: '#42E5FF',
          transform: [{ rotate: '-5deg' }],
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: HORIZON_Y + 124,
          right: -22,
          width: SCREEN_W * 0.33,
          height: 14,
          borderRadius: 7,
          backgroundColor: '#354E89',
          borderTopWidth: 2,
          borderTopColor: '#C46DFF',
          transform: [{ rotate: '5deg' }],
        }}
      />

      {/* Atmospheric lower-city blue haze */}
      <LinearGradient
        colors={[
          'rgba(32,185,255,0)',
          'rgba(31,131,218,0.07)',
          'rgba(37,78,145,0.14)',
        ]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: HORIZON_Y,
          bottom: 0,
        }}
      />
    </View>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ZYRIX 2.0 — CYBER ROADSIDE PROPS
// Büyük yol kenarı objeleri sahnenin oyuncak/arcade ölçeğini güçlendirir.
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// ZYRIX 2.0 — CYBER WORLD DEPTH
// Büyük ölçekli şehir dekorları. Gameplay / collision sisteminden bağımsızdır.
// ─────────────────────────────────────────────────────────────────────────────

function CyberWorldDepth({
  world,
  scrollOffset,
}: {
  world: World;
  scrollOffset: number;
}) {

  const pulse = 0.62 + Math.sin(scrollOffset * Math.PI * 2) * 0.16;
  const pulse2 = 0.52 + Math.cos(scrollOffset * Math.PI * 2) * 0.14;

  const leftBuildings = [
    {
      x: -SCREEN_W * 0.09,
      y: HORIZON_Y - 118,
      w: SCREEN_W * 0.23,
      h: 154,
      color: '#172B55',
      neon: '#46E9FF',
    },
    {
      x: -SCREEN_W * 0.035,
      y: HORIZON_Y - 74,
      w: SCREEN_W * 0.16,
      h: 112,
      color: '#213A70',
      neon: '#8AF7FF',
    },
  ];

  const rightBuildings = [
    {
      x: SCREEN_W * 0.86,
      y: HORIZON_Y - 134,
      w: SCREEN_W * 0.24,
      h: 171,
      color: '#25265E',
      neon: '#C677FF',
    },
    {
      x: SCREEN_W * 0.89,
      y: HORIZON_Y - 66,
      w: SCREEN_W * 0.16,
      h: 104,
      color: '#333474',
      neon: '#FF70D2',
    },
  ];

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {/* -----------------------------------------------------
          DISTANT MEGACITY — LEFT
      ----------------------------------------------------- */}
      {leftBuildings.map((b, i) => (
        <View
          key={'cyber-depth-left-' + i}
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            backgroundColor: b.color,
            borderTopRightRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(112,225,255,0.20)',
            opacity: 0.96,
          }}
        >
          <LinearGradient
            colors={[
              'rgba(100,220,255,0.18)',
              'rgba(20,40,90,0.02)',
              'rgba(7,17,40,0.24)',
            ]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopRightRadius: 10,
            }}
          />

          {[0, 1, 2, 3].map(j => (
            <View
              key={'cyber-depth-left-window-' + i + '-' + j}
              style={{
                position: 'absolute',
                right: 7 + (j % 2) * 14,
                top: 15 + j * 27,
                width: 8,
                height: 13,
                borderRadius: 2,
                backgroundColor: b.neon,
                opacity: j % 2 === 0 ? pulse : 0.44,
                shadowColor: b.neon,
                shadowOpacity: 0.9,
                shadowRadius: 7,
              }}
            />
          ))}

          <View
            style={{
              position: 'absolute',
              right: 3,
              top: 8,
              bottom: 8,
              width: 2,
              backgroundColor: b.neon,
              opacity: 0.54,
            }}
          />
        </View>
      ))}

      {/* -----------------------------------------------------
          DISTANT MEGACITY — RIGHT
      ----------------------------------------------------- */}
      {rightBuildings.map((b, i) => (
        <View
          key={'cyber-depth-right-' + i}
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            backgroundColor: b.color,
            borderTopLeftRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(205,130,255,0.20)',
            opacity: 0.96,
          }}
        >
          <LinearGradient
            colors={[
              'rgba(213,120,255,0.18)',
              'rgba(40,33,95,0.03)',
              'rgba(15,15,52,0.26)',
            ]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopLeftRadius: 10,
            }}
          />

          {[0, 1, 2, 3].map(j => (
            <View
              key={'cyber-depth-right-window-' + i + '-' + j}
              style={{
                position: 'absolute',
                left: 8 + (j % 2) * 15,
                top: 13 + j * 28,
                width: 8,
                height: 14,
                borderRadius: 2,
                backgroundColor: b.neon,
                opacity: j % 2 === 0 ? pulse2 : 0.46,
                shadowColor: b.neon,
                shadowOpacity: 0.9,
                shadowRadius: 7,
              }}
            />
          ))}

          <View
            style={{
              position: 'absolute',
              left: 3,
              top: 8,
              bottom: 8,
              width: 2,
              backgroundColor: b.neon,
              opacity: 0.56,
            }}
          />
        </View>
      ))}

      {/* -----------------------------------------------------
          DISTANT CENTRAL CITY GATE
      ----------------------------------------------------- */}
      <View
        style={{
          position: 'absolute',
          left: SCREEN_W * 0.31,
          top: HORIZON_Y - 54,
          width: SCREEN_W * 0.38,
          height: 58,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 12,
            width: 12,
            height: 46,
            borderRadius: 5,
            backgroundColor: '#263F78',
            borderWidth: 1,
            borderColor: '#56EDFF',
          }}
        />

        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 12,
            width: 12,
            height: 46,
            borderRadius: 5,
            backgroundColor: '#423270',
            borderWidth: 1,
            borderColor: '#C878FF',
          }}
        />

        <LinearGradient
          colors={[
            '#173B72',
            '#4474B8',
            '#523887',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: 'absolute',
            left: 5,
            right: 5,
            top: 5,
            height: 13,
            borderRadius: 7,
            borderWidth: 1,
            borderColor: 'rgba(181,248,255,0.72)',
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: '23%',
            right: '23%',
            top: 8,
            height: 3,
            borderRadius: 4,
            backgroundColor: '#D9FFFF',
            opacity: pulse,
            shadowColor: '#71F6FF',
            shadowOpacity: 1,
            shadowRadius: 7,
          }}
        />
      </View>

      {/* -----------------------------------------------------
          LEFT HOLOGRAM BILLBOARD
      ----------------------------------------------------- */}
      <View
        style={{
          position: 'absolute',
          left: SCREEN_W * 0.015,
          top: HORIZON_Y + 14,
          width: SCREEN_W * 0.19,
          height: 64,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#52EFFF',
          backgroundColor: 'rgba(13,56,104,0.72)',
          transform: [{ rotate: '-3deg' }],
          shadowColor: '#35E8FF',
          shadowOpacity: 0.72,
          shadowRadius: 12,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: 9,
            height: 5,
            borderRadius: 4,
            backgroundColor: '#63F4FF',
            opacity: pulse,
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 8,
            width: '46%',
            top: 23,
            height: 4,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            opacity: 0.67,
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 8,
            width: '63%',
            top: 34,
            height: 4,
            borderRadius: 3,
            backgroundColor: '#8D92FF',
            opacity: 0.74,
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 8,
            width: '34%',
            top: 45,
            height: 4,
            borderRadius: 3,
            backgroundColor: '#FF75C8',
            opacity: 0.72,
          }}
        />
      </View>

      {/* -----------------------------------------------------
          RIGHT HOLOGRAM BILLBOARD
      ----------------------------------------------------- */}
      <View
        style={{
          position: 'absolute',
          right: SCREEN_W * 0.01,
          top: HORIZON_Y + 68,
          width: SCREEN_W * 0.20,
          height: 69,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#C675FF',
          backgroundColor: 'rgba(54,34,110,0.72)',
          transform: [{ rotate: '4deg' }],
          shadowColor: '#C56EFF',
          shadowOpacity: 0.70,
          shadowRadius: 12,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: 9,
            height: 5,
            borderRadius: 4,
            backgroundColor: '#FF77CF',
            opacity: pulse2,
          }}
        />

        <View
          style={{
            position: 'absolute',
            right: 8,
            width: '51%',
            top: 24,
            height: 4,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            opacity: 0.65,
          }}
        />

        <View
          style={{
            position: 'absolute',
            right: 8,
            width: '68%',
            top: 36,
            height: 4,
            borderRadius: 3,
            backgroundColor: '#79EFFF',
            opacity: 0.76,
          }}
        />

        <View
          style={{
            position: 'absolute',
            right: 8,
            width: '37%',
            top: 48,
            height: 4,
            borderRadius: 3,
            backgroundColor: '#B483FF',
            opacity: 0.74,
          }}
        />
      </View>

      {/* -----------------------------------------------------
          SIDE SUPPORT ARCHES
      ----------------------------------------------------- */}
      {[0, 1, 2].map(i => {
        const y = HORIZON_Y + 128 + i * 116;
        const size = 12 + i * 5;

        return (
          <React.Fragment key={'cyber-side-arch-' + i}>
            <View
              style={{
                position: 'absolute',
                left: SCREEN_W * (0.045 - i * 0.006),
                top: y,
                width: size,
                height: 64 + i * 24,
                borderRadius: 7,
                backgroundColor: '#284875',
                borderWidth: 1,
                borderColor: 'rgba(83,236,255,0.62)',
              }}
            />

            <View
              style={{
                position: 'absolute',
                right: SCREEN_W * (0.045 - i * 0.006),
                top: y,
                width: size,
                height: 64 + i * 24,
                borderRadius: 7,
                backgroundColor: '#403268',
                borderWidth: 1,
                borderColor: 'rgba(202,119,255,0.62)',
              }}
            />

            <View
              style={{
                position: 'absolute',
                left: SCREEN_W * (0.052 - i * 0.006),
                top: y + 8,
                width: 3,
                height: 40 + i * 20,
                borderRadius: 3,
                backgroundColor: '#51EDFF',
                opacity: pulse,
              }}
            />

            <View
              style={{
                position: 'absolute',
                right: SCREEN_W * (0.052 - i * 0.006),
                top: y + 8,
                width: 3,
                height: 40 + i * 20,
                borderRadius: 3,
                backgroundColor: '#D074FF',
                opacity: pulse2,
              }}
            />
          </React.Fragment>
        );
      })}

      {/* -----------------------------------------------------
          TRACKSIDE WARNING LIGHTS
      ----------------------------------------------------- */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const y = HORIZON_Y + 82 + i * 62;
        const size = 3 + i * 0.8;

        return (
          <React.Fragment key={'cyber-depth-warning-' + i}>
            <View
              style={{
                position: 'absolute',
                left: SCREEN_W * (0.095 - i * 0.002),
                top: y,
                width: size,
                height: size,
                borderRadius: 20,
                backgroundColor: i % 2 === 0 ? '#57F0FF' : '#FFDB66',
                opacity: 0.86,
              }}
            />

            <View
              style={{
                position: 'absolute',
                right: SCREEN_W * (0.095 - i * 0.002),
                top: y,
                width: size,
                height: size,
                borderRadius: 20,
                backgroundColor: i % 2 === 0 ? '#C974FF' : '#FF6DB9',
                opacity: 0.86,
              }}
            />
          </React.Fragment>
        );
      })}
    </View>
  );
}

function CyberRoadsideProps({
  world,
  scrollOffset,
}: {
  world: World;
  scrollOffset: number;
}) {

  const glow = 0.58 + Math.sin(scrollOffset * Math.PI * 2) * 0.18;

  const poles = [
    { left: SCREEN_W * 0.015, top: HORIZON_Y + 56, h: 88, c: '#49EBFF' },
    { left: SCREEN_W * 0.91,  top: HORIZON_Y + 82, h: 106, c: '#C26EFF' },
    { left: SCREEN_W * 0.035, top: HORIZON_Y + 190, h: 132, c: '#6FF4FF' },
    { left: SCREEN_W * 0.895, top: HORIZON_Y + 225, h: 145, c: '#FF72C7' },
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {poles.map((p, i) => (
        <View
          key={'cyber-pole-' + i}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: i < 2 ? 15 : 20,
            height: p.h,
          }}
        >
          <LinearGradient
            colors={['#5B769F', '#263F70', '#172A4F']}
            style={{
              position: 'absolute',
              left: 2,
              right: 2,
              top: 0,
              bottom: 0,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(185,225,255,0.35)',
            }}
          />

          <View
            style={{
              position: 'absolute',
              left: '37%',
              width: '26%',
              top: '7%',
              bottom: '8%',
              borderRadius: 6,
              backgroundColor: p.c,
              opacity: glow,
              shadowColor: p.c,
              shadowOpacity: 1,
              shadowRadius: 12,
            }}
          />

          <View
            style={{
              position: 'absolute',
              left: -5,
              right: -5,
              top: -4,
              height: 9,
              borderRadius: 6,
              backgroundColor: '#7896BE',
            }}
          />
        </View>
      ))}

      {/* Left floating hologram platform */}
      <View
        style={{
          position: 'absolute',
          left: -22,
          top: HORIZON_Y + 156,
          width: SCREEN_W * 0.24,
          height: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#49E9FF',
          backgroundColor: 'rgba(34,70,126,0.82)',
          transform: [{ rotate: '-4deg' }],
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: 9,
            top: 8,
            width: '52%',
            height: 7,
            borderRadius: 5,
            backgroundColor: '#5FF4FF',
            opacity: 0.72,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 14,
            top: 23,
            width: '35%',
            height: 4,
            borderRadius: 4,
            backgroundColor: '#B57AFF',
            opacity: 0.8,
          }}
        />
      </View>

      {/* Right floating hologram platform */}
      <View
        style={{
          position: 'absolute',
          right: -25,
          top: HORIZON_Y + 288,
          width: SCREEN_W * 0.27,
          height: 55,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: '#CB75FF',
          backgroundColor: 'rgba(45,55,126,0.86)',
          transform: [{ rotate: '5deg' }],
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 11,
            top: 9,
            width: '58%',
            height: 7,
            borderRadius: 5,
            backgroundColor: '#FF72CB',
            opacity: 0.78,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 16,
            top: 25,
            width: '38%',
            height: 4,
            borderRadius: 4,
            backgroundColor: '#6BF4FF',
            opacity: 0.82,
          }}
        />
      </View>

      {/* small runway lights */}
      {[0, 1, 2, 3, 4].map(i => (
        <React.Fragment key={'runway-light-' + i}>
          <View
            style={{
              position: 'absolute',
              left: SCREEN_W * (0.065 + i * 0.004),
              top: HORIZON_Y + 100 + i * 70,
              width: 5 + i,
              height: 5 + i,
              borderRadius: 99,
              backgroundColor: '#55EEFF',
              shadowColor: '#55EEFF',
              shadowOpacity: 1,
              shadowRadius: 8,
            }}
          />

          <View
            style={{
              position: 'absolute',
              right: SCREEN_W * (0.065 + i * 0.004),
              top: HORIZON_Y + 100 + i * 70,
              width: 5 + i,
              height: 5 + i,
              borderRadius: 99,
              backgroundColor: '#C672FF',
              shadowColor: '#C672FF',
              shadowOpacity: 1,
              shadowRadius: 8,
            }}
          />
        </React.Fragment>
      ))}
    </View>
  );
}

const VOLCANO_EMBERS = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 47) % 100 / 100,
  y: (i * 83) % 100 / 100,
  size: 3 + (i % 4),
  group: i % 3,
}));

const VolcanoEmbers = React.memo(function VolcanoEmbers({ world }: { world: World }) {
  const rise0 = useRef(new Animated.Value(0)).current;
  const rise1 = useRef(new Animated.Value(0)).current;
  const rise2 = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (world.id !== 'volcano') return;
    const mk = (v: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.timing(v, { toValue: 1, duration: dur, useNativeDriver: true, easing: Easing.linear })
      );
    const a = mk(rise0, 2600);
    const b = mk(rise1, 3400);
    const c = mk(rise2, 4200);
    const s = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    a.start(); b.start(); c.start(); s.start();
    return () => { a.stop(); b.stop(); c.stop(); s.stop(); };
  }, [world.id, rise0, rise1, rise2, shimmer]);

  if (world.id !== 'volcano') return null;

  const rises = [rise0, rise1, rise2];

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: HORIZON_Y - 60,
          height: 140,
          backgroundColor: world.horizonGlow,
          opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] }),
        }}
      />

      {VOLCANO_EMBERS.map((m, i) => {
        const v = rises[m.group];
        return (
          <Animated.View
            key={'ember-' + i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: m.x * SCREEN_W,
              top: m.y * (SCREEN_W * 2.2) + 200,
              width: m.size,
              height: m.size,
              borderRadius: m.size / 2,
              backgroundColor: m.group === 0 ? '#FFD27A' : world.accentColor,
              shadowColor: world.trackColor,
              shadowOpacity: 1,
              shadowRadius: 6,
              opacity: v.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.9, 0.5, 0] }),
              transform: [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -220 - m.size * 20] }) },
                { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, m.group === 0 ? 14 : -14, 6] }) },
              ],
            }}
          />
        );
      })}
    </>
  );
});

const AirParticles = React.memo(function AirParticles({ world }: { world: World }) {
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const mk = (v: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.timing(v, { toValue: 1, duration: dur, useNativeDriver: true, easing: Easing.linear })
      );
    const a = mk(driftA, 5200);
    const b = mk(driftB, 7600);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [driftA, driftB]);

  return (
    <>
      {MOTES.map((m, i) => {
        const v = m.group === 0 ? driftA : driftB;
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: m.x * SCREEN_W,
              top: m.y * (SCREEN_W * 2),
              width: m.size,
              height: m.size,
              borderRadius: m.size / 2,
              backgroundColor: world.trackColor,
              opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.55, 0.35, 0] }),
              transform: [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -70 - m.size * 12] }) },
                { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, m.group === 0 ? 8 : -8, 0] }) },
              ],
            }}
          />
        );
      })}
    </>
  );
});

// ─── Energy Pillars + Rail Light Strips (scroll-driven) ──────────────────────
// Positioned from scrollOffset, which already updates per frame — no extra
// animation machinery. Simple Views, cheap on Android.
function TrackSideFX({ scrollOffset, world }: { scrollOffset: number; world: World }) {
  const items = [];
  const N = 4;
  for (let i = 0; i < N; i++) {
    const t = ((i / N) + scrollOffset * 0.5) % 1;
    if (t < 0.08) continue;
    const e = Math.pow(t, 0.85);
    const y = HORIZON_Y + (PLAYER_Y + 60 - HORIZON_Y) * e;
    const lx = VP_X + (TRACK_LEFT_X - VP_X) * e;
    const rx = VP_X + (TRACK_RIGHT_X - VP_X) * e;
    const h = 10 + 46 * e;
    const w = Math.max(2, 5 * e);
    const op = 0.15 + 0.5 * e;
    for (const [key, x, off] of [[`L${i}`, lx, -10 - w] as const, [`R${i}`, rx, 10] as const]) {
      items.push(
        <View
          key={key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: x + off,
            top: y - h,
            width: w,
            height: h,
            borderRadius: w / 2,
            backgroundColor: world.trackColor,
            opacity: op,
            shadowColor: world.trackColor,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8 * e,
            shadowOpacity: 0.9,
            elevation: 4,
          }}
        />
      );
    }
  }
  // Bright light pulses racing along the outer rails
  const M = 3;
  for (let i = 0; i < M; i++) {
    const t = ((i / M) + scrollOffset * 1.4) % 1;
    if (t < 0.05) continue;
    const e = Math.pow(t, 0.85);
    const y = HORIZON_Y + (PLAYER_Y + 60 - HORIZON_Y) * e;
    const len = 6 + 22 * e;
    for (const [key, x0, x1] of [
      [`SL${i}`, VP_X + (TRACK_LEFT_X - VP_X) * e, VP_X + (TRACK_LEFT_X - VP_X) * Math.min(1, e + 0.05)] as const,
      [`SR${i}`, VP_X + (TRACK_RIGHT_X - VP_X) * e, VP_X + (TRACK_RIGHT_X - VP_X) * Math.min(1, e + 0.05)] as const,
    ]) {
      items.push(
        <View
          key={key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: Math.min(x0, x1) - 2,
            top: y - 1,
            width: Math.max(len, Math.abs(x1 - x0)),
            height: Math.max(2, 3 * e),
            borderRadius: 2,
            backgroundColor: world.trackColor,
            opacity: 0.18 + 0.42 * e,
            shadowColor: world.trackColor,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 5,
            shadowOpacity: 0.8,
            elevation: 3,
            transform: [{ rotate: `${x0 < VP_X ? 61 : -61}deg` }],
          }}
        />
      );
    }
  }
  return <>{items}</>;
}

// ─── Distance Fog ─────────────────────────────────────────────────────────────
const DistanceFog = React.memo(({ world }: { world: World }) => (
  <>
    {/* Haze over the city base */}
    <LinearGradient
      colors={['rgba(10,16,38,0)', 'rgba(12,20,46,0.75)']}
      style={{ position: 'absolute', top: HORIZON_Y - 44, left: 0, right: 0, height: 44 }}
      pointerEvents="none"
    />
    {/* Fog rolling from the horizon down the track */}
    <LinearGradient
      colors={[world.horizonGlow, 'rgba(10,16,38,0.35)', 'rgba(10,16,38,0)']}
      style={{ position: 'absolute', top: HORIZON_Y, left: 0, right: 0, height: 110 }}
      pointerEvents="none"
    />
  </>
));

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
// ─── Neon Billboards (animated scan bar, one shared loop) ────────────────────
const BILLBOARDS = [
  { x: SCREEN_W * 0.16, y: HORIZON_Y - 80, w: 36, h: 18 },
  { x: SCREEN_W * 0.64, y: HORIZON_Y - 94, w: 44, h: 22 },
];

function NeonBillboards({ world }: { world: World }) {
  const scan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 2400, useNativeDriver: true, easing: Easing.inOut(Easing.quad) })
    );
    anim.start();
    return () => anim.stop();
  }, [scan]);

  return (
    <>
      {BILLBOARDS.map((b, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: i === 0 ? world.trackColor : world.accentColor,
            backgroundColor: '#070A18',
            overflow: 'hidden',
          }}
        >
          {/* static "content" rows */}
          <View style={{ position: 'absolute', left: 4, top: 4, width: b.w * 0.55, height: 2, borderRadius: 1, backgroundColor: world.trackColor, opacity: 0.7 }} />
          <View style={{ position: 'absolute', left: 4, top: 9, width: b.w * 0.35, height: 2, borderRadius: 1, backgroundColor: world.accentColor, opacity: 0.55 }} />
          {/* sweeping light bar */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 8,
              backgroundColor: i === 0 ? world.trackColor : world.accentColor,
              opacity: 0.28,
              transform: [
                {
                  translateX: scan.interpolate({
                    inputRange: [0, 1],
                    outputRange: i === 0 ? [-10, b.w + 4] : [b.w + 4, -10],
                  }),
                },
              ],
            }}
          />
        </View>
      ))}
    </>
  );
}

// ─── Flying Vehicles (distant ambience) ──────────────────────────────────────
const VEHICLES = [
  { y: HORIZON_Y - 118, dur: 11000, dir: 1, size: 7 },
  { y: HORIZON_Y - 142, dur: 16000, dir: -1, size: 5 },
  { y: HORIZON_Y - 100, dur: 13000, dir: 1, size: 6 },
];

function FlyingVehicles({ world }: { world: World }) {
  const ts = useRef(VEHICLES.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const anims = ts.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 2600),
          Animated.timing(v, { toValue: 1, duration: VEHICLES[i].dur, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [ts]);

  return (
    <>
      {VEHICLES.map((veh, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: veh.y,
            left: 0,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: ts[i].interpolate({ inputRange: [0, 0.06, 0.94, 1], outputRange: [0, 0.8, 0.8, 0] }),
            transform: [
              {
                translateX: ts[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: veh.dir === 1 ? [-30, SCREEN_W + 30] : [SCREEN_W + 30, -30],
                }),
              },
            ],
          }}
        >
          {/* light streak + hull + nav light */}
          <View style={{ width: veh.size * 1.6, height: 1.5, backgroundColor: world.trackColor, opacity: 0.35, borderRadius: 1 }} />
          <View style={{ width: veh.size, height: 2.5, borderRadius: 1.5, backgroundColor: '#1A2138', marginLeft: 1 }} />
          <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: world.accentColor, marginLeft: 1 }} />
        </Animated.View>
      ))}
    </>
  );
}

// ─── Scripted First-30s Set Pieces (visual only) ─────────────────────────────
// A boost-ramp strip sweeps under the player (~11s) and the track visually
// narrows (~18–24s). Pure render-layer: lanes/collision are untouched.
const RAMP_START = 11000;
const RAMP_DUR = 2400;
const NARROW_START = 17500;
const NARROW_END = 24500;

function SetPieces({ elapsedMs, world }: { elapsedMs: number; world: World }) {
  const items = [];

  // — Boost ramp strip —
  const rp = (elapsedMs - RAMP_START) / RAMP_DUR;
  if (rp > 0 && rp < 1.08) {
    const e = Math.pow(Math.min(rp, 1), 0.85);
    const y = HORIZON_Y + (PLAYER_Y + 40 - HORIZON_Y) * e;
    const leftX = VP_X + (TRACK_LEFT_X - VP_X) * e;
    const rightX = VP_X + (TRACK_RIGHT_X - VP_X) * e;
    const h = 4 + 30 * e;
    items.push(
      <View key="ramp" pointerEvents="none" style={{ position: 'absolute', left: leftX, top: y - h, width: rightX - leftX, height: h }}>
        <LinearGradient colors={['rgba(34,229,255,0)', world.trackColor]} style={{ flex: 1, opacity: 0.32 + 0.3 * e }} />
        {/* chevrons */}
        <View style={{ position: 'absolute', left: '30%', top: '30%', width: '12%', height: 2, backgroundColor: '#CFFAFF', opacity: 0.8, transform: [{ rotate: '18deg' }] }} />
        <View style={{ position: 'absolute', right: '30%', top: '30%', width: '12%', height: 2, backgroundColor: '#CFFAFF', opacity: 0.8, transform: [{ rotate: '-18deg' }] }} />
      </View>
    );
    // launch flare as it passes under the board
    if (rp > 0.9) {
      const f = 1 - Math.min(1, (rp - 0.9) / 0.18);
      items.push(
        <View
          key="rampflare"
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: TRACK_LEFT_X,
            top: PLAYER_Y - 6,
            width: TRACK_RIGHT_X - TRACK_LEFT_X,
            height: 16,
            borderRadius: 8,
            backgroundColor: world.trackColor,
            opacity: 0.3 * f,
          }}
        />
      );
    }
  }

  // — Narrow section: inner rails converge, side floors dim —
  if (elapsedMs > NARROW_START && elapsedMs < NARROW_END) {
    const fadeIn = Math.min(1, (elapsedMs - NARROW_START) / 800);
    const fadeOut = Math.min(1, (NARROW_END - elapsedMs) / 800);
    const f = Math.min(fadeIn, fadeOut);
    const inset = (TRACK_RIGHT_X - TRACK_LEFT_X) * 0.13;
    items.push(
      <Svg key="narrow" width={SCREEN_W} height={TRACK_H} style={[StyleSheet.absoluteFill, { top: HORIZON_Y }]} pointerEvents="none">
        <Line x1={VP_X} y1={0} x2={TRACK_LEFT_X + inset} y2={TRACK_H} stroke={world.accentColor} strokeWidth={2} opacity={0.75 * f} />
        <Line x1={VP_X} y1={0} x2={TRACK_RIGHT_X - inset} y2={TRACK_H} stroke={world.accentColor} strokeWidth={2} opacity={0.75 * f} />
        {/* dimmed shoulder wedges */}
        <Path d={`M${VP_X} 0 L${TRACK_LEFT_X} ${TRACK_H} L${TRACK_LEFT_X + inset} ${TRACK_H} Z`} fill="#02040C" opacity={0.5 * f} />
        <Path d={`M${VP_X} 0 L${TRACK_RIGHT_X} ${TRACK_H} L${TRACK_RIGHT_X - inset} ${TRACK_H} Z`} fill="#02040C" opacity={0.5 * f} />
      </Svg>
    );
  }

  return <>{items}</>;
}

// ─── 30s Portal (visual only — player passes through, same world) ────────────
function Portal30({ progress, world }: { progress: number; world: World }) {
  if (progress < 0 || progress > 1.25) return null;
  const e = Math.pow(Math.min(progress, 1), 0.85);
  const y = HORIZON_Y + (PLAYER_Y - HORIZON_Y) * e;
  const size = 16 + (SCREEN_W * 1.25 - 16) * e * e;
  const cx = VP_X;
  const op = progress > 1 ? Math.max(0, 1 - (progress - 1) * 4) : 0.35 + 0.65 * e;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: cx - size / 2, top: y - size / 2 - size * 0.12, width: size, height: size, opacity: op }}>
      {/* outer halo bloom */}
      <View style={{ position: 'absolute', left: '-12%', top: '-12%', width: '124%', height: '124%', borderRadius: 999, backgroundColor: world.trackColor, opacity: 0.06 }} />
      {/* soft core */}
      <View style={{ position: 'absolute', left: '18%', top: '18%', width: '64%', height: '64%', borderRadius: 999, backgroundColor: world.trackColor, opacity: 0.10 }} />
      {/* outer ring */}
      <View
        style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          borderRadius: 999,
          borderWidth: Math.max(2, size * 0.035),
          borderColor: world.trackColor,
          shadowColor: world.trackColor,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 24,
          shadowOpacity: 0.9,
          elevation: 10,
        }}
      />
      {/* inner ring */}
      <View
        style={{
          position: 'absolute',
          left: '8%', top: '8%', width: '84%', height: '84%',
          borderRadius: 999,
          borderWidth: Math.max(1, size * 0.014),
          borderColor: '#EAFDFF',
          opacity: 0.75,
        }}
      />
    </View>
  );
}

// ─── Cinematic Countdown: 3 · 2 · 1 · GO ─────────────────────────────────────
const COUNT_STEPS = ['3', '2', '1', 'GO'];

// Driven by the engine clock (displayState.countdownMs / elapsedMs), so
// "GO" appears on the exact frame the frozen world starts moving — no
// separate timer that could drift from the game loop.
function Countdown({ countdownMs, elapsedMs, world }: { countdownMs: number; elapsedMs: number; world: World }) {
  // 3 → 2 → 1 while frozen; GO for the first 540ms of live gameplay
  const step = countdownMs > 0 ? 3 - Math.ceil(countdownMs / COUNTDOWN_STEP_MS) : 3;
  const done = countdownMs <= 0 && elapsedMs > 360;

  const pop = useRef(new Animated.Value(0)).current;
  const prevStepRef = useRef(-1);
  useEffect(() => {
    if (done) return;
    if (step !== prevStepRef.current) {
      prevStepRef.current = step;
      pop.setValue(0);
      Animated.timing(pop, { toValue: 1, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
    }
  }, [step, done, pop]);

  if (done) return null;
  const isGo = step === 3;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: HORIZON_Y + 44, left: 0, right: 0, alignItems: 'center' }}>
      <Animated.Text
        style={{
          fontSize: isGo ? 54 : 64,
          fontWeight: '900',
          letterSpacing: isGo ? 8 : 2,
          color: isGo ? world.trackColor : '#EAFDFF',
          textShadowColor: world.trackColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 14,
          opacity: pop.interpolate({ inputRange: [0, 0.12, 0.75, 1], outputRange: [0, 1, 0.95, 0.7] }),
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1] }) }],
        }}
      >
        {COUNT_STEPS[step]}
      </Animated.Text>
    </View>
  );
}

// ─── Boost Flames (first 5 seconds) ──────────────────────────────────────────
const FLAMES = [
  { left: BOARD_W * 0.18, w: 9, h: 26 },
  { left: BOARD_W * 0.44, w: 12, h: 34 },
  { left: BOARD_W * 0.72, w: 9, h: 26 },
];

function BoostFlames({ playerX, fade, world }: { playerX: Animated.Value; fade: number; world: World }) {
  const flick = useRef(new Animated.Value(0)).current;
  const translateX = useRef(Animated.subtract(playerX, BOARD_HALF_W)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(flick, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(flick, { toValue: 0, duration: 110, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [flick]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: PLAYER_Y + BOARD_H / 2 + 6,
        width: BOARD_W,
        opacity: fade,
        transform: [{ translateX }],
      }}
    >
      {FLAMES.map((f, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: f.left - f.w / 2,
            top: 0,
            width: f.w,
            height: f.h,
            opacity: flick.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.55] }),
            transform: [
              { translateY: -f.h / 2 },
              { scaleY: flick.interpolate({ inputRange: [0, 1], outputRange: [1, 0.68] }) },
              { translateY: f.h / 2 },
            ],
          }}
        >
          <LinearGradient
            colors={['#FFFFFF', world.trackColor, 'rgba(34,229,255,0)']}
            style={{ flex: 1, borderBottomLeftRadius: f.w / 2, borderBottomRightRadius: f.w / 2 }}
          />
        </Animated.View>
      ))}
    </Animated.View>
  );
}

// ─── Drones patrolling above the track ───────────────────────────────────────
const DRONES = [
  { baseX: SCREEN_W * 0.30, y: HORIZON_Y + 46, range: SCREEN_W * 0.16, dur: 5200, size: 16 },
  { baseX: SCREEN_W * 0.68, y: HORIZON_Y + 88, range: SCREEN_W * 0.20, dur: 6800, size: 20 },
];

const Drones = React.memo(function Drones({ world }: { world: World }) {
  const ts = useRef(DRONES.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const anims = ts.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: DRONES[i].dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(v, { toValue: 0, duration: DRONES[i].dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [ts]);

  return (
    <>
      {DRONES.map((d, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: d.baseX - d.size / 2,
            top: d.y,
            alignItems: 'center',
            transform: [
              { translateX: ts[i].interpolate({ inputRange: [0, 1], outputRange: [-d.range / 2, d.range / 2] }) },
              { translateY: ts[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, i === 0 ? 5 : -6, 0] }) },
            ],
          }}
        >
          {/* hull */}
          <View style={{ width: d.size, height: d.size * 0.32, borderRadius: d.size * 0.16, backgroundColor: '#141A2E', borderWidth: 1, borderColor: world.trackColor }} />
          {/* rotor lights */}
          <View style={{ position: 'absolute', left: -1, top: 0, width: 3, height: 3, borderRadius: 1.5, backgroundColor: world.accentColor }} />
          <View style={{ position: 'absolute', right: -1, top: 0, width: 3, height: 3, borderRadius: 1.5, backgroundColor: world.trackColor }} />
          {/* downward scan beam */}
          <Animated.View
            style={{
              width: d.size * 0.6,
              height: d.size * 2.6,
              opacity: ts[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.10, 0.28, 0.10] }),
            }}
          >
            <LinearGradient colors={[world.trackColor, 'rgba(34,229,255,0)']} style={{ flex: 1 }} />
          </Animated.View>
        </Animated.View>
      ))}
    </>
  );
});

// ─── Animated Hologram Signs beside the track ────────────────────────────────
const HOLOS = [
  { x: SCREEN_W * 0.075, y: HORIZON_Y + 64, w: 34, h: 48, flip: false },
  { x: SCREEN_W * 0.845, y: HORIZON_Y + 112, w: 40, h: 56, flip: true },
];

const HologramSigns = React.memo(function HologramSigns({ world }: { world: World }) {
  const flicker = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 1100, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(flicker, { toValue: 0.25, duration: 140, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.9, duration: 160, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 1300, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [flicker]);

  return (
    <>
      {HOLOS.map((hSign, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: hSign.x,
            top: hSign.y,
            width: hSign.w,
            height: hSign.h,
            borderRadius: 3,
            borderWidth: 1,
            borderColor: world.trackColor,
            backgroundColor: 'rgba(34,229,255,0.07)',
            opacity: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.95] }),
            transform: [
              { perspective: 500 },
              { rotateY: hSign.flip ? '-24deg' : '24deg' },
              { translateY: flicker.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
            ],
          }}
        >
          {/* glyph rows */}
          {[0.18, 0.36, 0.54, 0.74].map((r, j) => (
            <View
              key={j}
              style={{
                position: 'absolute',
                left: 5,
                top: hSign.h * r,
                width: hSign.w * (j === 0 ? 0.6 : j === 3 ? 0.4 : 0.72),
                height: 2.5,
                borderRadius: 1,
                backgroundColor: j % 2 === 0 ? world.trackColor : world.accentColor,
                opacity: 0.8,
              }}
            />
          ))}
          {/* base emitter light */}
          <View style={{ position: 'absolute', bottom: -7, left: hSign.w * 0.38, width: hSign.w * 0.2, height: 3, borderRadius: 1.5, backgroundColor: '#EAFDFF', opacity: 0.9 }} />
        </Animated.View>
      ))}
    </>
  );
});

// ─── High-Speed Streaks (kick in at high speed) ──────────────────────────────
const STREAKS = Array.from({ length: 8 }, (_, i) => {
  const left = i % 2 === 0;
  return {
    x: left ? SCREEN_W * (0.03 + (i % 4) * 0.025) : SCREEN_W * (0.97 - (i % 4) * 0.025),
    y: HORIZON_Y + 40 + ((i * 97) % 300),
    len: 46 + ((i * 53) % 60),
    left,
  };
});

function SpeedStreaks({ level, world }: { level: number; world: World }) {
  const dash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(dash, { toValue: 1, duration: 260, useNativeDriver: true, easing: Easing.linear })
    );
    anim.start();
    return () => anim.stop();
  }, [dash]);

  const strength = Math.min(1, (level - 4) / 4); // level 5..8 → 0.25..1
  const count = level >= 7 ? 8 : 6;
  return (
    <>
      {STREAKS.slice(0, count).map((s, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: 2,
            height: s.len,
            borderRadius: 1,
            backgroundColor: i % 3 === 0 ? '#EAFDFF' : world.trackColor,
            opacity: dash.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: i % 2 === 0 ? [0.05, 0.4 * strength + 0.1, 0.05] : [0.35 * strength + 0.08, 0.05, 0.35 * strength + 0.08],
            }),
            transform: [
              { translateY: dash.interpolate({ inputRange: [0, 1], outputRange: [-30, 90] }) },
              { rotate: s.left ? '6deg' : '-6deg' },
            ],
          }}
        />
      ))}
    </>
  );
}

// ─── Lighting & Bloom overlays (static gradients — near-free) ────────────────
const BloomLighting = React.memo(({ world }: { world: World }) => (
  <>
    {/* intensified horizon core line */}
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: HORIZON_Y - 2,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: world.trackColor,
        opacity: 0.55,
        shadowColor: world.trackColor,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 4,
        shadowOpacity: 0.35,
        elevation: 0,
      }}
    />
    {/* bloom falloff above horizon */}
    <LinearGradient
      colors={['rgba(34,229,255,0)', 'rgba(34,229,255,0.10)']}
      style={{ position: 'absolute', top: HORIZON_Y - 34, left: 0, right: 0, height: 32 }}
      pointerEvents="none"
    />
    {/* ambient under-glow rising from the bottom of the track */}
    <LinearGradient
      colors={['rgba(34,229,255,0)', 'rgba(34,229,255,0.05)']}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 130 }}
      pointerEvents="none"
    />
    {/* top-of-sky darkening for contrast */}
    <LinearGradient
      colors={['rgba(0,1,6,0.5)', 'rgba(0,1,6,0)']}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90 }}
      pointerEvents="none"
    />
  </>
));

// ─── Cinematic Intro: energy beam + rider drop + camera pull-in ──────────────
const INTRO_MS = 1700;

/** Replays the intro whenever `runKey` changes (a new run started). */
function useIntroCinematic(runKey: number) {
  const introT = useRef(new Animated.Value(0)).current; // camera pull-in
  const dropT = useRef(new Animated.Value(0)).current; // rider drop
  const beamT = useRef(new Animated.Value(0)).current; // energy beam opacity

  useEffect(() => {
    introT.setValue(0);
    dropT.setValue(0);
    beamT.setValue(0);
    const anim = Animated.parallel([
      Animated.timing(introT, { toValue: 1, duration: INTRO_MS, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.sequence([
        Animated.timing(beamT, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(420),
        Animated.timing(beamT, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(240),
        Animated.timing(dropT, { toValue: 1, duration: 820, useNativeDriver: true, easing: Easing.out(Easing.back(1.4)) }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [introT, dropT, beamT, runKey]);

  return {
    introScale: introT.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1] }),
    introShiftY: introT.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }),
    dropY: dropT.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W * 0.9, 0] }),
    beamT,
  };
}

function EnergyBeam({ beamT, world }: { beamT: Animated.Value; world: World }) {
  const BEAM_W = 14;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: LANE_X_BOTTOM[1] - BEAM_W / 2,
        top: 0,
        width: BEAM_W,
        height: PLAYER_Y + 6,
        opacity: beamT,
      }}
    >
      <LinearGradient
        colors={['rgba(34,229,255,0)', world.trackColor, 'rgba(234,253,255,0.28)']}
        style={{ flex: 1, borderRadius: BEAM_W / 2 }}
      />
      {/* hot core */}
      <View style={{ position: 'absolute', left: BEAM_W * 0.36, top: 0, bottom: 0, width: BEAM_W * 0.18, borderRadius: BEAM_W * 0.09, backgroundColor: '#EAFDFF', opacity: 0.28 }} />
    </Animated.View>
  );
}

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

  // ── Per-run key: increments whenever the run clock resets (restart) ──
  const [runKey, setRunKey] = useState(0);
  const prevRunIdRef = useRef(0);
  useEffect(() => {
    // runId is monotonic and bumps on every startGame — catches restarts
    // even during the pre-start countdown (when elapsedMs never moved).
    if (displayState.runId !== prevRunIdRef.current) {
      prevRunIdRef.current = displayState.runId;
      setRunKey((k) => k + 1);
      setP30Flash(false);
      prevP30Ref.current = -1;
      airborneRef.current = false; // no phantom landing bounce on restart
    }
  }, [displayState.runId]);

  // ── Cinematic intro (replays each run) ──
  const { introScale, introShiftY, dropY, beamT } = useIntroCinematic(runKey);
  const introDone = displayState.elapsedMs > INTRO_MS + 400;

  // ── Gentle track sway during the first 30s (visual curve illusion) ──
  let swayPx = 0;
  const el = displayState.elapsedMs;
  if (el > 3000 && el < 30000) {
    const fade = Math.min(1, (el - 3000) / 2000) * (el > 26000 ? Math.max(0, (30000 - el) / 4000) : 1);
    swayPx = Math.round(Math.sin((el / 4200) * Math.PI * 2) * 9 * fade);
  }

  // ── Overdrive activation: one-shot title key ──
  const [odKey, setOdKey] = useState(0);
  const prevOdRef = useRef(false);
  useEffect(() => {
    if (displayState.overdriveActive && !prevOdRef.current) setOdKey((k) => k + 1);
    prevOdRef.current = displayState.overdriveActive;
  }, [displayState.overdriveActive]);

  // ── One-shot flash when the 30s portal engulfs the player ──
  const [p30Flash, setP30Flash] = useState(false);
  const prevP30Ref = useRef(-1);
  useEffect(() => {
    if (displayState.portal30 >= 0.96 && prevP30Ref.current < 0.96 && prevP30Ref.current >= 0) {
      setP30Flash(true);
    }
    prevP30Ref.current = displayState.portal30;
  }, [displayState.portal30]);

  // ── Camera: damped horizontal pan following the player's lane ──
  const camPan = useRef(
    cameraX.interpolate({
      inputRange: [LANE_X_BOTTOM[0], LANE_X_BOTTOM[2]],
      outputRange: [(LANE_X_BOTTOM[2] - LANE_X_BOTTOM[0]) * 0.03, -(LANE_X_BOTTOM[2] - LANE_X_BOTTOM[0]) * 0.03],
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
  // Eased so speed-step changes glide instead of snapping (premium feel)
  const fovAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fovAnim.stopAnimation();
    Animated.timing(fovAnim, {
      toValue: 1 + speedStep * 0.008, // up to +6.4% zoom at max speed
      duration: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [speedStep, fovAnim]);

  // ── Camera tilt: subtle counter-bank while changing lanes (visual only) ──
  const camTilt = useRef(
    boardTilt.interpolate({
      inputRange: [-22, 0, 22],
      outputRange: ['0.8deg', '0deg', '-0.8deg'],
    })
  ).current;

  // ── Vertical follow + landing bounce ──
  // The camera softly trails the jump arc (world sinks a touch as the rider
  // rises) and lands with a small damped bounce when the board touches down.
  const camFollowY = useRef(Animated.multiply(jumpY, -0.07)).current;
  const camBounce = useRef(new Animated.Value(0)).current;
  const airborneRef = useRef(false);
  useEffect(() => {
    const sub = jumpY.addListener(({ value }) => {
      if (value < -8) {
        airborneRef.current = true;
      } else if (airborneRef.current && value > -0.5) {
        airborneRef.current = false;
        Animated.sequence([
          Animated.timing(camBounce, { toValue: 5, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(camBounce, { toValue: -2, duration: 110, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(camBounce, { toValue: 0, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start();
      }
    });
    return () => jumpY.removeListener(sub);
  }, [jumpY, camBounce]);

  // ── Screen shake on collision ──
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;

  // ── Dynamic speed rumble: subtle continuous shake that scales with speed ──
  const rumble = useRef(new Animated.Value(0)).current;
  const rumbleAmp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(rumble, { toValue: 1, duration: 74, useNativeDriver: true }),
        Animated.timing(rumble, { toValue: -1, duration: 82, useNativeDriver: true }),
        Animated.timing(rumble, { toValue: 0.6, duration: 68, useNativeDriver: true }),
        Animated.timing(rumble, { toValue: -0.4, duration: 78, useNativeDriver: true }),
        Animated.timing(rumble, { toValue: 0, duration: 70, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [rumble]);

  // Rumble amplitude follows the quantized speed step (0 until mid speed)
  useEffect(() => {
    rumbleAmp.setValue(speedStep >= 3 ? (speedStep - 2) * 0.34 : 0);
  }, [speedStep, rumbleAmp]);

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

  const prevJumpingRef = useRef(displayState.jumping);
  useEffect(() => {
    if (displayState.jumping && !prevJumpingRef.current) {
      setBursts((b) => [
        ...b.slice(-3),
        {
          id: burstIdRef.current++,
          x: playerXValRef.current,
          y: PLAYER_Y,
          color: world.trackColor,
          kind: 'jump' as const,
        },
      ]);
    }
    prevJumpingRef.current = displayState.jumping;
  }, [displayState.jumping, world.trackColor]);

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
              { translateX: swayPx * 0.25 },
              {
                translateY: Animated.add(
                  Animated.add(shakeY, Animated.multiply(rumble, rumbleAmp)),
                  Animated.add(camFollowY, camBounce)
                ),
              },
              { translateY: introShiftY },
              { scale: fovAnim },
              { scale: introScale },
              { rotate: camTilt },
              { rotate: `${(swayPx * 0.015).toFixed(2)}deg` },
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

        {/* Cyber city skyline behind the horizon */}
        <CitySilhouette world={world} />
        <CityNeon world={world} />
          <CyberWorld2
            world={world}
            scrollOffset={displayState.scrollOffset}
          />
        <NeonBillboards world={world} />
        <FlyingVehicles world={world} />
        <BloomLighting world={world} />

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

        <CyberTrackSurface world={world} />
          <TrackLines world={world} />
        <SpeedLines scrollOffset={displayState.scrollOffset} world={world} />
        <TrackSideFX scrollOffset={displayState.scrollOffset} world={world} />

        {/* Scripted first-30s set pieces: boost ramp + narrow section */}
        <SetPieces elapsedMs={displayState.elapsedMs} world={world} />

        {/* 30s portal (visual only) */}
        <Portal30 progress={displayState.portal30} world={world} />

        {/* Drones + hologram signs over the track */}
        <Drones world={world} />
        <HologramSigns world={world} />

        {/* Atmospheric fog at the horizon */}
        <DistanceFog world={world} />

        {/* Floating air particles */}
        <CyberWorldDepth
            world={world}
            scrollOffset={displayState.scrollOffset}
          />
          <CyberRoadsideProps
            world={world}
            scrollOffset={displayState.scrollOffset}
          />
          <AirParticles world={world} />
          <VolcanoEmbers world={world} />

        {/* Crystals */}
        {displayState.crystalObjects.map((c) => (
          <CrystalView key={c.id} crystal={c} world={world} />
        ))}

        {/* Overdrive orbs */}
        {displayState.orbs.map((b) => (
          <OrbView key={b.id} orb={b} />
        ))}

        {/* Obstacles */}
        {displayState.obstacles.map((o) => (
          world.id === 'cyber' ? (
              <CyberObstacleSkin key={o.id} obstacle={o} world={world} />
            ) : (
              <ObstacleView key={o.id} obstacle={o} world={world} />
            )
        ))}

        {/* Intro energy beam */}
        {!introDone && <EnergyBeam beamT={beamT} world={world} />}

        {/* Boost flames during the first 5 seconds */}
        {el < 5000 && (
          <BoostFlames
            playerX={playerX}
            fade={el > 4300 ? Math.max(0, (5000 - el) / 700) : 1}
            world={world}
          />
        )}

        {/* High-speed streaks */}
        {speedStep >= 5 && <SpeedStreaks level={speedStep} world={world} />}

        {/* Overdrive trail + particles + glow (behind the player) */}
        <OverdriveFX active={displayState.overdriveActive} playerX={playerX} />


        {/* Player — wrapped in intro drop transform */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ translateY: dropY }] }]}
        >
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
        </Animated.View>

        {/* Particle bursts */}
        {bursts.map((b) => (
          <ParticleBurst key={b.id} burst={b} onDone={removeBurst} />
        ))}
      </Animated.View>

      {/* Portal transition flash */}
      {displayState.showPortal && <PortalFlash key={displayState.worldIndex} world={world} />}

      {/* 30s portal pass-through flash */}
      {p30Flash && <PortalFlash key={`p30-${runKey}`} world={world} />}

      {/* OVERDRIVE title — one-shot per activation */}
      {odKey > 0 && <OverdriveTitle key={odKey} />}

      {/* Cinematic countdown */}
      <Countdown countdownMs={displayState.countdownMs} elapsedMs={displayState.elapsedMs} world={world} />

      {Platform.OS === 'web' && <View style={{ height: 34 }} />}
    </View>
  );
}
