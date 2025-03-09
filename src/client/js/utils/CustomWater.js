/**
 * Custom Water implementation using our ocean shader
 */

import * as THREE from "three";
import { OceanShader } from "../shaders/OceanShader.js";

class CustomWater extends THREE.Mesh {
  constructor(geometry, options = {}) {
    console.log("CustomWater: Creating custom water with shader");

    // Create shader material with our custom shader
    const material = new THREE.ShaderMaterial({
      vertexShader: OceanShader.vertexShader,
      fragmentShader: OceanShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(OceanShader.uniforms),
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Call parent constructor with geometry and material
    super(geometry, material);

    console.log("CustomWater: Shader material created");

    // Apply options
    this.options = Object.assign(
      {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: null,
        sunDirection: new THREE.Vector3(0.5, 0.5, 0),
        sunColor: 0xffffff,
        waterColor: 0x0066cc,
        deepWaterColor: 0x001e3f,
        distortionScale: 3.7,
        fog: false,
        waveHeight: 1.0,
        waveSpeed: 1.0,
        reflectivity: 0.8,
      },
      options
    );

    console.log("CustomWater: Options applied", this.options);

    // Set up uniforms
    this.material.uniforms.waterColor.value = new THREE.Color(
      this.options.waterColor
    );
    this.material.uniforms.deepWaterColor.value = new THREE.Color(
      this.options.deepWaterColor
    );
    this.material.uniforms.sunDirection.value.copy(this.options.sunDirection);
    this.material.uniforms.sunColor.value = new THREE.Color(
      this.options.sunColor
    );
    this.material.uniforms.waveHeight.value = this.options.waveHeight;
    this.material.uniforms.waveSpeed.value = this.options.waveSpeed;
    this.material.uniforms.reflectivity.value = this.options.reflectivity;

    // Set up normal map
    if (this.options.waterNormals) {
      this.material.uniforms.normalMap.value = this.options.waterNormals;
    } else {
      // Create a default normal map if none provided
      this.material.uniforms.normalMap.value = this.createDefaultNormalMap();
    }

    // Create environment map for reflections
    this.initializeEnvironmentMap();

    // Add fog if needed
    if (this.options.fog) {
      this.material.fog = true;
    }
  }

  // Create a default normal map
  createDefaultNormalMap() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");

    // Fill with neutral normal (pointing up)
    context.fillStyle = "#7f7f7f";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Create wave patterns
    for (let i = 0; i < 10; i++) {
      const amplitude = 20 + Math.random() * 20;
      const frequency = 0.01 + Math.random() * 0.02;
      const phase = Math.random() * Math.PI * 2;
      const direction = Math.random() * Math.PI * 2;
      const dx = Math.cos(direction);
      const dy = Math.sin(direction);

      context.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
      context.lineWidth = 1 + Math.random() * 3;

      for (let j = 0; j < canvas.height; j += 4) {
        context.beginPath();
        for (let i = 0; i < canvas.width; i++) {
          const x = i;
          const y =
            j + Math.sin((x * dx + j * dy) * frequency + phase) * amplitude;

          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
  }

  // Initialize environment map for reflections
  initializeEnvironmentMap() {
    // Create a cube camera for reflections
    this.envMapCamera = new THREE.CubeCamera(1, 10000, 512);
    this.envMapCamera.renderTarget.texture.generateMipmaps = true;
    this.envMapCamera.renderTarget.texture.minFilter =
      THREE.LinearMipmapLinearFilter;
    this.envMapCamera.renderTarget.texture.magFilter = THREE.LinearFilter;
    this.envMapCamera.renderTarget.texture.mapping =
      THREE.CubeReflectionMapping;

    // Set the environment map
    this.material.uniforms.envMap.value =
      this.envMapCamera.renderTarget.texture;

    // Log to confirm initialization
    console.log("CustomWater: Environment map initialized");
  }

  // Update the environment map
  updateEnvironmentMap(renderer, scene) {
    if (!this.envMapCamera) {
      console.warn("CustomWater: Environment map camera not initialized");
      return;
    }

    // Make water invisible to avoid it being in its own reflection
    this.visible = false;

    // Update the environment map
    this.envMapCamera.position.copy(this.position);
    this.envMapCamera.update(renderer, scene);

    // Make water visible again
    this.visible = true;

    // Log to confirm update
    console.log("CustomWater: Environment map updated");
  }

  // Update the water animation
  update(time) {
    if (this.material.uniforms.time) {
      this.material.uniforms.time.value = time;
    }
  }

  // Set wave height
  setWaveHeight(height) {
    if (this.material.uniforms.waveHeight) {
      this.material.uniforms.waveHeight.value = height;
    }
  }

  // Set wave speed
  setWaveSpeed(speed) {
    if (this.material.uniforms.waveSpeed) {
      this.material.uniforms.waveSpeed.value = speed;
    }
  }

  // Set wave direction
  setWaveDirection(direction) {
    if (this.material.uniforms.waveDirection) {
      this.material.uniforms.waveDirection.value.copy(direction);
    }
  }

  // Set sun direction
  setSunDirection(direction) {
    if (this.material.uniforms.sunDirection) {
      this.material.uniforms.sunDirection.value.copy(direction);
    }
  }
}

export { CustomWater };
