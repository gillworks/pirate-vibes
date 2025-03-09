import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { io } from "socket.io-client";

import { Ship } from "./js/models/Ship.js";
import { Player } from "./js/models/Player.js";
import { InputHandler } from "./js/utils/InputHandler.js";
import { UI } from "./js/utils/UI.js";
import { SoundManager } from "./js/utils/SoundManager.js";
import { ParticleSystem } from "./js/utils/ParticleSystem.js";
import { CustomWater } from "./js/utils/CustomWater.js";

// Game state
let socket;
let scene, camera, renderer, controls;
let water, sky, sun;
let waterUniforms;
let playerShip;
let otherPlayers = {};
let inputHandler;
let ui;
let soundManager;
let particleSystem;
let gameStarted = false;
let playerId;
let playerData = {
  name: "",
  shipType: "sloop",
  customization: {
    color: "#8B4513",
  },
};
let worldState;

// Assets to load
const assetsToLoad = [
  { type: "model", name: "sloop", path: "assets/models/ships/sloop.glb" },
  {
    type: "model",
    name: "brigantine",
    path: "assets/models/ships/brigantine.glb",
  },
  { type: "model", name: "frigate", path: "assets/models/ships/frigate.glb" },
  { type: "model", name: "galleon", path: "assets/models/ships/galleon.glb" },
  { type: "model", name: "cannon", path: "assets/models/weapons/cannon.glb" },
  {
    type: "model",
    name: "cannonball",
    path: "assets/models/weapons/cannonball.glb",
  },
  { type: "texture", name: "water", path: "assets/textures/waternormals.jpg" },
  { type: "sound", name: "ambient", path: "assets/sounds/ocean_ambient.mp3" },
  { type: "sound", name: "cannon_fire", path: "assets/sounds/cannon_fire.mp3" },
  { type: "sound", name: "cannon_hit", path: "assets/sounds/cannon_hit.mp3" },
  {
    type: "sound",
    name: "ship_destroyed",
    path: "assets/sounds/ship_destroyed.mp3",
  },
  { type: "sound", name: "sail_adjust", path: "assets/sounds/sail_adjust.mp3" },
  { type: "image", name: "login_bg", path: "assets/login-bg.jpg" },
  { type: "image", name: "wind_arrow", path: "assets/wind-arrow.png" },
];

// Asset loading
const loadingManager = new THREE.LoadingManager();
const assets = {
  models: {},
  textures: {},
  sounds: {},
  images: {},
};

// Initialize the game
function init() {
  // Set up loading manager
  loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    document.getElementById("loading-bar").style.width = `${progress}%`;
    document.getElementById(
      "loading-text"
    ).textContent = `Loading: ${Math.round(progress)}%`;
  };

  loadingManager.onLoad = () => {
    document.getElementById("loading-text").textContent =
      'Press "Set Sail" to begin your adventure!';
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById("login-screen").style.display = "flex";
  };

  // Load assets
  loadAssets();

  // Set up event listeners for UI
  setupUIEventListeners();
}

// Load all game assets
function loadAssets() {
  const textureLoader = new THREE.TextureLoader(loadingManager);
  const gltfLoader = new GLTFLoader(loadingManager);
  const audioLoader = new THREE.AudioLoader(loadingManager);
  const imageLoader = new THREE.ImageLoader(loadingManager);

  // Create fallback assets
  createFallbackAssets();

  assetsToLoad.forEach((asset) => {
    switch (asset.type) {
      case "model":
        gltfLoader.load(
          asset.path,
          (gltf) => {
            assets.models[asset.name] = gltf;
          },
          undefined,
          (error) => {
            console.warn(`Error loading model ${asset.name}: ${error.message}`);
            // Use fallback model
            if (!assets.models[asset.name]) {
              assets.models[asset.name] = createFallbackModel(asset.name);
            }
          }
        );
        break;
      case "texture":
        textureLoader.load(
          asset.path,
          (texture) => {
            assets.textures[asset.name] = texture;
          },
          undefined,
          (error) => {
            console.warn(
              `Error loading texture ${asset.name}: ${error.message}`
            );
            // Use fallback texture
            if (!assets.textures[asset.name]) {
              assets.textures[asset.name] = createFallbackTexture();
            }
          }
        );
        break;
      case "sound":
        audioLoader.load(
          asset.path,
          (buffer) => {
            assets.sounds[asset.name] = buffer;
          },
          undefined,
          (error) => {
            console.warn(`Error loading sound ${asset.name}: ${error.message}`);
            // Use fallback sound
            if (!assets.sounds[asset.name]) {
              assets.sounds[asset.name] = createFallbackSound();
            }
          }
        );
        break;
      case "image":
        imageLoader.load(
          asset.path,
          (image) => {
            assets.images[asset.name] = image;
          },
          undefined,
          (error) => {
            console.warn(`Error loading image ${asset.name}: ${error.message}`);
            // Use fallback image
            if (!assets.images[asset.name]) {
              assets.images[asset.name] = createFallbackImage(asset.name);
            }
          }
        );
        break;
    }
  });
}

