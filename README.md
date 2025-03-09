# Pirate Vibes

A multiplayer pirate ship simulator built with Three.js and Socket.IO, inspired by Assassin's Creed IV: Black Flag.

## Features

- Multiplayer naval combat in an open-world environment
- Realistic water simulation with Three.js
- Wind mechanics that affect ship movement
- Multiple ship types with different characteristics
- Cannon combat system
- Ship ramming and collision mechanics
- Ship customization
- Health and damage system
- Particle effects for cannon fire, explosions, and more

## Ship Types

- **Sloop**: Fast and agile, but less durable
- **Brigantine**: Balanced speed and firepower
- **Frigate**: Strong firepower, moderate speed
- **Galleon**: Slow but powerful and durable

## Controls

- **W/S**: Move forward/backward
- **A/D**: Turn left/right
- **Q/E**: Adjust sails
- **Space**: Fire cannons
- **Shift**: Boost (Ram)
- **M**: Toggle map
- **Tab**: Player list
- **Esc**: Controls menu
- **Left Click**: Fire left cannons
- **Right Click**: Fire right cannons

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/pirate-vibes.git
   cd pirate-vibes
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Build the client:

   ```
   npm run build
   ```

4. Start the server:

   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Development

For development with hot reloading:

```
npm run dev
```

## Technologies Used

- **Three.js**: 3D graphics library
- **Socket.IO**: Real-time communication
- **Express**: Web server
- **Webpack**: Module bundler

## Project Structure

- `server.js`: Main server file handling multiplayer functionality
- `src/client/index.js`: Main client entry point
- `src/client/js/models/`: Ship and player models
- `src/client/js/utils/`: Utility classes for input, UI, sound, and particles

## Future Improvements

- Add more ship types and customization options
- Implement AI-controlled enemy ships
- Add islands and treasures to discover
- Implement a progression system
- Add weather effects (storms, fog)
- Improve physics and collision detection
- Add more detailed ship damage models

## License

MIT

## Credits

Created as a demonstration project for a Three.js multiplayer game.
