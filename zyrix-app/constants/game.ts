import { Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Screen / Perspective Constants ──────────────────────────────────────────
export const SCREEN_W = SW;
export const SCREEN_H = SH;

/** Y coordinate of the horizon (vanishing point) */
export const HORIZON_Y = SH * 0.38;

/** Y coordinate where the player sits (bottom of the track) */
export const PLAYER_Y = SH * 0.75;

/** Track width at player level */
export const TRACK_W_BOTTOM = SW * 0.86;
const LANE_W_BOTTOM = TRACK_W_BOTTOM / 3;
const TRACK_LEFT_BOTTOM = (SW - TRACK_W_BOTTOM) / 2;

/** Lane center X positions at player level */
export const LANE_X_BOTTOM: [number, number, number] = [
  TRACK_LEFT_BOTTOM + LANE_W_BOTTOM * 0.5,
  TRACK_LEFT_BOTTOM + LANE_W_BOTTOM * 1.5,
  TRACK_LEFT_BOTTOM + LANE_W_BOTTOM * 2.5,
];

/** Track edges at player level */
export const TRACK_LEFT_X = TRACK_LEFT_BOTTOM;
export const TRACK_RIGHT_X = TRACK_LEFT_BOTTOM + TRACK_W_BOTTOM;

/** Lane center X positions at horizon (converge toward center) */
const HORIZON_SPREAD = SW * 0.055;
export const LANE_X_HORIZON: [number, number, number] = [
  SW * 0.5 - HORIZON_SPREAD,
  SW * 0.5,
  SW * 0.5 + HORIZON_SPREAD,
];

export const VP_X = SW * 0.5; // Vanishing-point X

/** Returns screen position and scale for a game object at a given lane/progress */
export function getPerspPos(lane: 0 | 1 | 2, progress: number) {
  const t = Math.max(0, Math.min(1.3, progress));
  const ease = Math.pow(t, 0.85);
  const x = LANE_X_HORIZON[lane] + (LANE_X_BOTTOM[lane] - LANE_X_HORIZON[lane]) * ease;
  const y = HORIZON_Y + (PLAYER_Y - HORIZON_Y) * ease;
  const scale = Math.max(0.04, 0.05 + 0.95 * ease);
  return { x, y, scale };
}

// ─── Game Config ──────────────────────────────────────────────────────────────
export const GAME_CONFIG = {
  // Speed
  INITIAL_SPEED: 0.60,       // progress-units / second — fast enough to feel exciting
  MAX_SPEED: 2.2,            // high ceiling — gets intense
  SPEED_RAMP: 0.000028,      // speed increase per millisecond

  // One-hit death — no lives, no invincibility
  LIVES: 1,
  INVINCIBLE_MS: 0,

  // World transitions
  WORLD_SCORE_INTERVAL: 400,

  // Controls
  LANE_CHANGE_MS: 115,       // snappy lane change
  SWIPE_THRESHOLD: 22,       // px of horizontal movement to trigger swipe

  // Scoring
  SCORE_PER_SEC: 10,         // at base speed; scales with speed ratio
  CRYSTAL_SCORE: 30,         // generous crystal reward

  // Object sizes
  OBSTACLE_BASE_SIZE: 62,
  CRYSTAL_BASE_SIZE: 26,
  PLAYER_W: 112,
  PLAYER_H: 28,

  // Object limits
  MAX_OBSTACLES: 5,
  MAX_CRYSTALS: 9,

  // Collision windows (progress 0=horizon, 1.0=player)
  COLLISION_NEAR: 0.88,
  COLLISION_FAR: 1.03,
  CRYSTAL_NEAR: 0.84,
  CRYSTAL_FAR: 1.04,

  // Distance display: meters per (speed-unit × second)
  DIST_SCALE: 30,

  // Jump
  JUMP_MS: 640,          // total airtime
  JUMP_HEIGHT: 92,       // px the board rises
};

// ─── Worlds ───────────────────────────────────────────────────────────────────
export type World = {
  id: string;
  name: string;
  skyTop: string;
  skyBottom: string;
  groundTop: string;
  groundBottom: string;
  trackColor: string;
  accentColor: string;
  obstacleColor: string;
  crystalColor: string;
  horizonGlow: string;
  starColor: string;
};

export const WORLDS: World[] = [
  {
    id: 'cyber',
    name: 'CYBER CITY',
    skyTop: '#020215',
    skyBottom: '#0A1535',
    groundTop: '#081028',
    groundBottom: '#030A18',
    trackColor: '#00E5FF',
    accentColor: '#FF3CAC',
    obstacleColor: '#FF3CAC',
    crystalColor: '#00CFFF',
    horizonGlow: 'rgba(0,229,255,0.40)',
    starColor: 'rgba(0,229,255,0.7)',
  },
  {
    id: 'space',
    name: 'DEEP SPACE',
    skyTop: '#02020C',
    skyBottom: '#0C0222',
    groundTop: '#08021A',
    groundBottom: '#020008',
    trackColor: '#B24BF3',
    accentColor: '#00E5FF',
    obstacleColor: '#00E5FF',
    crystalColor: '#B24BF3',
    horizonGlow: 'rgba(178,75,243,0.40)',
    starColor: 'rgba(200,150,255,0.8)',
  },
  {
    id: 'desert',
    name: 'SAND DUNES',
    skyTop: '#2A1204',
    skyBottom: '#5C2A08',
    groundTop: '#4A2A0C',
    groundBottom: '#2A1204',
    trackColor: '#FF8C00',
    accentColor: '#FFD700',
    obstacleColor: '#FF4400',
    crystalColor: '#FFD700',
    horizonGlow: 'rgba(255,140,0,0.40)',
    starColor: 'rgba(255,200,100,0.6)',
  },
  {
    id: 'jungle',
    name: 'ANCIENT JUNGLE',
    skyTop: '#021205',
    skyBottom: '#062510',
    groundTop: '#041A08',
    groundBottom: '#021205',
    trackColor: '#00FF88',
    accentColor: '#AAFF00',
    obstacleColor: '#AAFF00',
    crystalColor: '#00FF88',
    horizonGlow: 'rgba(0,255,136,0.40)',
    starColor: 'rgba(100,255,150,0.6)',
  },
  {
    id: 'volcano',
    name: 'VOLCANO RIFT',
    skyTop: '#120303',
    skyBottom: '#2E0808',
    groundTop: '#1E0606',
    groundBottom: '#120303',
    trackColor: '#FF4400',
    accentColor: '#FF8800',
    obstacleColor: '#FF2200',
    crystalColor: '#FF8800',
    horizonGlow: 'rgba(255,68,0,0.40)',
    starColor: 'rgba(255,120,50,0.6)',
  },
  {
    id: 'snow',
    name: 'GLACIER PEAKS',
    skyTop: '#060E18',
    skyBottom: '#0E2030',
    groundTop: '#8AB0C8',
    groundBottom: '#4A7898',
    trackColor: '#88EEFF',
    accentColor: '#FFFFFF',
    obstacleColor: '#FFFFFF',
    crystalColor: '#88EEFF',
    horizonGlow: 'rgba(136,238,255,0.40)',
    starColor: 'rgba(200,240,255,0.7)',
  },
];

// ─── Hoverboards ──────────────────────────────────────────────────────────────
export type HoverBoard = {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  glowColor: string;
  accentColor: string;
  unlockScore: number;
};

export const BOARDS: HoverBoard[] = [
  {
    id: 'starter',
    name: 'PROTO BOARD',
    description: 'Your first ride. Raw and ready.',
    price: 0,
    color: '#00E5FF',
    glowColor: 'rgba(0,229,255,0.5)',
    accentColor: '#0088AA',
    unlockScore: 0,
  },
  {
    id: 'phantom',
    name: 'PHANTOM X',
    description: 'Ghost-like speed with spectral trails.',
    price: 500,
    color: '#B24BF3',
    glowColor: 'rgba(178,75,243,0.5)',
    accentColor: '#7700BB',
    unlockScore: 200,
  },
  {
    id: 'solar',
    name: 'SOLAR BLAZE',
    description: 'Burns with the intensity of a star.',
    price: 800,
    color: '#FF8C00',
    glowColor: 'rgba(255,140,0,0.5)',
    accentColor: '#CC5500',
    unlockScore: 400,
  },
  {
    id: 'glacier',
    name: 'GLACIER KING',
    description: 'Ice-forged. Unbreakable at speed.',
    price: 1200,
    color: '#88EEFF',
    glowColor: 'rgba(136,238,255,0.5)',
    accentColor: '#005566',
    unlockScore: 700,
  },
  {
    id: 'storm',
    name: 'STORM RIDER',
    description: 'Lightning-fast. Leaves storms behind.',
    price: 2000,
    color: '#FFD700',
    glowColor: 'rgba(255,215,0,0.5)',
    accentColor: '#AA8800',
    unlockScore: 1000,
  },
  {
    id: 'void',
    name: 'VOID RUNNER',
    description: 'Born in the absence of light.',
    price: 3500,
    color: '#FF3CAC',
    glowColor: 'rgba(255,60,172,0.5)',
    accentColor: '#990055',
    unlockScore: 1500,
  },
  {
    id: 'cosmic',
    name: 'COSMIC DRIFTER',
    description: 'Rides the fabric of space itself.',
    price: 5000,
    color: '#FFFFFF',
    glowColor: 'rgba(255,255,255,0.5)',
    accentColor: '#8888CC',
    unlockScore: 2500,
  },
];

// ─── Obstacle Types ───────────────────────────────────────────────────────────
export type ObstacleType = 'barrier' | 'spike' | 'laser' | 'pillar' | 'block' | 'ring';

export const OBSTACLE_TYPES_BY_WORLD: Record<string, ObstacleType[]> = {
  cyber:   ['barrier', 'laser', 'pillar', 'ring'],
  space:   ['block', 'spike', 'barrier', 'pillar'],
  desert:  ['pillar', 'spike', 'block', 'barrier'],
  jungle:  ['barrier', 'block', 'spike', 'pillar'],
  volcano: ['spike', 'block', 'barrier', 'ring'],
  snow:    ['block', 'barrier', 'spike', 'pillar'],
};

// Obstacle visual dimensions as multiples of base size
export const OBSTACLE_DIMS: Record<ObstacleType, { w: number; h: number }> = {
  barrier: { w: 1.55, h: 0.30 },
  spike:   { w: 0.32, h: 1.60 },
  laser:   { w: 1.90, h: 0.08 },
  pillar:  { w: 0.26, h: 1.40 },
  block:   { w: 0.85, h: 0.85 },
  ring:    { w: 1.10, h: 1.10 },
};
