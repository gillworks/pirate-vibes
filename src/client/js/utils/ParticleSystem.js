import * as THREE from "three";

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particleSystems = [];

    // Create particle materials
    this.materials = {
      smoke: new THREE.PointsMaterial({
        color: 0x888888,
        size: 2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
      fire: new THREE.PointsMaterial({
        color: 0xff5500,
        size: 1.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
      spark: new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
      splash: new THREE.PointsMaterial({
        color: 0x3399ff,
        size: 1.5,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
      wood: new THREE.PointsMaterial({
        color: 0x8b4513,
        size: 1.2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    };
  }

  createCannonFireEffect(position, direction) {
    // Create smoke particles
    const smokeCount = 50;
    const smokeGeometry = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeVelocities = [];

    for (let i = 0; i < smokeCount; i++) {
      const i3 = i * 3;

      // Initial position at cannon
      smokePositions[i3] = position.x;
      smokePositions[i3 + 1] = position.y;
      smokePositions[i3 + 2] = position.z;

      // Random velocity in general direction of cannon
      const speed = 0.1 + Math.random() * 0.2;
      const spread = 0.2;

      smokeVelocities.push(
        direction.x * speed + (Math.random() - 0.5) * spread,
        direction.y * speed + (Math.random() - 0.5) * spread + 0.05,
        direction.z * speed + (Math.random() - 0.5) * spread
      );
    }

    smokeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(smokePositions, 3)
    );

    // Create fire particles
    const fireCount = 30;
    const fireGeometry = new THREE.BufferGeometry();
    const firePositions = new Float32Array(fireCount * 3);
    const fireVelocities = [];

    for (let i = 0; i < fireCount; i++) {
      const i3 = i * 3;

      // Initial position at cannon
      firePositions[i3] = position.x;
      firePositions[i3 + 1] = position.y;
      firePositions[i3 + 2] = position.z;

      // Random velocity in general direction of cannon
      const speed = 0.15 + Math.random() * 0.3;
      const spread = 0.1;

      fireVelocities.push(
        direction.x * speed + (Math.random() - 0.5) * spread,
        direction.y * speed + (Math.random() - 0.5) * spread,
        direction.z * speed + (Math.random() - 0.5) * spread
      );
    }

    fireGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(firePositions, 3)
    );

    // Create spark particles
    const sparkCount = 20;
    const sparkGeometry = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      const i3 = i * 3;

      // Initial position at cannon
      sparkPositions[i3] = position.x;
      sparkPositions[i3 + 1] = position.y;
      sparkPositions[i3 + 2] = position.z;

      // Random velocity in general direction of cannon
      const speed = 0.2 + Math.random() * 0.4;
      const spread = 0.15;

      sparkVelocities.push(
        direction.x * speed + (Math.random() - 0.5) * spread,
        direction.y * speed + (Math.random() - 0.5) * spread,
        direction.z * speed + (Math.random() - 0.5) * spread
      );
    }

    sparkGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(sparkPositions, 3)
    );

    // Create particle systems
    const smokeParticles = new THREE.Points(
      smokeGeometry,
      this.materials.smoke.clone()
    );
    const fireParticles = new THREE.Points(
      fireGeometry,
      this.materials.fire.clone()
    );
    const sparkParticles = new THREE.Points(
      sparkGeometry,
      this.materials.spark.clone()
    );

    // Add to scene
    this.scene.add(smokeParticles);
    this.scene.add(fireParticles);
    this.scene.add(sparkParticles);

    // Add to particle systems array
    this.particleSystems.push({
      particles: [smokeParticles, fireParticles, sparkParticles],
      velocities: [smokeVelocities, fireVelocities, sparkVelocities],
      age: 0,
      maxAge: 60, // Frames
      type: "cannonFire",
    });
  }

  createHitEffect(position) {
    // Create wood splinter particles
    const woodCount = 40;
    const woodGeometry = new THREE.BufferGeometry();
    const woodPositions = new Float32Array(woodCount * 3);
    const woodVelocities = [];

    for (let i = 0; i < woodCount; i++) {
      const i3 = i * 3;

      // Initial position at hit point
      woodPositions[i3] = position.x;
      woodPositions[i3 + 1] = position.y;
      woodPositions[i3 + 2] = position.z;

      // Random velocity in all directions
      const speed = 0.1 + Math.random() * 0.2;
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const x = Math.sqrt(1 - z * z) * Math.cos(angle);
      const y = Math.sqrt(1 - z * z) * Math.sin(angle);

      woodVelocities.push(x * speed, y * speed, z * speed);
    }

    woodGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(woodPositions, 3)
    );

    // Create fire particles
    const fireCount = 20;
    const fireGeometry = new THREE.BufferGeometry();
    const firePositions = new Float32Array(fireCount * 3);
    const fireVelocities = [];

    for (let i = 0; i < fireCount; i++) {
      const i3 = i * 3;

      // Initial position at hit point
      firePositions[i3] = position.x;
      firePositions[i3 + 1] = position.y;
      firePositions[i3 + 2] = position.z;

      // Random velocity in all directions
      const speed = 0.05 + Math.random() * 0.1;
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const x = Math.sqrt(1 - z * z) * Math.cos(angle);
      const y = Math.sqrt(1 - z * z) * Math.sin(angle);

      fireVelocities.push(x * speed, y * speed, z * speed);
    }

    fireGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(firePositions, 3)
    );

    // Create smoke particles
    const smokeCount = 30;
    const smokeGeometry = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeVelocities = [];

    for (let i = 0; i < smokeCount; i++) {
      const i3 = i * 3;

      // Initial position at hit point
      smokePositions[i3] = position.x;
      smokePositions[i3 + 1] = position.y;
      smokePositions[i3 + 2] = position.z;

      // Random velocity in all directions, but mostly upward
      const speed = 0.03 + Math.random() * 0.07;
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const x = Math.sqrt(1 - z * z) * Math.cos(angle);
      const y = Math.sqrt(1 - z * z) * Math.sin(angle);

      smokeVelocities.push(x * speed, y * speed + 0.02, z * speed);
    }

    smokeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(smokePositions, 3)
    );

    // Create particle systems
    const woodParticles = new THREE.Points(
      woodGeometry,
      this.materials.wood.clone()
    );
    const fireParticles = new THREE.Points(
      fireGeometry,
      this.materials.fire.clone()
    );
    const smokeParticles = new THREE.Points(
      smokeGeometry,
      this.materials.smoke.clone()
    );

    // Add to scene
    this.scene.add(woodParticles);
    this.scene.add(fireParticles);
    this.scene.add(smokeParticles);

    // Add to particle systems array
    this.particleSystems.push({
      particles: [woodParticles, fireParticles, smokeParticles],
      velocities: [woodVelocities, fireVelocities, smokeVelocities],
      age: 0,
      maxAge: 90, // Frames
      type: "hit",
    });
  }

  createCollisionEffect(position) {
    // Create wood splinter particles
    const woodCount = 60;
    const woodGeometry = new THREE.BufferGeometry();
    const woodPositions = new Float32Array(woodCount * 3);
    const woodVelocities = [];

    for (let i = 0; i < woodCount; i++) {
      const i3 = i * 3;

      // Initial position at collision point
      woodPositions[i3] = position.x;
      woodPositions[i3 + 1] = position.y;
      woodPositions[i3 + 2] = position.z;

      // Random velocity in all directions
      const speed = 0.15 + Math.random() * 0.25;
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const x = Math.sqrt(1 - z * z) * Math.cos(angle);
      const y = Math.sqrt(1 - z * z) * Math.sin(angle);

      woodVelocities.push(x * speed, y * speed, z * speed);
    }

    woodGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(woodPositions, 3)
    );

    // Create splash particles
    const splashCount = 50;
    const splashGeometry = new THREE.BufferGeometry();
    const splashPositions = new Float32Array(splashCount * 3);
    const splashVelocities = [];

    for (let i = 0; i < splashCount; i++) {
      const i3 = i * 3;

      // Initial position at water level
      splashPositions[i3] = position.x;
      splashPositions[i3 + 1] = 0; // Water level
      splashPositions[i3 + 2] = position.z;

      // Random velocity upward and outward
      const speed = 0.1 + Math.random() * 0.2;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);

      splashVelocities.push(
        x * speed,
        0.1 + Math.random() * 0.2, // Upward
        z * speed
      );
    }

    splashGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(splashPositions, 3)
    );

    // Create particle systems
    const woodParticles = new THREE.Points(
      woodGeometry,
      this.materials.wood.clone()
    );
    const splashParticles = new THREE.Points(
      splashGeometry,
      this.materials.splash.clone()
    );

    // Add to scene
    this.scene.add(woodParticles);
    this.scene.add(splashParticles);

    // Add to particle systems array
    this.particleSystems.push({
      particles: [woodParticles, splashParticles],
      velocities: [woodVelocities, splashVelocities],
      age: 0,
      maxAge: 90, // Frames
      type: "collision",
    });
  }

  createExplosionEffect(position) {
    // Create wood splinter particles
    const woodCount = 100;
    const woodGeometry = new THREE.BufferGeometry();
    const woodPositions = new Float32Array(woodCount * 3);
    const woodVelocities = [];

    for (let i = 0; i < woodCount; i++) {
      const i3 = i * 3;

      // Initial position at explosion point
      woodPositions[i3] = position.x;
      woodPositions[i3 + 1] = position.y;
      woodPositions[i3 + 2] = position.z;

      // Random velocity in all directions
      const speed = 0.2 + Math.random() * 0.4;
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const x = Math.sqrt(1 - z * z) * Math.cos(angle);
      const y = Math.sqrt(1 - z * z) * Math.sin(angle);

      woodVelocities.push(x * speed, y * speed, z * speed);
    }

    woodGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(woodPositions, 3)
    );

    // Create fire particles
    const fireCount = 80;
    const fireGeometry = new THREE.BufferGeometry();
    const firePositions = new Float32Array(fireCount * 3);
    const fireVelocities = [];

    for (let i = 0; i < fireCount; i++) {
      const i3 = i * 3;

      // Initial position at explosion point
      firePositions[i3] = position.x;
      firePositions[i3 + 1] = position.y;
      firePositions[i3 + 2] = position.z;

      // Random velocity in all directions
      const speed = 0.1 + Math.random() * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const x = Math.sqrt(1 - z * z) * Math.cos(angle);
      const y = Math.sqrt(1 - z * z) * Math.sin(angle);

      fireVelocities.push(x * speed, y * speed, z * speed);
    }

    fireGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(firePositions, 3)
    );

    // Create smoke particles
    const smokeCount = 120;
    const smokeGeometry = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeVelocities = [];

    for (let i = 0; i < smokeCount; i++) {
      const i3 = i * 3;

      // Initial position at explosion point
      smokePositions[i3] = position.x;
      smokePositions[i3 + 1] = position.y;
      smokePositions[i3 + 2] = position.z;

      // Random velocity in all directions, but mostly upward
      const speed = 0.05 + Math.random() * 0.15;
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const x = Math.sqrt(1 - z * z) * Math.cos(angle);
      const y = Math.sqrt(1 - z * z) * Math.sin(angle);

      smokeVelocities.push(x * speed, y * speed + 0.05, z * speed);
    }

    smokeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(smokePositions, 3)
    );

    // Create splash particles
    const splashCount = 60;
    const splashGeometry = new THREE.BufferGeometry();
    const splashPositions = new Float32Array(splashCount * 3);
    const splashVelocities = [];

    for (let i = 0; i < splashCount; i++) {
      const i3 = i * 3;

      // Initial position at water level
      splashPositions[i3] = position.x;
      splashPositions[i3 + 1] = 0; // Water level
      splashPositions[i3 + 2] = position.z;

      // Random velocity upward and outward
      const speed = 0.15 + Math.random() * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);

      splashVelocities.push(
        x * speed,
        0.2 + Math.random() * 0.3, // Upward
        z * speed
      );
    }

    splashGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(splashPositions, 3)
    );

    // Create particle systems
    const woodParticles = new THREE.Points(
      woodGeometry,
      this.materials.wood.clone()
    );
    const fireParticles = new THREE.Points(
      fireGeometry,
      this.materials.fire.clone()
    );
    const smokeParticles = new THREE.Points(
      smokeGeometry,
      this.materials.smoke.clone()
    );
    const splashParticles = new THREE.Points(
      splashGeometry,
      this.materials.splash.clone()
    );

    // Add to scene
    this.scene.add(woodParticles);
    this.scene.add(fireParticles);
    this.scene.add(smokeParticles);
    this.scene.add(splashParticles);

    // Add to particle systems array
    this.particleSystems.push({
      particles: [
        woodParticles,
        fireParticles,
        smokeParticles,
        splashParticles,
      ],
      velocities: [
        woodVelocities,
        fireVelocities,
        smokeVelocities,
        splashVelocities,
      ],
      age: 0,
      maxAge: 120, // Frames
      type: "explosion",
    });
  }

  update() {
    // Update all particle systems
    for (let i = this.particleSystems.length - 1; i >= 0; i--) {
      const system = this.particleSystems[i];

      // Increment age
      system.age++;

      // Remove if too old
      if (system.age >= system.maxAge) {
        // Remove particles from scene
        system.particles.forEach((particles) => {
          this.scene.remove(particles);
          particles.geometry.dispose();
          particles.material.dispose();
        });

        // Remove from array
        this.particleSystems.splice(i, 1);
        continue;
      }

      // Update particles
      for (let j = 0; j < system.particles.length; j++) {
        const particles = system.particles[j];
        const velocities = system.velocities[j];
        const positions = particles.geometry.attributes.position.array;

        // Apply gravity and update positions
        for (let k = 0; k < velocities.length / 3; k++) {
          const k3 = k * 3;

          // Apply gravity
          if (system.type === "cannonFire") {
            velocities[k3 + 1] -= 0.001; // Slight gravity
          } else {
            velocities[k3 + 1] -= 0.003; // Normal gravity
          }

          // Update position
          positions[k3] += velocities[k3];
          positions[k3 + 1] += velocities[k3 + 1];
          positions[k3 + 2] += velocities[k3 + 2];

          // Bounce off water
          if (positions[k3 + 1] < 0) {
            positions[k3 + 1] = 0;
            velocities[k3 + 1] = -velocities[k3 + 1] * 0.3; // Bounce with damping

            // Apply drag in x and z
            velocities[k3] *= 0.9;
            velocities[k3 + 2] *= 0.9;
          }
        }

        // Update opacity based on age
        const lifePercent = system.age / system.maxAge;
        particles.material.opacity = 1 - lifePercent;

        // Flag for update
        particles.geometry.attributes.position.needsUpdate = true;
      }
    }
  }
}
