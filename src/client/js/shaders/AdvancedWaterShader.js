/**
 * Advanced Water Shader using standard Three.js shaders
 */

import * as THREE from "three";

class AdvancedWaterShader {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.mainScene = scene;
    this.camera = camera;

    // Create render targets for reflections and refractions
    this.createRenderTargets();

    // Create the shader material
    this.createShaderMaterial();

    // Create the water plane
    this.createWaterPlane();
  }

  createRenderTargets() {
    // Create render target for reflections
    this.reflectionRT = new THREE.WebGLRenderTarget(
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        depthBuffer: true,
        stencilBuffer: false,
      }
    );

    // Create render target for refractions
    this.refractionRT = new THREE.WebGLRenderTarget(
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        depthBuffer: true,
        stencilBuffer: false,
      }
    );

    // Create mirror camera for reflections
    this.mirrorCamera = this.camera.clone();
  }

  createShaderMaterial() {
    // Set up uniforms
    this.uniforms = {
      time: { value: 0 },
      reflectionSampler: { value: this.reflectionRT.texture },
      refractionSampler: { value: this.refractionRT.texture },
      depthSampler: { value: this.refractionRT.depthTexture },
      camPos: { value: new THREE.Vector3() },
      sunDir: { value: new THREE.Vector3(0.5, 0.8, 0.2).normalize() },
      sunColor: { value: new THREE.Vector3(1.0, 0.9, 0.7) },
      waterColor: { value: new THREE.Vector3(0.0, 0.3, 0.5) },
      deepWaterColor: { value: new THREE.Vector3(0.0, 0.1, 0.2) },
      waveHeight: { value: 0.5 },
      waveFreq: { value: 0.1 },
      waveSpeed: { value: 1.0 },
      waveDir: { value: new THREE.Vector2(1.0, 0.0) },
      refraction: { value: 0.02 },
      near: { value: 0.1 },
      far: { value: 2000.0 },
    };

    // Create the shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      side: THREE.DoubleSide,
    });
  }

  getVertexShader() {
    return `
      uniform float time;
      uniform float waveHeight;
      uniform float waveFreq;
      uniform float waveSpeed;
      uniform vec2 waveDir;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec4 vProjectedCoord;
      varying vec3 vWorldPosition;
      varying vec3 vViewVector;
      
      // Wave function
      float generateWave(vec2 position, float time, float frequency, float speed, vec2 direction) {
        float phase = speed * time;
        float theta = dot(direction, position) * frequency + phase;
        return waveHeight * sin(theta);
      }
      
      void main() {
        vUv = uv;
        vPosition = position;
        
        // Generate waves
        vec3 newPosition = position;
        
        // Large waves
        newPosition.y += generateWave(position.xz, time, waveFreq, waveSpeed, waveDir) * 2.0;
        
        // Medium waves
        newPosition.y += generateWave(position.xz, time * 1.3, waveFreq * 2.0, waveSpeed * 0.8, 
                                     vec2(waveDir.y, -waveDir.x)) * 1.2;
        
        // Small waves
        newPosition.y += generateWave(position.xz, time * 2.0, waveFreq * 4.0, waveSpeed * 1.2, 
                                     vec2(-waveDir.x, -waveDir.y)) * 0.6;
        
        // Very small waves
        newPosition.y += generateWave(position.xz, time * 3.0, waveFreq * 8.0, waveSpeed * 1.5, 
                                     vec2(-waveDir.y, waveDir.x)) * 0.2;
        
        // Calculate normal
        vec3 tangent1 = vec3(1.0, 0.0, 0.0);
        vec3 tangent2 = vec3(0.0, 0.0, 1.0);
        
        vec3 nearby1 = newPosition + tangent1 * 0.01;
        nearby1.y = position.y + generateWave(nearby1.xz, time, waveFreq, waveSpeed, waveDir) * 2.0;
        
        vec3 nearby2 = newPosition + tangent2 * 0.01;
        nearby2.y = position.y + generateWave(nearby2.xz, time, waveFreq, waveSpeed, waveDir) * 2.0;
        
        vec3 tangent = normalize(nearby1 - newPosition);
        vec3 bitangent = normalize(nearby2 - newPosition);
        vNormal = normalize(cross(tangent, bitangent));
        
        // Calculate world position
        vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
        
        // Calculate view vector
        vViewVector = cameraPosition - vWorldPosition;
        
        // Calculate projected coordinates for reflection/refraction
        vec4 projectedPosition = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        vProjectedCoord = projectedPosition;
        
        // Final position
        gl_Position = projectedPosition;
      }
    `;
  }

  getFragmentShader() {
    return `
      uniform float time;
      uniform vec3 waterColor;
      uniform vec3 deepWaterColor;
      uniform vec3 sunDir;
      uniform vec3 sunColor;
      uniform vec3 camPos;
      uniform float refraction;
      uniform float near;
      uniform float far;
      
      uniform sampler2D reflectionSampler;
      uniform sampler2D refractionSampler;
      uniform sampler2D depthSampler;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec4 vProjectedCoord;
      varying vec3 vWorldPosition;
      varying vec3 vViewVector;
      
      void main() {
        // Calculate screen coordinates
        vec2 screenCoord = (vProjectedCoord.xy / vProjectedCoord.w) * 0.5 + 0.5;
        
        // Calculate view direction
        vec3 viewDir = normalize(vViewVector);
        
        // Calculate reflection direction
        vec3 reflectDir = reflect(-viewDir, vNormal);
        
        // Calculate fresnel term
        float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 5.0);
        
        // Sample reflection and refraction
        vec2 reflectionCoord = vec2(1.0 - screenCoord.x, screenCoord.y);
        vec2 refractionCoord = screenCoord;
        
        // Add distortion based on normal
        reflectionCoord += vNormal.xz * 0.05;
        refractionCoord += vNormal.xz * refraction;
        
        // Sample textures
        vec3 reflection = texture2D(reflectionSampler, reflectionCoord).rgb;
        vec3 refraction = texture2D(refractionSampler, refractionCoord).rgb;
        
        // Calculate water depth
        float depth = texture2D(depthSampler, screenCoord).r;
        depth = (2.0 * near) / (far + near - depth * (far - near));
        float waterDepth = depth - length(vWorldPosition - camPos);
        waterDepth = clamp(waterDepth / 10.0, 0.0, 1.0);
        
        // Mix water colors based on depth
        vec3 waterColorMixed = mix(waterColor, deepWaterColor, waterDepth);
        
        // Add foam at wave peaks
        float foam = pow(max(0.0, vNormal.y), 5.0) * 0.8;
        foam += pow(max(0.0, sin(vPosition.x * 0.1 + time) * sin(vPosition.z * 0.1 + time * 0.8)), 2.0) * 0.5;
        foam = clamp(foam, 0.0, 1.0);
        
        // Calculate specular highlight
        float specular = pow(max(0.0, dot(reflectDir, sunDir)), 100.0) * 0.8;
        
        // Final color
        vec3 finalColor = mix(waterColorMixed, reflection, fresnel * 0.8);
        finalColor = mix(finalColor, refraction, (1.0 - fresnel) * 0.2);
        finalColor = mix(finalColor, vec3(1.0), foam);
        finalColor += specular * sunColor;
        
        gl_FragColor = vec4(finalColor, 0.9);
      }
    `;
  }

  createWaterPlane() {
    // Create a plane for the water
    const geometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
    this.waterMesh = new THREE.Mesh(geometry, this.material);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = 0;

    // Add to scene
    this.mainScene.add(this.waterMesh);
  }

  update(time) {
    // Update uniforms
    this.uniforms.time.value = time;
    this.uniforms.camPos.value.copy(this.camera.position);

    // Update render targets
    this.updateReflection();
    this.updateRefraction();
  }

  updateReflection() {
    // Set up mirror camera for reflection
    this.mirrorCamera.position.copy(this.camera.position);
    this.mirrorCamera.position.y *= -1;
    this.mirrorCamera.quaternion.copy(this.camera.quaternion);
    this.mirrorCamera.rotation.x *= -1;
    this.mirrorCamera.rotation.z *= -1;

    // Render reflection
    const currentRenderTarget = this.renderer.getRenderTarget();

    // Hide water mesh
    this.waterMesh.visible = false;

    // Render reflection
    this.renderer.setRenderTarget(this.reflectionRT);
    this.renderer.clear();
    this.renderer.render(this.mainScene, this.mirrorCamera);

    // Restore render target
    this.renderer.setRenderTarget(currentRenderTarget);
    this.waterMesh.visible = true;
  }

  updateRefraction() {
    // Render refraction
    const currentRenderTarget = this.renderer.getRenderTarget();

    // Hide water mesh
    this.waterMesh.visible = false;

    // Render refraction
    this.renderer.setRenderTarget(this.refractionRT);
    this.renderer.clear();
    this.renderer.render(this.mainScene, this.camera);

    // Restore render target
    this.renderer.setRenderTarget(currentRenderTarget);
    this.waterMesh.visible = true;
  }

  render() {
    // No need for separate rendering as the water mesh is part of the main scene
  }

  getWaterMesh() {
    return this.waterMesh;
  }

  resize(width, height) {
    // Update render targets
    this.reflectionRT.setSize(width * 0.5, height * 0.5);
    this.refractionRT.setSize(width * 0.5, height * 0.5);
  }
}

export { AdvancedWaterShader };
