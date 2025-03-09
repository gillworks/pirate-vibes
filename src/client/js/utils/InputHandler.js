import * as THREE from "three";

export class InputHandler {
  constructor(ship, camera, socket) {
    this.ship = ship;
    this.camera = camera;
    this.socket = socket;

    // Input state
    this.keys = {};
    this.mousePosition = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    // Last sent position/rotation
    this.lastSentPosition = new THREE.Vector3();
    this.lastSentRotation = new THREE.Euler();

    // Set up event listeners
    this.setupEventListeners();

    // Start update loop
    this.update();
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener("keydown", (event) => this.onKeyDown(event));
    window.addEventListener("keyup", (event) => this.onKeyUp(event));

    // Mouse events
    window.addEventListener("mousemove", (event) => this.onMouseMove(event));
    window.addEventListener("mousedown", (event) => this.onMouseDown(event));
    window.addEventListener("mouseup", (event) => this.onMouseUp(event));

    // Touch events for mobile
    window.addEventListener("touchstart", (event) => this.onTouchStart(event));
    window.addEventListener("touchmove", (event) => this.onTouchMove(event));
    window.addEventListener("touchend", (event) => this.onTouchEnd(event));

    // Prevent context menu on right click
    window.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  onKeyDown(event) {
    this.keys[event.key.toLowerCase()] = true;

    // Handle special key presses
    switch (event.key.toLowerCase()) {
      case " ": // Space - Fire cannons
        this.fireCannons();
        break;
      case "shift": // Shift - Start boost
        this.ship.startBoost();
        this.socket.emit("shipAction", {
          action: "ram",
          position: this.ship.position,
          direction: this.ship.rotation.y,
        });
        break;
      case "q": // Q - Raise sails
        this.ship.adjustSails(true, this.ship.sailAngle);
        this.socket.emit("shipAction", {
          action: "adjustSails",
          raised: true,
          angle: this.ship.sailAngle,
        });
        break;
      case "e": // E - Lower sails
        this.ship.adjustSails(false, this.ship.sailAngle);
        this.socket.emit("shipAction", {
          action: "adjustSails",
          raised: false,
          angle: this.ship.sailAngle,
        });
        break;
      case "tab": // Tab - Show player list
        event.preventDefault();
        document.getElementById("player-list").classList.toggle("hidden");
        break;
      case "m": // M - Toggle map
        document
          .getElementById("mini-map-container")
          .classList.toggle("hidden");
        break;
      case "escape": // Escape - Show controls
        document.getElementById("controls-panel").classList.toggle("hidden");
        break;
    }
  }

  onKeyUp(event) {
    this.keys[event.key.toLowerCase()] = false;

    // Handle special key releases
    switch (event.key.toLowerCase()) {
      case "shift": // Shift - Stop boost
        this.ship.stopBoost();
        break;
    }
  }

  onMouseMove(event) {
    // Calculate normalized device coordinates
    this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onMouseDown(event) {
    // Handle mouse buttons
    switch (event.button) {
      case 0: // Left click - Fire left cannons
        this.fireCannons("left");
        break;
      case 2: // Right click - Fire right cannons
        this.fireCannons("right");
        break;
    }
  }

  onMouseUp(event) {
    // Handle mouse button releases if needed
  }

  onTouchStart(event) {
    // Handle touch events for mobile
    if (event.touches.length === 1) {
      // Single touch - move forward
      this.keys["w"] = true;
    } else if (event.touches.length === 2) {
      // Double touch - fire cannons
      this.fireCannons();
    }
  }

  onTouchMove(event) {
    // Handle touch movement for steering
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const centerX = window.innerWidth / 2;

      if (touch.clientX < centerX - 50) {
        // Turn left
        this.keys["a"] = true;
        this.keys["d"] = false;
      } else if (touch.clientX > centerX + 50) {
        // Turn right
        this.keys["a"] = false;
        this.keys["d"] = true;
      } else {
        // Center - no turning
        this.keys["a"] = false;
        this.keys["d"] = false;
      }
    }
  }

  onTouchEnd(event) {
    // Reset keys when touch ends
    this.keys["w"] = false;
    this.keys["a"] = false;
    this.keys["d"] = false;
  }

  fireCannons(side = "both") {
    // Fire cannons based on side
    let cannonData = [];

    if (side === "left" || side === "both") {
      cannonData = cannonData.concat(this.ship.fireCannons("left"));
    }

    if (side === "right" || side === "both") {
      cannonData = cannonData.concat(this.ship.fireCannons("right"));
    }

    // Send cannon fire event to server
    cannonData.forEach((cannon) => {
      this.socket.emit("shipAction", {
        action: "fireCannon",
        position: cannon.position,
        direction: Math.atan2(cannon.direction.z, cannon.direction.x),
        distance: 0, // Will be calculated on server
      });
    });
  }

  update() {
    // Handle continuous key presses
    if (this.keys["w"]) {
      this.ship.moveForward(1);
    }

    if (this.keys["s"]) {
      this.ship.moveBackward(1);
    }

    if (this.keys["a"]) {
      this.ship.turnLeft(1);
    }

    if (this.keys["d"]) {
      this.ship.turnRight(1);
    }

    // Send position updates to server if moved significantly
    const positionChanged =
      this.ship.position.distanceTo(this.lastSentPosition) > 0.5;
    const rotationChanged =
      Math.abs(this.ship.rotation.y - this.lastSentRotation.y) > 0.05;

    if (positionChanged || rotationChanged) {
      this.socket.emit("updatePosition", {
        position: {
          x: this.ship.position.x,
          y: this.ship.position.y,
          z: this.ship.position.z,
        },
        rotation: {
          x: this.ship.rotation.x,
          y: this.ship.rotation.y,
          z: this.ship.rotation.z,
        },
      });

      // Update last sent values
      this.lastSentPosition.copy(this.ship.position);
      this.lastSentRotation.copy(this.ship.rotation);
    }

    // Continue update loop
    requestAnimationFrame(() => this.update());
  }
}