// Create fallback assets for testing
function createFallbackAssets() {
  // Create fallback water texture
  if (!assets.textures.water) {
    assets.textures.water = createFallbackTexture();
  }

  // Create fallback ship models
  const shipTypes = ["sloop", "brigantine", "frigate", "galleon"];
  shipTypes.forEach((type) => {
    if (!assets.models[type]) {
      assets.models[type] = createFallbackModel(type);
    }
  });

  // Create fallback weapon models
  if (!assets.models.cannon) {
    assets.models.cannon = createFallbackModel("cannon");
  }
  if (!assets.models.cannonball) {
    assets.models.cannonball = createFallbackModel("cannonball");
  }

  // Create fallback sounds
  const soundNames = [
    "ambient",
    "cannon_fire",
    "cannon_hit",
    "ship_destroyed",
    "sail_adjust",
  ];
  soundNames.forEach((name) => {
    if (!assets.sounds[name]) {
      assets.sounds[name] = createFallbackSound();
    }
  });

  // Create fallback images
  if (!assets.images.login_bg) {
    assets.images.login_bg = createFallbackImage("login_bg");
  }
  if (!assets.images.wind_arrow) {
    assets.images.wind_arrow = createFallbackImage("wind_arrow");
  }
}

// Create a fallback model
function createFallbackModel(type) {
  console.log(`Creating fallback model for ${type}`);

  let geometry;
  let material;
  let mesh;

  // Create different geometries based on ship type
  switch (type) {
    case "sloop":
      geometry = new THREE.BoxGeometry(5, 3, 15);
      material = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
      break;
    case "brigantine":
      geometry = new THREE.BoxGeometry(7, 4, 20);
      material = new THREE.MeshBasicMaterial({ color: 0xa0522d });
      break;
    case "frigate":
      geometry = new THREE.BoxGeometry(8, 5, 25);
      material = new THREE.MeshBasicMaterial({ color: 0xd2691e });
      break;
    case "galleon":
      geometry = new THREE.BoxGeometry(10, 6, 30);
      material = new THREE.MeshBasicMaterial({ color: 0xcd853f });
      break;
    case "cannon":
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
      material = new THREE.MeshBasicMaterial({ color: 0x333333 });
      break;
    case "cannonball":
      geometry = new THREE.SphereGeometry(0.5, 8, 8);
      material = new THREE.MeshBasicMaterial({ color: 0x111111 });
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
      material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  }

  mesh = new THREE.Mesh(geometry, material);

  // Create a scene to hold the mesh
  const scene = new THREE.Scene();
  scene.add(mesh);

  // Return an object that mimics a GLTF model
  return {
    scene: scene,
    animations: [],
  };
}

