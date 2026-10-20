import { CarProfile, ObstacleVehicle, TrackSegment } from './types';

export const CAR_PROFILES: CarProfile[] = [
  {
    id: 'apex',
    name: 'APEX-GT',
    tagline: 'Precision Neural Interceptor',
    topSpeedKmh: 215,
    accelRating: 8,
    driftRating: 7,
    nitroRating: 7,
    primaryColor: '#00f0ff',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(0, 240, 255, 0.5)',
    description: 'Balanced aerodynamics with high-speed stability and razor-sharp counter-steer control.',
  },
  {
    id: 'vortex',
    name: 'VORTEX-R',
    tagline: 'Slipstream Drift Specialist',
    topSpeedKmh: 198,
    accelRating: 7,
    driftRating: 10,
    nitroRating: 8,
    primaryColor: '#a855f7',
    accentColor: '#ec4899',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    description: 'Ultra-low friction rear hubs designed for aggressive slide angles and rapid combo multiplier buildup.',
  },
  {
    id: 'phantom',
    name: 'PHANTOM-X',
    tagline: 'Supersonic Nitro Prototype',
    topSpeedKmh: 242,
    accelRating: 9,
    driftRating: 6,
    nitroRating: 10,
    primaryColor: '#3b82f6',
    accentColor: '#00f0ff',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    description: 'Experimental twin turbine configuration that unleashes explosive nitro acceleration.',
  },
];

export const ROAD_WIDTH = 2000;
export const SEGMENT_LENGTH = 200;
export const TOTAL_SEGMENTS = 1400;
export const CAMERA_HEIGHT = 1000;
export const CAMERA_DEPTH = 0.84;
export const DRAW_DISTANCE = 180;

export function buildCyberTrack(): TrackSegment[] {
  const segments: TrackSegment[] = [];

  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    // Generate curved sections & sectors
    let curve = 0;
    let isCheckpoint = false;
    let checkpointSector: number | undefined;
    let decor: 'tower_left' | 'tower_right' | 'gantry' | 'light_pole' | null = null;
    const hasEnergyCell = i % 110 === 45;

    // Sector 1: Warmup & Long Sweepers (0 - 350)
    if (i > 60 && i < 160) curve = 2.2;
    else if (i > 180 && i < 280) curve = -2.4;
    else if (i === 350) {
      isCheckpoint = true;
      checkpointSector = 1;
    }

    // Sector 2: Skyway S-Turns (351 - 700)
    else if (i > 380 && i < 460) curve = 3.6;
    else if (i > 470 && i < 550) curve = -3.8;
    else if (i > 580 && i < 660) curve = 4.2;
    else if (i === 700) {
      isCheckpoint = true;
      checkpointSector = 2;
    }

    // Sector 3: Technical Chicanes (701 - 1050)
    else if (i > 730 && i < 780) curve = -4.5;
    else if (i > 790 && i < 840) curve = 4.8;
    else if (i > 860 && i < 920) curve = -5.0;
    else if (i > 950 && i < 1010) curve = 5.2;
    else if (i === 1050) {
      isCheckpoint = true;
      checkpointSector = 3;
    }

    // Sector 4: Downtown Grid Loop (1051 - 1400)
    else if (i > 1080 && i < 1180) curve = -3.5;
    else if (i > 1200 && i < 1320) curve = 3.8;
    else if (i === 1399) {
      isCheckpoint = true;
      checkpointSector = 4;
    }

    // Roadside decorations
    if (i % 25 === 0) decor = 'light_pole';
    else if (i % 70 === 0) decor = i % 140 === 0 ? 'tower_left' : 'tower_right';
    else if (i % 120 === 0) decor = 'gantry';

    // Futuristic cyberpunk colors: neon curb strips, dark asphalt, glowing center dashes
    const isAlt = Math.floor(i / 3) % 2 === 0;
    const roadColor = isAlt ? '#090b14' : '#0c0f1a';
    const curbColor = isAlt ? '#00f0ff' : '#8b5cf6';
    const centerColor = isAlt ? '#00f0ff' : 'transparent';
    const gridColor = isAlt ? 'rgba(0, 240, 255, 0.08)' : 'transparent';

    segments.push({
      index: i,
      p1: {
        world: { x: 0, y: 0, z: i * SEGMENT_LENGTH },
        screen: { x: 0, y: 0, w: 0, scale: 0 },
      },
      p2: {
        world: { x: 0, y: 0, z: (i + 1) * SEGMENT_LENGTH },
        screen: { x: 0, y: 0, w: 0, scale: 0 },
      },
      curve,
      color: { road: roadColor, curb: curbColor, center: centerColor, grid: gridColor },
      isCheckpoint,
      checkpointSector,
      hasEnergyCell,
      energyCellCollected: false,
      decor,
    });
  }

  return segments;
}

export function createInitialObstacles(): ObstacleVehicle[] {
  const obstacles: ObstacleVehicle[] = [];
  const count = 18;
  const lanePositions = [-0.6, -0.2, 0.2, 0.6];

  for (let i = 0; i < count; i++) {
    const lane = lanePositions[i % lanePositions.length];
    const zOffset = 300 * SEGMENT_LENGTH + i * (60 * SEGMENT_LENGTH) + Math.random() * 2000;
    obstacles.push({
      z: zOffset,
      x: lane,
      speed: 60 + Math.random() * 50,
      color: i % 2 === 0 ? '#ec4899' : '#3b82f6',
      type: i % 3 === 0 ? 'pod' : 'drone',
    });
  }

  return obstacles;
}

export function project3D(
  point: { x: number; y: number; z: number },
  cameraX: number,
  cameraY: number,
  cameraZ: number,
  width: number,
  height: number
) {
  const relX = point.x - cameraX;
  const relY = point.y - cameraY;
  const relZ = point.z - cameraZ;

  const scale = CAMERA_DEPTH / Math.max(relZ, 1);
  const screenX = Math.round(width / 2 + (scale * relX * width) / 2);
  const screenY = Math.round(height / 2 - (scale * relY * height) / 2);
  const screenW = Math.round((scale * ROAD_WIDTH * width) / 2);

  return { screenX, screenY, screenW, scale };
}
