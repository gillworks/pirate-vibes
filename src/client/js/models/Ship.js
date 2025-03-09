import * as THREE from "three";

export class Ship extends THREE.Object3D {
  constructor(scene, model, type, customization) {
    super();

    this.scene = scene;
    this.type = type;
    this.customization = customization;

    // Ship properties based on type
    this.properties = {
      sloop: {
        speed: 1.2,
        turnSpeed: 1.5,
        health: 100,
        cannonDamage: 10,
        cannonCount: 6,
        size: { length: 15, width: 5, height: 10 },
      },
      brigantine: {
        speed: 1.0,
        turnSpeed: 1.2,
        health: 150,
        cannonDamage: 12,
        cannonCount: 8,
        size: { length: 20, width: 7, height: 12 },
      },
      frigate: {
        speed: 0.8,
        turnSpeed: 0.9,
        health: 200,
        cannonDamage: 15,
        cannonCount: 12,
        size: { length: 25, width: 8, height: 15 },
      },
      galleon: {
        speed: 0.6,
        turnSpeed: 0.7,
        health: 300,
        cannonDamage: 20,
        cannonCount: 16,
        size: { length: 30, width: 10, height: 18 },
      },
    };

    // Set ship stats based on type
    this.maxSpeed = this.properties[type].speed;
    this.turnSpeed = this.properties[type].turnSpeed;
    this.health = this.properties[type].health;
    this.maxHealth = this.properties[type].health;
    this.cannonDamage = this.properties[type].cannonDamage;
    this.cannonCount = this.properties[type].cannonCount;

    // Movement state
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.rotationVelocity = 0;
    this.rotationAcceleration = 0;
    this.sailsRaised = false;
    this.sailAngle = 0;
    this.boosting = false;

    // Create the ship model
    this.createShipModel(model);

    // Add to scene
    scene.add(this);
  }

  createShipModel(model) {
    // Clone the model
    this.model = model.scene.clone();

    // Apply customization
    this.applyCustomization();

    // Add model to this object
    this.add(this.model);

    // Create collision box
    const size = this.properties[this.type].size;
    const boxGeometry = new THREE.BoxGeometry(
      size.width,
      size.height,
      size.length
    );
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      visible: false, // Hide the collision box
    });
    this.collisionBox = new THREE.Mesh(boxGeometry, boxMaterial);
    this.add(this.collisionBox);

    // Create cannons
    this.createCannons();
  }

  applyCustomization() {
    // Apply ship color
    if (this.customization.color) {
      this.model.traverse((child) => {
        if (child.isMesh && child.material) {
          // Only apply to hull parts, not sails or other elements
          if (child.name.includes("hull") || child.name.includes("deck")) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.name.includes("wood") || mat.name.includes("hull")) {
                  mat.color.set(this.customization.color);
                }
              });
            } else {
              if (
                child.material.name.includes("wood") ||
                child.material.name.includes("hull")
              ) {
                child.material.color.set(this.customization.color);
              }
            }
          }
        }
      });
    }
  }

  createCannons() {
    // In a real implementation, we would create actual cannon models
    // For now, we'll just create placeholder objects for the cannon positions
    this.cannons = {
      left: [],
      right: [],
    };

    const cannonCount = this.properties[this.type].cannonCount;
    const halfCount = Math.floor(cannonCount / 2);
    const shipLength = this.properties[this.type].size.length;
    const shipWidth = this.properties[this.type].size.width;

    // Create left side cannons
    for (let i = 0; i < halfCount; i++) {
      const position = new THREE.Vector3(
        -shipWidth / 2 - 0.5,
        2,
        -shipLength / 3 + (i / halfCount) * (shipLength * 0.6)
      );

      this.cannons.left.push({
        position: position,
        direction: new THREE.Vector3(-1, 0, 0),
      });
    }

    // Create right side cannons
    for (let i = 0; i < halfCount; i++) {
      const position = new THREE.Vector3(
        shipWidth / 2 + 0.5,
        2,
        -shipLength / 3 + (i / halfCount) * (shipLength * 0.6)
      );

      this.cannons.right.push({
        position: position,
        direction: new THREE.Vector3(1, 0, 0),
      });
    }
  }

  update() {
    // Apply acceleration
    this.velocity.add(this.acceleration);

    // Apply drag
    this.velocity.multiplyScalar(0.95);

    // Apply rotation acceleration
    this.rotationVelocity += this.rotationAcceleration;

    // Apply rotation drag
    this.rotationVelocity *= 0.9;

    // Apply rotation
    this.rotation.y += this.rotationVelocity;

    // Apply velocity to position
    const movement = this.velocity.clone();
    movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    this.position.add(movement);

    // Reset acceleration
    this.acceleration.set(0, 0, 0);
    this.rotationAcceleration = 0;
  }

  moveForward(amount) {
    // Calculate forward acceleration based on sail state
    let accelerationAmount = amount;

    // Adjust for sail state
    if (this.sailsRaised) {
      accelerationAmount *= 0.3; // Reduced speed with raised sails
    }

    // Adjust for boost
    if (this.boosting) {
      accelerationAmount *= 1.5;
    }

    // Apply acceleration in the forward direction
    this.acceleration.z -= accelerationAmount * 0.01 * this.maxSpeed;
  }

  moveBackward(amount) {
    // Ships can't move backward as easily
    const accelerationAmount = amount * 0.3;

    // Apply acceleration in the backward direction
    this.acceleration.z += accelerationAmount * 0.01 * this.maxSpeed;
  }

  turnLeft(amount) {
    // Apply rotation acceleration
    this.rotationAcceleration -= amount * 0.001 * this.turnSpeed;
  }

  turnRight(amount) {
    // Apply rotation acceleration
    this.rotationAcceleration += amount * 0.001 * this.turnSpeed;
  }

  adjustSails(raised, angle) {
    this.sailsRaised = raised;
    this.sailAngle = angle;

    // In a real implementation, we would animate the sails here
  }

  startBoost() {
    this.boosting = true;
  }

  stopBoost() {
    this.boosting = false;
  }

  fireCannons(side) {
    // In a real implementation, we would create cannon fire effects and projectiles
    // For now, we'll just return the cannon positions and directions
    return this.cannons[side].map((cannon) => {
      const worldPosition = new THREE.Vector3();
      const worldDirection = new THREE.Vector3();

      // Convert local position to world position
      worldPosition.copy(cannon.position);
      this.localToWorld(worldPosition);

      // Convert local direction to world direction
      worldDirection.copy(cannon.direction);
      worldDirection.applyQuaternion(this.quaternion);

      return {
        position: worldPosition,
        direction: worldDirection,
      };
    });
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health;
  }

  repair(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health;
  }

  updateShipState(shipData) {
    // Update ship state based on server data
    if (shipData.sails) {
      this.adjustSails(shipData.sails.raised, shipData.sails.angle);
    }

    if (shipData.damage !== undefined) {
      this.health = this.maxHealth * (1 - shipData.damage / 100);
    }
  }
}
