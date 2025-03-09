/**
 * Custom Ocean Shader for Pirate Vibes
 * Inspired by various water rendering techniques
 */

import * as THREE from "three";

const OceanShader = {
  // Vertex shader for ocean waves
  vertexShader: `
    uniform float time;
    uniform float waveHeight;
    uniform float waveSpeed;
    uniform vec2 waveDirection;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    // Wave functions
    float generateWave(vec2 position, float time, float wavelength, float speed, vec2 direction) {
      float frequency = 2.0 * 3.14159 / wavelength;
      float phase = speed * frequency;
      float theta = dot(direction, position) * frequency + time * phase;
      return waveHeight * sin(theta);
    }
    
    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      
      // Generate multiple waves at different scales
      vec3 newPosition = position;
      
      // Large waves
      newPosition.y += generateWave(position.xz, time, 60.0, waveSpeed, waveDirection);
      
      // Medium waves
      newPosition.y += generateWave(position.xz, time * 1.3, 30.0, waveSpeed * 0.8, 
                                   vec2(waveDirection.y, -waveDirection.x)) * 0.6;
      
      // Small waves/ripples
      newPosition.y += generateWave(position.xz, time * 2.0, 15.0, waveSpeed * 1.2, 
                                   vec2(-waveDirection.x, -waveDirection.y)) * 0.3;
      
      // Very small ripples
      newPosition.y += generateWave(position.xz, time * 3.0, 5.0, waveSpeed * 1.5, 
                                   vec2(-waveDirection.y, waveDirection.x)) * 0.1;
      
      // Calculate new normal based on wave derivatives
      // This would be more accurate with actual derivatives, but this is a simplified approach
      vec3 nearbyX = newPosition + vec3(0.1, 0.0, 0.0);
      nearbyX.y = position.y + generateWave(nearbyX.xz, time, 60.0, waveSpeed, waveDirection);
      
      vec3 nearbyZ = newPosition + vec3(0.0, 0.0, 0.1);
      nearbyZ.y = position.y + generateWave(nearbyZ.xz, time, 60.0, waveSpeed, waveDirection);
      
      vec3 modifiedNormal = normalize(cross(nearbyZ - newPosition, nearbyX - newPosition));
      vNormal = modifiedNormal;
      
      // Set world position for reflections and depth calculations
      vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
      
      // Final position
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,

  // Fragment shader for ocean appearance
  fragmentShader: `
    uniform float time;
    uniform vec3 waterColor;
    uniform vec3 deepWaterColor;
    uniform vec3 foamColor;
    uniform samplerCube envMap;
    uniform sampler2D normalMap;
    uniform float normalScale;
    uniform float reflectivity;
    uniform float shininess;
    uniform vec3 sunDirection;
    uniform vec3 sunColor;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    void main() {
      // Calculate view direction
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      
      // Sample normal map and apply normal mapping
      vec2 uvTimeShift = vUv + vec2(-0.02, 0.03) * time * 0.05;
      vec3 normalFromMap = texture2D(normalMap, uvTimeShift * 5.0).rgb * 2.0 - 1.0;
      normalFromMap.xy *= normalScale;
      normalFromMap = normalize(normalFromMap);
      
      // Combine with vertex normal
      vec3 normal = normalize(vNormal + normalFromMap * 0.5);
      
      // Calculate fresnel term for water surface
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDirection)), 5.0);
      
      // Calculate reflection direction and sample environment map
      vec3 reflectionDir = reflect(-viewDirection, normal);
      vec3 reflection = textureCube(envMap, reflectionDir).rgb;
      
      // Calculate sun specular highlight
      float sunSpecular = pow(max(0.0, dot(reflectionDir, sunDirection)), shininess) * 0.5;
      
      // Calculate foam based on wave height and normal
      float foam = pow(max(0.0, normal.y), 10.0) * 0.5;
      foam += pow(max(0.0, sin(vPosition.x * 0.1 + time) * sin(vPosition.z * 0.1 + time * 0.8)), 4.0) * 0.2;
      
      // Calculate water depth (simplified)
      float depth = 1.0 - smoothstep(0.0, 5.0, -vPosition.y);
      
      // Mix water colors based on depth
      vec3 waterColorMixed = mix(deepWaterColor, waterColor, depth);
      
      // Final color combines reflection, water color, foam, and sun specular
      vec3 finalColor = mix(waterColorMixed, reflection, fresnel * reflectivity);
      finalColor = mix(finalColor, foamColor, foam);
      finalColor += sunColor * sunSpecular;
      
      gl_FragColor = vec4(finalColor, 0.9);
    }
  `,

  // Uniforms for the shader
  uniforms: {
    time: { value: 0 },
    waveHeight: { value: 1.0 },
    waveSpeed: { value: 1.0 },
    waveDirection: { value: new THREE.Vector2(1, 0) },
    waterColor: { value: new THREE.Color(0x0066cc) },
    deepWaterColor: { value: new THREE.Color(0x001e3f) },
    foamColor: { value: new THREE.Color(0xffffff) },
    envMap: { value: null },
    normalMap: { value: null },
    normalScale: { value: 0.5 },
    reflectivity: { value: 0.8 },
    shininess: { value: 100.0 },
    sunDirection: { value: new THREE.Vector3(0.5, 0.5, 0.0) },
    sunColor: { value: new THREE.Color(0xffffaa) },
  },
};

export { OceanShader };
