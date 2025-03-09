const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

// Game state
const players = {};
const ships = {};
const worldState = {
  wind: {
    direction: Math.random() * Math.PI * 2, // Random direction in radians
    strength: 0.5 + Math.random() * 0.5, // Random strength between 0.5 and 1.0
  },
  time: Date.now(),
};

// Create the Express app, HTTP server, and Socket.IO instance
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle player joining
  socket.on("join", (playerData) => {
    // Create a new player
    players[socket.id] = {
      id: socket.id,
      name: playerData.name || `Pirate_${socket.id.substr(0, 5)}`,
      position: {
        x: Math.random() * 1000 - 500,
        y: 0,
        z: Math.random() * 1000 - 500,
      },
      rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
      health: 100,
      score: 0,
    };

    // Create a ship for the player
    ships[socket.id] = {
      type: playerData.shipType || "sloop",
      customization: playerData.customization || {},
      sails: { raised: false, angle: 0 },
      cannons: { loaded: true, count: 8 },
      damage: 0,
      crew: 1,
    };

    // Send the current world state to the new player
    socket.emit("gameState", {
      players,
      ships,
      worldState,
      selfId: socket.id,
    });

    // Notify all other players about the new player
    socket.broadcast.emit("playerJoined", {
      player: players[socket.id],
      ship: ships[socket.id],
    });
  });

  // Handle player movement updates
  socket.on("updatePosition", (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;

      // Broadcast the updated position to all other players
      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        position: data.position,
        rotation: data.rotation,
      });
    }
  });

  // Handle ship actions (sail adjustments, cannon fire, etc.)
  socket.on("shipAction", (data) => {
    if (ships[socket.id]) {
      // Update ship state based on action
      switch (data.action) {
        case "adjustSails":
          ships[socket.id].sails.raised = data.raised;
          ships[socket.id].sails.angle = data.angle;
          break;
        case "fireCannon":
          // Handle cannon firing logic
          if (ships[socket.id].cannons.loaded) {
            ships[socket.id].cannons.loaded = false;

            // Check for hits on other ships
            const hitPlayerId = checkCannonHit(
              socket.id,
              data.direction,
              data.position
            );
            if (hitPlayerId) {
              // Apply damage to the hit ship
              const damage = calculateDamage(
                ships[socket.id],
                ships[hitPlayerId],
                data.distance
              );
              applyDamage(hitPlayerId, damage);

              // Notify players about the hit
              io.emit("cannonHit", {
                shooter: socket.id,
                target: hitPlayerId,
                damage,
                position: data.hitPosition,
              });
            }

            // Broadcast the cannon fire to all players
            io.emit("cannonFired", {
              id: socket.id,
              position: data.position,
              direction: data.direction,
            });

            // Start reload timer
            setTimeout(() => {
              if (ships[socket.id]) {
                ships[socket.id].cannons.loaded = true;
                socket.emit("cannonsReloaded");
              }
            }, 3000); // 3 seconds reload time
          }
          break;
        case "ram":
          // Handle ship ramming logic
          const rammedPlayerId = checkShipCollision(
            socket.id,
            data.position,
            data.direction
          );
          if (rammedPlayerId) {
            // Apply damage to both ships
            const rammerDamage = calculateRamDamage(
              ships[socket.id],
              ships[rammedPlayerId],
              true
            );
            const rammedDamage = calculateRamDamage(
              ships[rammedPlayerId],
              ships[socket.id],
              false
            );

            applyDamage(socket.id, rammerDamage);
            applyDamage(rammedPlayerId, rammedDamage);

            // Notify players about the collision
            io.emit("shipCollision", {
              rammer: socket.id,
              rammed: rammedPlayerId,
              rammerDamage,
              rammedDamage,
              position: data.position,
            });
          }
          break;
      }

      // Broadcast the updated ship state to all players
      io.emit("shipUpdated", {
        id: socket.id,
        ship: ships[socket.id],
      });
    }
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove the player and their ship from the game
    if (players[socket.id]) {
      delete players[socket.id];
      delete ships[socket.id];

      // Notify all other players about the disconnection
      io.emit("playerLeft", socket.id);
    }
  });
});