// Create a fallback texture
function createFallbackTexture() {
  console.log("Creating fallback texture");

  // Create a canvas
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  // For water normals, we need a specific pattern
  if (
    assetsToLoad.find(
      (asset) => asset.name === "water" && asset.type === "texture"
    )
  ) {
    // Create a realistic water normal map

    // Fill with neutral normal (pointing up)
    context.fillStyle = "#7f7f7f";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Create a more realistic ocean wave pattern
    const createOceanNormals = () => {
      // Create multiple layers of waves
      for (let layer = 0; layer < 3; layer++) {
        const scale = 1 + layer * 2; // Different scales for each layer
        const amplitude = 30 / (layer + 1); // Decreasing amplitude for higher frequencies

        // Create wave patterns in multiple directions
        for (let dir = 0; dir < 4; dir++) {
          const angle = (dir / 4) * Math.PI * 2 + (layer * Math.PI) / 6;
          const dx = Math.cos(angle);
          const dy = Math.sin(angle);

          // Draw wave pattern
          for (let y = 0; y < canvas.height; y += 4) {
            context.beginPath();

            for (let x = 0; x < canvas.width; x++) {
              // Create wave pattern
              const phase = layer * 7 + dir * 13;
              const frequency = 0.01 * scale;

              // Combine multiple sine waves for more natural look
              const waveHeight =
                Math.sin((x * dx + y * dy) * frequency + phase) * amplitude +
                Math.sin((x * dx + y * dy) * frequency * 2.1 + phase * 1.7) *
                  (amplitude * 0.5) +
                Math.sin((x * dx + y * dy) * frequency * 3.7 + phase * 2.3) *
                  (amplitude * 0.25);

              const posY = y + waveHeight;

              if (x === 0) {
                context.moveTo(x, posY);
              } else {
                context.lineTo(x, posY);
              }
            }

            // Use a semi-transparent stroke to blend waves
            context.strokeStyle = `rgba(255, 255, 255, ${
              0.05 + 0.05 / (layer + 1)
            })`;
            context.lineWidth = 1.5;
            context.stroke();
          }
        }
      }

      // Add noise for small details
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Add subtle noise to all channels
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.max(0, Math.min(255, data[i] + noise)); // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
        data[i + 2] = 127; // B - keep blue channel neutral for normal map
        // Don't modify alpha channel
      }

      context.putImageData(imageData, 0, 0);

      // Apply a slight blur for smoother normals
      context.filter = "blur(1px)";
      context.drawImage(canvas, 0, 0);
      context.filter = "none";
    };

    createOceanNormals();
  } else {
    // Draw a gradient for other textures
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, "#1a3c5a");
    gradient.addColorStop(1, "#0a1525");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);

    // Draw a grid
    context.strokeStyle = "#ffffff";
    context.lineWidth = 1;
    for (let i = 0; i < 256; i += 32) {
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(256, i);
      context.stroke();

      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, 256);
      context.stroke();
    }
  }

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

// Create a fallback sound
function createFallbackSound() {
  console.log("Creating fallback sound");

  // Create an empty audio buffer
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate * 1,
    audioContext.sampleRate
  );

  return buffer;
}

// Create a fallback image
function createFallbackImage(name) {
  console.log(`Creating fallback image for ${name}`);

  // Create a canvas
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  // Draw different patterns based on image name
  if (name === "login_bg") {
    // Draw a sea background
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#1a3c5a");
    gradient.addColorStop(1, "#0a1525");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);

    // Draw some waves
    context.strokeStyle = "#30a0f0";
    context.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      context.beginPath();
      for (let x = 0; x < 512; x += 10) {
        const y = 300 + i * 20 + Math.sin(x * 0.02 + i) * 10;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    }
  } else if (name === "wind_arrow") {
    // Draw a wind arrow
    context.fillStyle = "#f0d080";
    context.beginPath();
    context.moveTo(256, 128);
    context.lineTo(320, 256);
    context.lineTo(288, 256);
    context.lineTo(288, 384);
    context.lineTo(224, 384);
    context.lineTo(224, 256);
    context.lineTo(192, 256);
    context.closePath();
    context.fill();
  } else {
    // Draw a placeholder pattern
    context.fillStyle = "#f0d080";
    context.fillRect(0, 0, 512, 512);
    context.fillStyle = "#0a1525";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(name, 256, 256);
  }

  return canvas;
}

// Set up event listeners for UI elements
function setupUIEventListeners() {
  // Ship color selection
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach((option) => {
    option.addEventListener("click", () => {
      colorOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      playerData.customization.color = option.getAttribute("data-color");
    });
  });

  // Select the first color by default
  colorOptions[0].classList.add("selected");

  // Start game button
  document.getElementById("start-game").addEventListener("click", () => {
    const playerName = document.getElementById("player-name").value.trim();
    const shipType = document.getElementById("ship-type").value;

    if (playerName) {
      playerData.name = playerName;
    } else {
      playerData.name = `Pirate_${Math.floor(Math.random() * 10000)}`;
    }

    playerData.shipType = shipType;

    document.getElementById("login-screen").style.display = "none";
    startGame();
  });

  // UI controls
  document.getElementById("show-players").addEventListener("click", () => {
    document.getElementById("player-list").classList.remove("hidden");
  });

  document.getElementById("close-player-list").addEventListener("click", () => {
    document.getElementById("player-list").classList.add("hidden");
  });

  document.getElementById("show-controls").addEventListener("click", () => {
    document.getElementById("controls-panel").classList.remove("hidden");
  });

  document.getElementById("close-controls").addEventListener("click", () => {
    document.getElementById("controls-panel").classList.add("hidden");
  });
}

