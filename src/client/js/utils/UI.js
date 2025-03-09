export class UI {
  constructor() {
    // Cache DOM elements
    this.healthBar = document.getElementById("health-bar");
    this.cannonReady = document.getElementById("cannon-ready");
    this.miniMap = document.getElementById("mini-map");
    this.windDirection = document.getElementById("wind-direction-arrow");
    this.windStrength = document.getElementById("wind-strength");

    // Initialize UI
    this.updateHealthBar(100);
    this.updateCannonStatus(true);
    this.initializeMiniMap();
  }

  updateHealthBar(health) {
    // Update health bar width
    const healthPercent = Math.max(0, Math.min(100, health));
    this.healthBar.style.width = `${healthPercent}%`;

    // Update color based on health
    if (healthPercent > 60) {
      this.healthBar.style.background =
        "linear-gradient(to right, #30f080, #30a0f0)";
    } else if (healthPercent > 30) {
      this.healthBar.style.background =
        "linear-gradient(to right, #f0d080, #f0a030)";
    } else {
      this.healthBar.style.background =
        "linear-gradient(to right, #f03030, #a02020)";
    }
  }

  updateCannonStatus(isReady) {
    if (isReady) {
      this.cannonReady.textContent = "Ready";
      this.cannonReady.classList.remove("reloading");
    } else {
      this.cannonReady.textContent = "Reloading...";
      this.cannonReady.classList.add("reloading");
    }
  }

  initializeMiniMap() {
    // Create a canvas for the mini-map
    const canvas = document.createElement("canvas");
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");

    // Clear the mini-map container
    this.miniMap.innerHTML = "";

    // Add the canvas to the mini-map container
    this.miniMap.appendChild(canvas);

    // Store the canvas and context for later use
    this.miniMapCanvas = canvas;
    this.miniMapContext = ctx;

    // Draw initial mini-map
    this.updateMiniMap();
  }

  updateMiniMap(players = {}, playerPosition = { x: 0, z: 0 }) {
    const ctx = this.miniMapContext;
    const width = this.miniMapCanvas.width;
    const height = this.miniMapCanvas.height;

    // Clear the canvas
    ctx.fillStyle = "#103050";
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;

    // Draw horizontal grid lines
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Draw vertical grid lines
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Draw player position (center of the map)
    ctx.fillStyle = "#f0d080";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw direction indicator
    ctx.strokeStyle = "#f0d080";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.lineTo(width / 2, height / 2 - 10);
    ctx.stroke();

    // Draw other players
    for (const id in players) {
      const player = players[id];

      // Calculate relative position
      const relX = (player.position.x - playerPosition.x) / 20 + width / 2;
      const relZ = (player.position.z - playerPosition.z) / 20 + height / 2;

      // Only draw if within map bounds
      if (relX >= 0 && relX <= width && relZ >= 0 && relZ <= height) {
        // Draw player dot
        ctx.fillStyle = "#f03030";
        ctx.beginPath();
        ctx.arc(relX, relZ, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  showMessage(message, duration = 3000) {
    // Create message element
    const messageElement = document.createElement("div");
    messageElement.className = "game-message";
    messageElement.textContent = message;

    // Add to body
    document.body.appendChild(messageElement);

    // Animate in
    setTimeout(() => {
      messageElement.style.opacity = "1";
      messageElement.style.transform = "translateY(0)";
    }, 10);

    // Remove after duration
    setTimeout(() => {
      messageElement.style.opacity = "0";
      messageElement.style.transform = "translateY(-20px)";

      // Remove from DOM after animation
      setTimeout(() => {
        document.body.removeChild(messageElement);
      }, 500);
    }, duration);
  }
}
