import * as THREE from "three";
import { Ship } from "./Ship.js";

export class Player extends Ship {
  constructor(scene, model, type, customization, name) {
    super(scene, model, type, customization);

    this.name = name;

    // Create player name label
    this.createNameLabel();
  }

  createNameLabel() {
    // Create a canvas for the name label
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 64;

    // Draw background
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    context.strokeStyle = "#f0d080";
    context.lineWidth = 2;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Draw text
    context.font = "bold 24px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.fillText(this.name, canvas.width / 2, canvas.height / 2);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);

    // Create material
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(5, 1.25);

    // Create mesh
    this.nameLabel = new THREE.Mesh(geometry, material);
    this.nameLabel.position.set(0, 10, 0);
    this.nameLabel.rotation.x = -Math.PI / 2;

    // Add to ship
    this.add(this.nameLabel);
  }

  updatePosition(position, rotation) {
    // Smoothly interpolate to the new position and rotation
    this.targetPosition = new THREE.Vector3(position.x, position.y, position.z);
    this.targetRotation = new THREE.Euler(rotation.x, rotation.y, rotation.z);
  }

  update() {
    // If we have a target position, interpolate towards it
    if (this.targetPosition) {
      this.position.lerp(this.targetPosition, 0.1);
    }

    // If we have a target rotation, interpolate towards it
    if (this.targetRotation) {
      // Interpolate each component separately
      this.rotation.x += (this.targetRotation.x - this.rotation.x) * 0.1;
      this.rotation.y += (this.targetRotation.y - this.rotation.y) * 0.1;
      this.rotation.z += (this.targetRotation.z - this.rotation.z) * 0.1;
    }

    // Make the name label always face the camera
    if (this.nameLabel && window.camera) {
      this.nameLabel.lookAt(window.camera.position);
    }
  }

  remove() {
    // Remove from scene
    this.scene.remove(this);

    // Dispose of geometries and materials
    this.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