// Start the game
function startGame() {
  // Create Three.js scene
  createScene();

  // Connect to server
  connectToServer();

  // Create UI manager
  ui = new UI();

  // Create sound manager
  soundManager = new SoundManager(camera, assets.sounds);
  soundManager.playSound("ambient", true, 0.3);

  // Create particle system
  particleSystem = new ParticleSystem(scene);

  // Start animation loop
  animate();

  // Show game UI
  document.getElementById("game-ui").classList.remove("hidden");

  gameStarted = true;
}

// Create Three.js scene
function createScene() {
  // Create scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a3c5a, 0.0025);

  // Create camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(0, 30, 100);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.body.appendChild(renderer.domElement);

  // Create controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 40;
  controls.maxDistance = 200;
  controls.update();

  // Create sun vector for lighting and water reflections
  sun = new THREE.Vector3();

  // Configure sun position
  const parameters = {
    elevation: 20,
    azimuth: 180,
  };

  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);

  // Create sky
  sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  // Configure sky
  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;
  skyUniforms["sunPosition"].value.copy(sun);

  // Create environment map for reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();
  sceneEnv.add(sky);
  const renderTarget = pmremGenerator.fromScene(sceneEnv);
  scene.environment = renderTarget.texture;

  // Create water with custom shader
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);

  // Use our custom water implementation
  water = new CustomWater(waterGeometry, {
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals: assets.textures.water,
    sunDirection: sun.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x0066cc,
    deepWaterColor: 0x001e3f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
    waveHeight: 1.0,
    waveSpeed: 1.0,
    reflectivity: 0.8,
  });

  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);

  // Add directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(sun.x, sun.y, sun.z);
  scene.add(directionalLight);

  // Handle window resize
  window.addEventListener("resize", onWindowResize);
}