// Update the wind periodically
setInterval(() => {
  // Gradually change wind direction and strength
  worldState.wind.direction += (Math.random() - 0.5) * 0.1;
  worldState.wind.strength = Math.max(
    0.1,
    Math.min(1.0, worldState.wind.strength + (Math.random() - 0.5) * 0.1)
  );
  worldState.time = Date.now();

  // Broadcast the updated wind to all players
  io.emit("windChanged", worldState.wind);
}, 30000); // Update every 30 seconds

// Helper functions for game mechanics
function checkCannonHit(shooterId, direction, position) {
  // Simplified hit detection - in a real game, you'd use raycasting or more complex physics
  for (const playerId in players) {
    if (playerId !== shooterId) {
      const targetPos = players[playerId].position;
      const dx = targetPos.x - position.x;
      const dz = targetPos.z - position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Check if the target is within range and in the right direction
      if (distance < 50) {
        const angle = Math.atan2(dz, dx);
        const angleDiff = Math.abs(normalizeAngle(angle - direction));

        if (angleDiff < 0.3) {
          // About 17 degrees tolerance
          return playerId;
        }
      }
    }
  }
  return null;
}

function checkShipCollision(rammerId, position, direction) {
  // Simplified collision detection
  for (const playerId in players) {
    if (playerId !== rammerId) {
      const targetPos = players[playerId].position;
      const dx = targetPos.x - position.x;
      const dz = targetPos.z - position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Check if the ships are close enough to collide
      if (distance < 10) {
        return playerId;
      }
    }
  }
  return null;
}

function calculateDamage(attackerShip, targetShip, distance) {
  // Base damage depends on ship type and distance
  let baseDamage = 10;

  // Larger ships deal more damage
  if (attackerShip.type === "galleon") baseDamage = 15;
  if (attackerShip.type === "frigate") baseDamage = 12;

  // Damage falls off with distance
  const distanceFactor = Math.max(0.2, 1 - distance / 50);

  return Math.floor(baseDamage * distanceFactor);
}

function calculateRamDamage(ship, otherShip, isRammer) {
  // Ramming damage calculation
  let baseDamage = isRammer ? 5 : 15; // Rammer takes less damage than the rammed ship

  // Ship type affects damage
  const shipSizeFactor = {
    sloop: 0.8,
    brigantine: 1.0,
    frigate: 1.2,
    galleon: 1.5,
  };

  return Math.floor(baseDamage * shipSizeFactor[ship.type]);
}

function applyDamage(playerId, damage) {
  if (players[playerId]) {
    players[playerId].health = Math.max(0, players[playerId].health - damage);
    ships[playerId].damage = Math.min(100, ships[playerId].damage + damage);

    // Check if the player's ship is destroyed
    if (players[playerId].health <= 0) {
      handleShipDestroyed(playerId);
    }
  }
}

function handleShipDestroyed(playerId) {
  // Notify all players about the ship destruction
  io.emit("shipDestroyed", {
    id: playerId,
    position: players[playerId].position,
  });

  // Reset the player's ship and position
  players[playerId].health = 100;
  players[playerId].position = {
    x: Math.random() * 1000 - 500,
    y: 0,
    z: Math.random() * 1000 - 500,
  };
  players[playerId].rotation = {
    x: 0,
    y: Math.random() * Math.PI * 2,
    z: 0,
  };

  ships[playerId].damage = 0;
  ships[playerId].cannons.loaded = true;

  // Notify the player about respawn
  io.to(playerId).emit("respawn", {
    position: players[playerId].position,
    rotation: players[playerId].rotation,
  });
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
