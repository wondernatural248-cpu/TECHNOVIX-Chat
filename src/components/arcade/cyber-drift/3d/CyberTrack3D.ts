import * as THREE from 'three';

export interface TrafficDrone3D {
  mesh: THREE.Group;
  distance: number;
  laneX: number; // -6 to 6
  speed: number;
}

export interface EnergyCell3D {
  mesh: THREE.Mesh;
  distance: number;
  laneX: number;
  collected: boolean;
}

export interface Checkpoint3D {
  sector: number;
  distance: number;
  gantryMesh: THREE.Group;
  cleared: boolean;
}

export interface CyberTrack3DInstance {
  trackGroup: THREE.Group;
  roadMesh: THREE.Mesh;
  trackLength: number;
  roadHalfWidth: number;
  trafficDrones: TrafficDrone3D[];
  energyCells: EnergyCell3D[];
  checkpoints: Checkpoint3D[];
  getTrackTransform: (distance: number) => {
    position: THREE.Vector3;
    tangent: THREE.Vector3;
    normal: THREE.Vector3;
    binormal: THREE.Vector3;
    curvature: number;
  };
  update: (timeSec: number, playerDistance: number) => void;
  dispose: () => void;
}

export const TRACK_TOTAL_LENGTH = 3600; // 3.6 km continuous loop
export const ROAD_WIDTH_3D = 18;

