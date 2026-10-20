import * as THREE from 'three';

interface Particle3D {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  type: 'smoke' | 'spark';
}

export interface CyberParticles3DInstance {
  group: THREE.Group;
  emitDriftParticles: (rearLeftPos: THREE.Vector3, rearRightPos: THREE.Vector3, driftAngle: number) => void;
  emitCrashSparks: (position: THREE.Vector3) => void;
  update: (dt: number) => void;
  dispose: () => void;
}

export function createCyberParticles3D(): CyberParticles3DInstance {
  const group = new THREE.Group();
  const maxParticles = 300;
  const particles: Particle3D[] = [];

  // Geometry & Buffer setup for Points
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const sizes = new Float32Array(maxParticles);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Canvas texture for circular particle glow
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, 'rgba(0, 240, 255, 0.7)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: 1.8,
    vertexColors: true,
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const pointsMesh = new THREE.Points(geometry, material);
  group.add(pointsMesh);

  const emitDriftParticles = (rearLeftPos: THREE.Vector3, rearRightPos: THREE.Vector3, driftAngle: number) => {
    const origin = Math.random() > 0.5 ? rearLeftPos : rearRightPos;

    // Emit Tire Smoke
    if (particles.length < maxParticles) {
      particles.push({
        position: new THREE.Vector3().copy(origin).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.4)),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2.5 + driftAngle * 4,
          0.8 + Math.random() * 0.8,
          (Math.random() - 0.5) * 2.5
        ),
        color: new THREE.Color(0xa855f7),
        size: 1.6 + Math.random() * 1.2,
        life: 0,
        maxLife: 0.65,
        type: 'smoke',
      });
    }

    // Emit Drift Spark
    if (particles.length < maxParticles) {
      particles.push({
        position: new THREE.Vector3().copy(origin),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 6 + driftAngle * 8,
          1.5 + Math.random() * 2.5,
          (Math.random() - 0.5) * 6
        ),
        color: new THREE.Color(Math.random() > 0.5 ? 0x00f0ff : 0xf43f5e),
        size: 0.8 + Math.random() * 0.6,
        life: 0,
        maxLife: 0.35,
        type: 'spark',
      });
    }
  };

  const emitCrashSparks = (position: THREE.Vector3) => {
    for (let i = 0; i < 18; i++) {
      if (particles.length >= maxParticles) break;
      particles.push({
        position: new THREE.Vector3().copy(position),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          2.5 + Math.random() * 8,
          (Math.random() - 0.5) * 14
        ),
        color: new THREE.Color(0xf43f5e),
        size: 1.2 + Math.random() * 0.8,
        life: 0,
        maxLife: 0.45,
        type: 'spark',
      });
    }
  };

  const update = (dt: number) => {
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = geometry.attributes.size as THREE.BufferAttribute;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);
      if (p.type === 'spark') {
        p.velocity.y -= 12 * dt; // Gravity
      }
    }

    // Populate buffers
    for (let i = 0; i < maxParticles; i++) {
      if (i < particles.length) {
        const p = particles[i];
        posAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);
        const alpha = 1 - p.life / p.maxLife;
        colAttr.setXYZ(i, p.color.r * alpha, p.color.g * alpha, p.color.b * alpha);
        sizeAttr.setX(i, p.size * (1 + p.life * 1.5));
      } else {
        posAttr.setXYZ(i, 0, -1000, 0); // Hide inactive
        sizeAttr.setX(i, 0);
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };

  return {
    group,
    emitDriftParticles,
    emitCrashSparks,
    update,
    dispose,
  };
}
