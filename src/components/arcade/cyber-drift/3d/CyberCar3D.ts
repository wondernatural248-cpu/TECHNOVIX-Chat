import * as THREE from 'three';

export interface Car3DInstance {
  group: THREE.Group;
  wheels: {
    frontLeft: THREE.Group;
    frontRight: THREE.Group;
    rearLeft: THREE.Group;
    rearRight: THREE.Group;
  };
  headlights: {
    leftMesh: THREE.Mesh;
    rightMesh: THREE.Mesh;
    spotlight: THREE.SpotLight;
  };
  taillights: {
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
  };
  underglow: {
    mesh: THREE.Mesh;
    light: THREE.PointLight;
  };
  exhausts: {
    leftFlame: THREE.Mesh;
    rightFlame: THREE.Mesh;
  };
  update: (
    wheelRotation: number,
    steerAngle: number,
    isBraking: boolean,
    isAccelerating: boolean,
    isNitro: boolean,
    driftAngle: number
  ) => void;
  dispose: () => void;
}

export function createCar3D(variant: 'apex' | 'vortex' | 'phantom'): Car3DInstance {
  const group = new THREE.Group();
  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // Theme colors per variant
  let primaryColor = 0x00f0ff;
  let accentColor = 0x8b5cf6;
  let underglowColor = 0x00f0ff;

  if (variant === 'vortex') {
    primaryColor = 0xa855f7;
    accentColor = 0xec4899;
    underglowColor = 0xa855f7;
  } else if (variant === 'phantom') {
    primaryColor = 0x2563eb;
    accentColor = 0x00f0ff;
    underglowColor = 0x3b82f6;
  }

  // 1. CAR BODY (Main Chassis)
  const bodyGeo = new THREE.BoxGeometry(2.1, 0.55, 4.4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0a0d17,
    roughness: 0.25,
    metalness: 0.85,
  });
  disposables.push(bodyGeo, bodyMat);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 0.55;
  group.add(bodyMesh);

  // 2. COCKPIT CANOPY / ROOF
  const roofGeo = new THREE.BoxGeometry(1.6, 0.45, 2.2);
  const roofMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.15,
    metalness: 0.9,
    emissive: primaryColor,
    emissiveIntensity: 0.15,
  });
  disposables.push(roofGeo, roofMat);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.set(0, 0.95, -0.2);
  group.add(roofMesh);

  // Windshield Glass (Front & Rear)
  const glassGeo = new THREE.BoxGeometry(1.5, 0.4, 2.0);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x05070e,
    roughness: 0.05,
    metalness: 0.95,
  });
  disposables.push(glassGeo, glassMat);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(0, 0.97, -0.2);
  group.add(glassMesh);

  // 3. FRONT HOOD & NOSE CONE
  const hoodGeo = new THREE.BoxGeometry(1.9, 0.25, 1.4);
  const hoodMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.2,
    metalness: 0.8,
  });
  disposables.push(hoodGeo, hoodMat);
  const hoodMesh = new THREE.Mesh(hoodGeo, hoodMat);
  hoodMesh.position.set(0, 0.65, 1.5);
  hoodMesh.rotation.x = 0.08;
  group.add(hoodMesh);

  // Front Splitter
  const splitterGeo = new THREE.BoxGeometry(2.2, 0.08, 0.6);
  const splitterMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.4,
    metalness: 0.8,
    emissive: accentColor,
    emissiveIntensity: 0.4,
  });
  disposables.push(splitterGeo, splitterMat);
  const splitterMesh = new THREE.Mesh(splitterGeo, splitterMat);
  splitterMesh.position.set(0, 0.28, 2.15);
  group.add(splitterMesh);

  // 4. REAR SPOILER / GT WING
  const wingWidth = variant === 'vortex' ? 2.6 : 2.2;
  const wingGeo = new THREE.BoxGeometry(wingWidth, 0.08, 0.45);
  const wingMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.3,
    metalness: 0.9,
    emissive: accentColor,
    emissiveIntensity: 0.5,
  });
  disposables.push(wingGeo, wingMat);
  const wingMesh = new THREE.Mesh(wingGeo, wingMat);
  wingMesh.position.set(0, 1.25, -2.0);
  group.add(wingMesh);

  // Wing Struts
  const strutGeo = new THREE.BoxGeometry(0.08, 0.4, 0.1);
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
  disposables.push(strutGeo, strutMat);
  const leftStrut = new THREE.Mesh(strutGeo, strutMat);
  leftStrut.position.set(-0.65, 0.95, -2.0);
  const rightStrut = new THREE.Mesh(strutGeo, strutMat);
  rightStrut.position.set(0.65, 0.95, -2.0);
  group.add(leftStrut, rightStrut);

  // 5. 3D WHEELS (Tires + Neon Rims)
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0f111a,
    roughness: 0.85,
    metalness: 0.1,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.2,
    metalness: 0.9,
    emissive: primaryColor,
    emissiveIntensity: 0.4,
  });
  disposables.push(wheelGeo, tireMat, rimMat);

  const createWheelAssembly = () => {
    const wheelGroup = new THREE.Group();
    const tireMesh = new THREE.Mesh(wheelGeo, tireMat);
    wheelGroup.add(tireMesh);

    // Rim inner cap
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.33, 8);
    rimGeo.rotateZ(Math.PI / 2);
    disposables.push(rimGeo);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rimMesh);

    return wheelGroup;
  };

  const frontLeftWheelGroup = new THREE.Group();
  const frontRightWheelGroup = new THREE.Group();
  const frontLeftWheel = createWheelAssembly();
  const frontRightWheel = createWheelAssembly();
  frontLeftWheelGroup.add(frontLeftWheel);
  frontRightWheelGroup.add(frontRightWheel);

  const rearLeftWheel = createWheelAssembly();
  const rearRightWheel = createWheelAssembly();

  frontLeftWheelGroup.position.set(-1.15, 0.4, 1.35);
  frontRightWheelGroup.position.set(1.15, 0.4, 1.35);
  rearLeftWheel.position.set(-1.15, 0.4, -1.35);
  rearRightWheel.position.set(1.15, 0.4, -1.35);

  group.add(frontLeftWheelGroup, frontRightWheelGroup, rearLeftWheel, rearRightWheel);

  // 6. HEADLIGHTS
  const headLightGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
  const headLightMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.5,
  });
  disposables.push(headLightGeo, headLightMat);
  const leftHeadLight = new THREE.Mesh(headLightGeo, headLightMat);
  leftHeadLight.position.set(-0.7, 0.55, 2.2);
  const rightHeadLight = new THREE.Mesh(headLightGeo, headLightMat);
  rightHeadLight.position.set(0.7, 0.55, 2.2);
  group.add(leftHeadLight, rightHeadLight);

  // Real Spotlight projecting forward
  const spotlight = new THREE.SpotLight(0x00f0ff, 35, 60, Math.PI / 6, 0.4, 1);
  spotlight.position.set(0, 0.8, 2.2);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0, 15);
  group.add(spotlight);
  group.add(spotTarget);
  spotlight.target = spotTarget;

  // 7. TAILLIGHTS (Full-width neon light bar)
  const tailLightGeo = new THREE.BoxGeometry(1.8, 0.12, 0.08);
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xff0055,
    emissive: 0xff0055,
    emissiveIntensity: 1.0,
  });
  disposables.push(tailLightGeo, tailLightMat);
  const tailLightMesh = new THREE.Mesh(tailLightGeo, tailLightMat);
  tailLightMesh.position.set(0, 0.65, -2.2);
  group.add(tailLightMesh);

  // 8. NEON UNDERGLOW LIGHTING
  const underglowLight = new THREE.PointLight(underglowColor, 8, 4.5);
  underglowLight.position.set(0, 0.1, 0);
  group.add(underglowLight);

  // Underglow ground plane glow
  const underglowPlaneGeo = new THREE.PlaneGeometry(2.4, 4.2);
  underglowPlaneGeo.rotateX(-Math.PI / 2);
  const underglowPlaneMat = new THREE.MeshBasicMaterial({
    color: underglowColor,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(underglowPlaneGeo, underglowPlaneMat);
  const underglowMesh = new THREE.Mesh(underglowPlaneGeo, underglowPlaneMat);
  underglowMesh.position.set(0, 0.04, 0);
  group.add(underglowMesh);

  // 9. EXHAUST PIPES & NITRO FLAME JETS
  const flameGeo = new THREE.ConeGeometry(0.12, 0.8, 8);
  flameGeo.rotateX(Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(flameGeo, flameMat);
  const leftFlame = new THREE.Mesh(flameGeo, flameMat);
  leftFlame.position.set(-0.45, 0.4, -2.6);
  leftFlame.scale.set(0, 0, 0);

  const rightFlame = new THREE.Mesh(flameGeo, flameMat);
  rightFlame.position.set(0.45, 0.4, -2.6);
  rightFlame.scale.set(0, 0, 0);

  group.add(leftFlame, rightFlame);

  // Update loop logic
  const update = (
    wheelRotation: number,
    steerAngle: number,
    isBraking: boolean,
    isAccelerating: boolean,
    isNitro: boolean,
    driftAngle: number
  ) => {
    // Steer front wheel assemblies
    frontLeftWheelGroup.rotation.y = steerAngle * 0.7;
    frontRightWheelGroup.rotation.y = steerAngle * 0.7;

    // Spin all wheels around their axis
    frontLeftWheel.rotation.x = wheelRotation;
    frontRightWheel.rotation.x = wheelRotation;
    rearLeftWheel.rotation.x = wheelRotation;
    rearRightWheel.rotation.x = wheelRotation;

    // Body roll during drift and steering
    bodyMesh.rotation.z = -driftAngle * 0.35 - steerAngle * 0.15;
    roofMesh.rotation.z = -driftAngle * 0.35 - steerAngle * 0.15;
    wingMesh.rotation.z = -driftAngle * 0.35 - steerAngle * 0.15;

    // Brake lights intensification
    tailLightMat.emissiveIntensity = isBraking ? 2.5 : 1.0;
    tailLightMat.color.setHex(isBraking ? 0xff0022 : 0xff0055);

    // Exhaust flames scale
    if (isNitro) {
      flameMat.color.setHex(0x00f0ff);
      const s = 1.3 + Math.random() * 0.4;
      leftFlame.scale.set(s, s, s * 1.6);
      rightFlame.scale.set(s, s, s * 1.6);
    } else if (isAccelerating) {
      flameMat.color.setHex(0xa855f7);
      const s = 0.5 + Math.random() * 0.3;
      leftFlame.scale.set(s, s, s * 0.8);
      rightFlame.scale.set(s, s, s * 0.8);
    } else {
      leftFlame.scale.set(0, 0, 0);
      rightFlame.scale.set(0, 0, 0);
    }
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    group,
    wheels: {
      frontLeft: frontLeftWheelGroup,
      frontRight: frontRightWheelGroup,
      rearLeft: rearLeftWheel,
      rearRight: rearRightWheel,
    },
    headlights: {
      leftMesh: leftHeadLight,
      rightMesh: rightHeadLight,
      spotlight,
    },
    taillights: {
      mesh: tailLightMesh,
      material: tailLightMat,
    },
    underglow: {
      mesh: underglowMesh,
      light: underglowLight,
    },
    exhausts: {
      leftFlame,
      rightFlame,
    },
    update,
    dispose,
  };
}