export function createCyberTrack3D(): CyberTrack3DInstance {
  const trackGroup = new THREE.Group();
  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // Generate 3D Track Curve points
  const numPoints = 120;
  const curvePoints: THREE.Vector3[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const z = fraction * TRACK_TOTAL_LENGTH;

    // Procedural curvature across 4 sectors
    let x = 0;
    let y = 0;

    // Sector 1 (0 to 900): Gentle sweepers
    if (z > 150 && z < 750) {
      x = Math.sin(((z - 150) / 600) * Math.PI * 2) * 45;
    }
    // Sector 2 (900 to 1800): Elevated S-curves
    else if (z >= 750 && z < 1800) {
      x = Math.sin(((z - 750) / 1050) * Math.PI * 3) * 65;
      y = Math.sin(((z - 750) / 1050) * Math.PI) * 16; // Elevation hill
    }
    // Sector 3 (1800 to 2700): Technical Chicanes
    else if (z >= 1800 && z < 2700) {
      x = Math.sin(((z - 1800) / 900) * Math.PI * 5) * 55;
      y = Math.cos(((z - 1800) / 900) * Math.PI * 2) * 8;
    }
    // Sector 4 (2700 to 3600): High-speed downtown straight & sweeping loop
    else {
      x = Math.sin(((z - 2700) / 900) * Math.PI * 2) * 35;
    }

    curvePoints.push(new THREE.Vector3(x, y, z));
  }

  const trackSpline = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.2);

  // 1. 3D ROAD RIBBON GEOMETRY
  const samples = 360;
  const roadHalfWidth = ROAD_WIDTH_3D / 2;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = trackSpline.getPointAt(t);
    const tangent = trackSpline.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Left edge
    const leftPt = new THREE.Vector3().copy(pt).addScaledVector(normal, -roadHalfWidth);
    // Right edge
    const rightPt = new THREE.Vector3().copy(pt).addScaledVector(normal, roadHalfWidth);

    positions.push(leftPt.x, leftPt.y, leftPt.z);
    positions.push(rightPt.x, rightPt.y, rightPt.z);

    const uvV = (t * TRACK_TOTAL_LENGTH) / 10;
    uvs.push(0, uvV);
    uvs.push(1, uvV);

    if (i < samples) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  // Procedural dark asphalt canvas texture with glowing neon edge curbs and dashes
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0d17';
  ctx.fillRect(0, 0, 512, 512);

  // Left neon cyan curb
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(0, 0, 36, 512);

  // Right neon violet curb
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(512 - 36, 0, 36, 512);

  // Center dashed line (Cyan)
  ctx.fillStyle = '#00f0ff';
  for (let y = 0; y < 512; y += 96) {
    ctx.fillRect(256 - 6, y, 12, 52);
  }

  const roadTexture = new THREE.CanvasTexture(canvas);
  roadTexture.wrapS = THREE.ClampToEdgeWrapping;
  roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(1, 140);
  disposables.push(roadTexture);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.35,
    metalness: 0.2,
  });
  disposables.push(roadGeo, roadMat);

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  trackGroup.add(roadMesh);

  // 2. 3D GLOWING LASER BARRIERS (Left & Right)
  const barrierMatLeft = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.8,
  });
  const barrierMatRight = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.8,
  });
  disposables.push(barrierMatLeft, barrierMatRight);

  // Left barrier line
  const leftBarrierPoints: THREE.Vector3[] = [];
  const rightBarrierPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = trackSpline.getPointAt(t);
    const tangent = trackSpline.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    leftBarrierPoints.push(new THREE.Vector3().copy(pt).addScaledVector(normal, -roadHalfWidth - 0.2).add(new THREE.Vector3(0, 0.45, 0)));
    rightBarrierPoints.push(new THREE.Vector3().copy(pt).addScaledVector(normal, roadHalfWidth + 0.2).add(new THREE.Vector3(0, 0.45, 0)));
  }

  const leftBarrierCurve = new THREE.CatmullRomCurve3(leftBarrierPoints);
  const rightBarrierCurve = new THREE.CatmullRomCurve3(rightBarrierPoints);

  const barrierGeoLeft = new THREE.TubeGeometry(leftBarrierCurve, 240, 0.14, 6, false);
  const barrierGeoRight = new THREE.TubeGeometry(rightBarrierCurve, 240, 0.14, 6, false);
  disposables.push(barrierGeoLeft, barrierGeoRight);

  const leftBarrierMesh = new THREE.Mesh(barrierGeoLeft, barrierMatLeft);
  const rightBarrierMesh = new THREE.Mesh(barrierGeoRight, barrierMatRight);
  trackGroup.add(leftBarrierMesh, rightBarrierMesh);

  // 3. CYBERPUNK 3D SKYSCRAPERS & TOWERS
  const buildingsGroup = new THREE.Group();
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x080b15,
    roughness: 0.4,
    metalness: 0.8,
  });
  const windowMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.75,
  });
  disposables.push(buildingMat, windowMat);

  const numBuildings = 64;
  for (let b = 0; b < numBuildings; b++) {
    const t = b / numBuildings;
    const pt = trackSpline.getPointAt(t);
    const tangent = trackSpline.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const isLeft = b % 2 === 0;
    const sideSign = isLeft ? -1 : 1;
    const distFromRoad = roadHalfWidth + 16 + (b % 4) * 12;

    const bPos = new THREE.Vector3().copy(pt).addScaledVector(normal, sideSign * distFromRoad);

    const bWidth = 14 + (b % 5) * 6;
    const bHeight = 45 + (b % 7) * 18;
    const bDepth = 14 + (b % 3) * 8;

    const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    disposables.push(bGeo);
    const bMesh = new THREE.Mesh(bGeo, buildingMat);
    bMesh.position.set(bPos.x, pt.y + bHeight / 2 - 2, bPos.z);
    buildingsGroup.add(bMesh);

    // Glowing window stripes / accents
    const stripeGeo = new THREE.BoxGeometry(bWidth * 0.9, 0.8, bDepth * 0.9);
    disposables.push(stripeGeo);
    const stripeMesh = new THREE.Mesh(stripeGeo, windowMat);
    stripeMesh.position.set(bPos.x, pt.y + bHeight * 0.75, bPos.z);
    buildingsGroup.add(stripeMesh);
  }
  trackGroup.add(buildingsGroup);

  // 4. OVERHEAD SECTOR CHECKPOINT GANTRIES
  const checkpoints: Checkpoint3D[] = [];
  const gantryGeo = new THREE.BoxGeometry(ROAD_WIDTH_3D + 4, 1.2, 1.5);
  const pillarGeo = new THREE.BoxGeometry(1.2, 8, 1.5);
  const gantryMat = new THREE.MeshStandardMaterial({
    color: 0x11162b,
    metalness: 0.8,
    roughness: 0.2,
  });
  const gantrySignMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  });
  disposables.push(gantryGeo, pillarGeo, gantryMat, gantrySignMat);

  const checkpointDistances = [900, 1800, 2700, 3550];
  checkpointDistances.forEach((dist, idx) => {
    const t = dist / TRACK_TOTAL_LENGTH;
    const pt = trackSpline.getPointAt(t);
    const tangent = trackSpline.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    const gantryGroup = new THREE.Group();
    gantryGroup.position.copy(pt);

    // Orient gantry along road direction
    const rotMatrix = new THREE.Matrix4().lookAt(pt, new THREE.Vector3().copy(pt).add(tangent), up);
    gantryGroup.quaternion.setFromRotationMatrix(rotMatrix);

    // Beam
    const beam = new THREE.Mesh(gantryGeo, gantryMat);
    beam.position.y = 5.5;
    gantryGroup.add(beam);

    // Signboard
    const sign = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH_3D * 0.6, 0.9, 0.2), gantrySignMat);
    sign.position.set(0, 5.5, -0.8);
    gantryGroup.add(sign);

    // Pillars
    const leftPillar = new THREE.Mesh(pillarGeo, gantryMat);
    leftPillar.position.set(-roadHalfWidth - 1.5, 4, 0);
    const rightPillar = new THREE.Mesh(pillarGeo, gantryMat);
    rightPillar.position.set(roadHalfWidth + 1.5, 4, 0);
    gantryGroup.add(leftPillar, rightPillar);

    trackGroup.add(gantryGroup);
    checkpoints.push({
      sector: idx + 1,
      distance: dist,
      gantryMesh: gantryGroup,
      cleared: false,
    });
  });

  // 5. COLLECTIBLE 3D ENERGY CELLS (Rotating Diamonds)
  const energyCells: EnergyCell3D[] = [];
  const cellGeo = new THREE.OctahedronGeometry(0.7, 0);
  const cellMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: false,
  });
  disposables.push(cellGeo, cellMat);

  for (let c = 0; c < 14; c++) {
    const dist = 240 + c * 240;
    const laneX = ((c % 3) - 1) * 4.5; // -4.5, 0, 4.5
    const t = dist / TRACK_TOTAL_LENGTH;
    const pt = trackSpline.getPointAt(t);
    const tangent = trackSpline.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const cellPos = new THREE.Vector3().copy(pt).addScaledVector(normal, laneX).add(new THREE.Vector3(0, 1.4, 0));
    const cellMesh = new THREE.Mesh(cellGeo, cellMat);
    cellMesh.position.copy(cellPos);
    trackGroup.add(cellMesh);

    energyCells.push({
      mesh: cellMesh,
      distance: dist,
      laneX,
      collected: false,
    });
  }

  // 6. 3D TRAFFIC HOVER-DRONES
  const trafficDrones: TrafficDrone3D[] = [];
  const droneGeo = new THREE.BoxGeometry(1.8, 0.45, 3.2);
  const droneMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b,
    metalness: 0.9,
    roughness: 0.2,
  });
  const droneGlowMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
  disposables.push(droneGeo, droneMat, droneGlowMat);

  const numDrones = 16;
  const laneOffsets = [-4.5, -1.8, 1.8, 4.5];
  for (let d = 0; d < numDrones; d++) {
    const dist = 350 + d * 190;
    const laneX = laneOffsets[d % laneOffsets.length];

    const droneGroup = new THREE.Group();
    const body = new THREE.Mesh(droneGeo, droneMat);
    body.position.y = 0.4;
    droneGroup.add(body);

    // Glowing tail light
    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.1), droneGlowMat);
    tailLight.position.set(0, 0.4, -1.65);
    droneGroup.add(tailLight);

    trackGroup.add(droneGroup);
    trafficDrones.push({
      mesh: droneGroup,
      distance: dist,
      laneX,
      speed: 35 + (d % 3) * 12, // km/h
    });
  }

  // Helper to query transform at any track distance
  const getTrackTransform = (distance: number) => {
    const wrappedDist = ((distance % TRACK_TOTAL_LENGTH) + TRACK_TOTAL_LENGTH) % TRACK_TOTAL_LENGTH;
    const t = wrappedDist / TRACK_TOTAL_LENGTH;
    const position = trackSpline.getPointAt(t);
    const tangent = trackSpline.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    // Curvature estimation
    const tNext = ((wrappedDist + 15) % TRACK_TOTAL_LENGTH) / TRACK_TOTAL_LENGTH;
    const tangentNext = trackSpline.getTangentAt(tNext).normalize();
    const curvature = tangent.x - tangentNext.x;

    return { position, tangent, normal, binormal, curvature };
  };

  // Update loop for animations & traffic
  const update = (timeSec: number, _playerDistance: number) => {
    // Rotate energy cells
    energyCells.forEach((cell) => {
      if (!cell.collected) {
        cell.mesh.rotation.y = timeSec * 2.8;
        cell.mesh.rotation.x = timeSec * 1.4;
      } else {
        cell.mesh.visible = false;
      }
    });

    // Advance traffic drones
    trafficDrones.forEach((drone) => {
      drone.distance = (drone.distance + drone.speed * 0.04) % TRACK_TOTAL_LENGTH;
      const t = drone.distance / TRACK_TOTAL_LENGTH;
      const pt = trackSpline.getPointAt(t);
      const tangent = trackSpline.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      drone.mesh.position.copy(pt).addScaledVector(normal, drone.laneX).add(new THREE.Vector3(0, 0.35, 0));
      const rotMat = new THREE.Matrix4().lookAt(drone.mesh.position, new THREE.Vector3().copy(drone.mesh.position).add(tangent), up);
      drone.mesh.quaternion.setFromRotationMatrix(rotMat);
    });
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    trackGroup,
    roadMesh,
    trackLength: TRACK_TOTAL_LENGTH,
    roadHalfWidth,
    trafficDrones,
    energyCells,
    checkpoints,
    getTrackTransform,
    update,
    dispose,
  };
}
