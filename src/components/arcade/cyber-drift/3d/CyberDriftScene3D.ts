import * as THREE from 'three';
import { Car3DInstance, createCar3D } from './CyberCar3D';
import { createCyberParticles3D, CyberParticles3DInstance } from './CyberParticles3D';
import { createCyberTrack3D, CyberTrack3DInstance, ROAD_WIDTH_3D } from './CyberTrack3D';

export interface CyberDriftScene3DInstance {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  track: CyberTrack3DInstance;
  particles: CyberParticles3DInstance;
  currentCar: Car3DInstance;
  switchCar: (variant: 'apex' | 'vortex' | 'phantom') => void;
  updateRacing: (
    dt: number,
    playerDistance: number,
    playerLaneX: number,
    speedKmh: number,
    steerAngle: number,
    driftAngle: number,
    isBraking: boolean,
    isAccelerating: boolean,
    isNitro: boolean,
    cameraShake: number
  ) => void;
  updateShowroom: (timeSec: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

export function initCyberDriftScene3D(container: HTMLDivElement): CyberDriftScene3DInstance {
  // 1. SCENE SETUP
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04050b);
  scene.fog = new THREE.FogExp2(0x04050b, 0.0038);

  // 2. CAMERA SETUP
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.2, 800);
  camera.position.set(0, 4, -8);

  // 3. RENDERER SETUP
  const renderer = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    antialias: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 4. LIGHTING
  const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.2);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x818cf8, 1.5);
  moonLight.position.set(40, 80, -40);
  scene.add(moonLight);

  // Cyber city sky dome glow / grid plane
  const gridHelper = new THREE.GridHelper(1000, 50, 0x00f0ff, 0x1e1b4b);
  gridHelper.position.y = -1;
  scene.add(gridHelper);

  // 5. 3D TRACK & PARTICLES
  const track = createCyberTrack3D();
  scene.add(track.trackGroup);

  const particles = createCyberParticles3D();
  scene.add(particles.group);

  // 6. 3D PLAYER CAR
  let currentVariant: 'apex' | 'vortex' | 'phantom' = 'apex';
  let currentCar = createCar3D(currentVariant);
  scene.add(currentCar.group);

  const switchCar = (variant: 'apex' | 'vortex' | 'phantom') => {
    if (variant === currentVariant) return;
    scene.remove(currentCar.group);
    currentCar.dispose();
    currentVariant = variant;
    currentCar = createCar3D(variant);
    scene.add(currentCar.group);
  };

  // Chase Camera smoothed values
  let smoothedCamPos = new THREE.Vector3(0, 4, -8);
  let smoothedLookAt = new THREE.Vector3(0, 1.5, 12);
  let wheelRot = 0;

  // Showroom update (Menu state)
  const updateShowroom = (timeSec: number) => {
    // Park car at showroom coordinates
    currentCar.group.position.set(0, 0.1, 0);
    currentCar.group.rotation.set(0, timeSec * 0.45, 0);
    currentCar.update(0, 0, false, false, false, 0);

    // Orbit camera around car
    const radius = 7.5;
    camera.position.set(Math.cos(timeSec * 0.25) * radius, 2.8, Math.sin(timeSec * 0.25) * radius);
    camera.lookAt(0, 0.9, 0);

    renderer.render(scene, camera);
  };

  // Racing update loop
  const updateRacing = (
    dt: number,
    playerDistance: number,
    playerLaneX: number, // -1 to 1 normalized
    speedKmh: number,
    steerAngle: number,
    driftAngle: number,
    isBraking: boolean,
    isAccelerating: boolean,
    isNitro: boolean,
    cameraShake: number
  ) => {
    // 1. Get 3D Track Transform at player's distance
    const trackT = track.getTrackTransform(playerDistance);
    const halfW = ROAD_WIDTH_3D / 2 - 1.6;
    const lateralOffset = playerLaneX * halfW;

    // Car world position: track center + lateral offset along normal
    const carWorldPos = new THREE.Vector3()
      .copy(trackT.position)
      .addScaledVector(trackT.normal, lateralOffset)
      .add(new THREE.Vector3(0, 0.05, 0));

    currentCar.group.position.copy(carWorldPos);

    // Car world orientation: forward along track tangent + drift angle
    const carHeading = new THREE.Vector3().copy(trackT.tangent);
    const rotMatrix = new THREE.Matrix4().lookAt(
      carWorldPos,
      new THREE.Vector3().copy(carWorldPos).add(carHeading),
      new THREE.Vector3(0, 1, 0)
    );
    currentCar.group.quaternion.setFromRotationMatrix(rotMatrix);
    // Apply drift angle rotation around local Y
    currentCar.group.rotateY(driftAngle);

    // Wheel rotation speed
    wheelRot += (speedKmh / 3.6) * dt * 3.5;
    currentCar.update(wheelRot, steerAngle, isBraking, isAccelerating, isNitro, driftAngle);

    // 2. Emit 3D Particles during Drift
    if (Math.abs(driftAngle) > 0.08 && speedKmh > 40) {
      const rearLeft = new THREE.Vector3(-1.15, 0.4, -1.35).applyMatrix4(currentCar.group.matrixWorld);
      const rearRight = new THREE.Vector3(1.15, 0.4, -1.35).applyMatrix4(currentCar.group.matrixWorld);
      particles.emitDriftParticles(rearLeft, rearRight, driftAngle);
    }

    if (cameraShake > 12) {
      particles.emitCrashSparks(carWorldPos);
    }

    particles.update(dt);
    track.update(performance.now() / 1000, playerDistance);

    // 3. SMOOTH CHASE CAMERA
    // Target camera position: behind the car, slightly elevated
    const camDistance = 8.5;
    const camHeight = 3.6;

    const targetCamPos = new THREE.Vector3()
      .copy(carWorldPos)
      .addScaledVector(carHeading, -camDistance)
      .add(new THREE.Vector3(0, camHeight, 0));

    // Target look at: ahead of the car along track
    const targetLookAt = new THREE.Vector3()
      .copy(carWorldPos)
      .addScaledVector(carHeading, 16)
      .add(new THREE.Vector3(0, 1.2, 0));

    // Smooth lerp (avoids jitter)
    const lerpFactor = Math.min(1.0, 12 * dt);
    smoothedCamPos.lerp(targetCamPos, lerpFactor);
    smoothedLookAt.lerp(targetLookAt, lerpFactor);

    // Camera Shake
    if (cameraShake > 0) {
      const shakeMag = (cameraShake / 20) * 0.45;
      smoothedCamPos.x += (Math.random() - 0.5) * shakeMag;
      smoothedCamPos.y += (Math.random() - 0.5) * shakeMag;
    }

    camera.position.copy(smoothedCamPos);
    camera.lookAt(smoothedLookAt);

    // Dynamic FOV for speed & Nitro punch
    const targetFOV = isNitro ? 74 : 60 + (speedKmh / 260) * 8;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.12);
    camera.updateProjectionMatrix();

    // Render WebGL frame
    renderer.render(scene, camera);
  };

  const resize = (width: number, height: number) => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  const dispose = () => {
    track.dispose();
    particles.dispose();
    currentCar.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };

  return {
    renderer,
    scene,
    camera,
    track,
    particles,
    currentCar,
    switchCar,
    updateRacing,
    updateShowroom,
    resize,
    dispose,
  };
}