// Connect to the game server
function connectToServer() {
  socket = io();

  // Socket event handlers
  socket.on("connect", () => {
    console.log("Connected to server");

    // Join the game
    socket.emit("join", playerData);
  });

  socket.on("gameState", (data) => {
    playerId = data.selfId;
    worldState = data.worldState;

    // Create player ship
    createPlayerShip(data.players[playerId], data.ships[playerId]);

    // Create other players
    for (const id in data.players) {
      if (id !== playerId) {
        createOtherPlayer(id, data.players[id], data.ships[id]);
      }
    }

    // Update wind indicator
    updateWindIndicator(data.worldState.wind);

    // Update water properties if available
    if (data.worldState.water) {
      updateWaterProperties(data.worldState.water);
    }
  });

  socket.on("playerJoined", (data) => {
    createOtherPlayer(data.player.id, data.player, data.ship);
    updatePlayerList();
  });

  socket.on("playerLeft", (id) => {
    removePlayer(id);
    updatePlayerList();
  });

  socket.on("playerMoved", (data) => {
    if (otherPlayers[data.id]) {
      otherPlayers[data.id].updatePosition(data.position, data.rotation);
    }
  });

  socket.on("shipUpdated", (data) => {
    if (data.id === playerId) {
      playerShip.updateShipState(data.ship);
    } else if (otherPlayers[data.id]) {
      otherPlayers[data.id].updateShipState(data.ship);
    }
  });

  socket.on("cannonFired", (data) => {
    // Play cannon fire sound
    soundManager.playSound("cannon_fire", false, 0.5);

    // Create cannon fire effect
    particleSystem.createCannonFireEffect(
      new THREE.Vector3(data.position.x, data.position.y, data.position.z),
      new THREE.Vector3(Math.cos(data.direction), 0, Math.sin(data.direction))
    );
  });

  socket.on("cannonHit", (data) => {
    // Play cannon hit sound
    soundManager.playSound("cannon_hit", false, 0.5);

    // Create hit effect
    particleSystem.createHitEffect(
      new THREE.Vector3(data.position.x, data.position.y, data.position.z)
    );

    // Update health bar if we're hit
    if (data.target === playerId) {
      ui.updateHealthBar(playerShip.health);
    }
  });

  socket.on("shipCollision", (data) => {
    // Play collision sound
    soundManager.playSound("cannon_hit", false, 0.7);

    // Create collision effect
    particleSystem.createCollisionEffect(
      new THREE.Vector3(data.position.x, data.position.y, data.position.z)
    );

    // Update health bar if we're involved
    if (data.rammer === playerId || data.rammed === playerId) {
      ui.updateHealthBar(playerShip.health);
    }
  });

  socket.on("shipDestroyed", (data) => {
    // Play ship destroyed sound
    soundManager.playSound("ship_destroyed", false, 0.7);

    // Create explosion effect
    particleSystem.createExplosionEffect(
      new THREE.Vector3(data.position.x, data.position.y, data.position.z)
    );

    // Show game over screen if it's us
    if (data.id === playerId) {
      showGameOver();
    }
  });

  socket.on("respawn", (data) => {
    // Reset player position
    playerShip.position.copy(data.position);
    playerShip.rotation.copy(data.rotation);

    // Reset health bar
    ui.updateHealthBar(100);

    // Hide game over screen
    hideGameOver();
  });

  socket.on("cannonsReloaded", () => {
    ui.updateCannonStatus(true);
  });

  socket.on("windChanged", (windData) => {
    if (worldState) {
      worldState.wind = windData;
    }
    updateWindIndicator(windData);
  });

  socket.on("waterChanged", (waterData) => {
    if (worldState) {
      worldState.water = waterData;
    }
    updateWaterProperties(waterData);
  });
}

// Create the player's ship
function createPlayerShip(playerData, shipData) {
  playerShip = new Ship(
    scene,
    assets.models[shipData.type],
    shipData.type,
    shipData.customization
  );

  playerShip.position.copy(playerData.position);
  playerShip.rotation.y = playerData.rotation.y;
  playerShip.health = playerData.health;

  // Create input handler
  inputHandler = new InputHandler(playerShip, camera, socket);

  // Update UI
  ui.updateHealthBar(playerShip.health);
  ui.updateCannonStatus(shipData.cannons.loaded);
}

// Create another player
function createOtherPlayer(id, playerData, shipData) {
  const player = new Player(
    scene,
    assets.models[shipData.type],
    shipData.type,
    shipData.customization,
    playerData.name
  );

  player.position.copy(playerData.position);
  player.rotation.y = playerData.rotation.y;
  player.health = playerData.health;

  otherPlayers[id] = player;

  // Update player list
  updatePlayerList();
}

// Remove a player
function removePlayer(id) {
  if (otherPlayers[id]) {
    otherPlayers[id].remove();
    delete otherPlayers[id];
  }
}

// Update the wind indicator
function updateWindIndicator(windData) {
  const arrow = document.getElementById("wind-direction-arrow");
  const strength = document.getElementById("wind-strength");

  // Rotate arrow to match wind direction
  arrow.style.transform = `rotate(${windData.direction}rad)`;

  // Update strength text
  const strengthPercent = Math.round(windData.strength * 100);
  strength.textContent = `${strengthPercent}%`;
}

// Update the player list
function updatePlayerList() {
  const playersList = document.getElementById("players");
  playersList.innerHTML = "";

  // Add self
  const selfItem = document.createElement("li");
  selfItem.textContent = `${playerData.name} (You) - ${playerShip.type}`;
  playersList.appendChild(selfItem);

  // Add other players
  for (const id in otherPlayers) {
    const playerItem = document.createElement("li");
    playerItem.textContent = `${otherPlayers[id].name} - ${otherPlayers[id].type}`;
    playersList.appendChild(playerItem);
  }
}

