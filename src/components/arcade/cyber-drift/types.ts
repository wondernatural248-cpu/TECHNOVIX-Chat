export type GameState = 'MENU' | 'COUNTDOWN' | 'RACING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export interface CarProfile {
  id: 'apex' | 'vortex' | 'phantom';
  name: string;
  tagline: string;
  topSpeedKmh: number;
  accelRating: number;      // 1-10
  driftRating: number;      // 1-10 (slip angle & multiplier bonus)
  nitroRating: number;      // 1-10
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  description: string;
}

export interface TrackPoint {
  world: { x: number; y: number; z: number };
  screen: { x: number; y: number; w: number; scale: number };
}

export interface TrackSegment {
  index: number;
  p1: TrackPoint;
  p2: TrackPoint;
  curve: number;
  color: {
    road: string;
    curb: string;
    center: string;
    grid: string;
  };
  isCheckpoint: boolean;
  checkpointSector?: number;
  hasEnergyCell?: boolean;
  energyCellCollected?: boolean;
  decor?: 'tower_left' | 'tower_right' | 'gantry' | 'light_pole' | null;
}

export interface ObstacleVehicle {
  z: number;
  x: number;
  speed: number;
  color: string;
  type: 'drone' | 'pod';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'smoke' | 'spark' | 'nitro';
}

export interface RaceStats {
  score: number;
  highScore: number;
  driftPointsBanked: number;
  activeDriftScore: number;
  currentCombo: number;
  maxCombo: number;
  speedKmh: number;
  timeRemainingSec: number;
  checkpointsCleared: number;
  nitroPercent: number;
  isDrifting: boolean;
  driftAngle: number;
  totalDriftDistanceM: number;
}