// Show game over screen
function showGameOver() {
  document.getElementById("game-over").classList.remove("hidden");

  // Start respawn countdown
  let countdown = 5;
  document.getElementById("respawn-timer").textContent = countdown;

  const countdownInterval = setInterval(() => {
    countdown--;
    document.getElementById("respawn-timer").textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
}

// Hide game over screen
function hideGameOver() {
  document.getElementById("game-over").classList.add("hidden");
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (gameStarted) {
    // Update water with dynamic wave patterns
    const time = performance.now() * 0.001;

    // Update water animation
    if (water && water.update) {
      // Update water animation
      water.update(time);

      // Update environment map every 10 frames for better performance
      if (Math.floor(time * 60) % 10 === 0) {
        water.updateEnvironmentMap(renderer, scene);
      }
    }

    // Make waves higher when wind is stronger
    if (worldState && worldState.wind && water) {
      const windStrength = worldState.wind.strength || 0.5;

      // Set wave height based on wind strength
      if (water.setWaveHeight) {
        water.setWaveHeight(0.5 + windStrength * 1.5);
      }

      // Set wave speed based on wind strength
      if (water.setWaveSpeed) {
        water.setWaveSpeed(0.5 + windStrength);
      }

      // Adjust wave direction based on wind direction
      if (worldState.wind.direction !== undefined && water.setWaveDirection) {
        const windDir = worldState.wind.direction;
        water.setWaveDirection(
          new THREE.Vector2(Math.cos(windDir), Math.sin(windDir))
        );

        // Gradually rotate sun position based on time of day
        const sunPhi = THREE.MathUtils.degToRad(90 - 20); // Fixed elevation at 20 degrees
        const sunTheta = windDir + Math.PI + Math.sin(time * 0.1) * 0.2; // Slight variation

        sun.setFromSphericalCoords(1, sunPhi, sunTheta);

        if (sky && sky.material && sky.material.uniforms) {
          sky.material.uniforms["sunPosition"].value.copy(sun);
        }

        if (water.setSunDirection) {
          water.setSunDirection(sun.clone().normalize());
        }
      }
    }

    // Update player ship
    if (playerShip) {
      playerShip.update();

      // Update camera position to follow the ship
      const cameraOffset = new THREE.Vector3(0, 30, 100);
      cameraOffset.applyQuaternion(playerShip.quaternion);
      camera.position.copy(playerShip.position).add(cameraOffset);
      camera.lookAt(playerShip.position);

      // Make ship bob with the waves
      if (playerShip.position.y === 0) {
        // If ship is at water level
        const waveHeight =
          Math.sin(time * 2) * 0.2 + Math.sin(time * 3.7) * 0.1;
        playerShip.position.y = waveHeight;
        playerShip.rotation.x = Math.sin(time * 2) * 0.01;
        playerShip.rotation.z = Math.sin(time * 2.3) * 0.01;
      }
    }

    // Update other players with wave motion
    for (const id in otherPlayers) {
      otherPlayers[id].update();

      // Make other ships bob with the waves too
      if (otherPlayers[id].position.y === 0) {
        const waveHeight =
          Math.sin(time * 2 + parseInt(id.substr(0, 3), 16)) * 0.2 +
          Math.sin(time * 3.7 + parseInt(id.substr(3, 3), 16)) * 0.1;
        otherPlayers[id].position.y = waveHeight;
        otherPlayers[id].rotation.x =
          Math.sin(time * 2 + parseInt(id.substr(0, 3), 16)) * 0.01;
        otherPlayers[id].rotation.z =
          Math.sin(time * 2.3 + parseInt(id.substr(3, 3), 16)) * 0.01;
      }
    }

    // Update particle systems
    particleSystem.update();
  }

  renderer.render(scene, camera);
}

// Update water properties based on server data
function updateWaterProperties(waterData) {
  if (!water) return;

  // Update wave height
  if (waterData.waveHeight !== undefined && water.setWaveHeight) {
    water.setWaveHeight(waterData.waveHeight);
  }

  // Update wave speed
  if (waterData.waveSpeed !== undefined && water.setWaveSpeed) {
    water.setWaveSpeed(waterData.waveSpeed);
  }

  // Update wave direction
  if (waterData.waveDirection !== undefined && water.setWaveDirection) {
    water.setWaveDirection(
      new THREE.Vector2(
        Math.cos(waterData.waveDirection),
        Math.sin(waterData.waveDirection)
      )
    );
  }

  console.log("Water properties updated:", waterData);
}

// Start the game
init();
