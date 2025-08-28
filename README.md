# 3D FPS Game (Counter-Strike Style)

A browser-based 3D first-person shooter game with multiplayer support, similar to Counter-Strike. Features include proper weapon orientation, solid floor collision, WASD movement, mouse look controls, and network play.

## Features

- **3D Graphics**: Built with Three.js for smooth 3D rendering
- **FPS Controls**:
  - WASD keys for movement
  - Mouse for looking around
  - Space bar to jump
  - Left click to shoot
  - R key to reload
- **Weapon System**: Visible weapon model with proper orientation and recoil animation
- **Solid Collision**: Players cannot fall through the floor or walk through walls
- **Multiplayer**: Play with friends over network using WebSocket
- **Map**: Arena-style map with walls and cover objects

## How to Play

### Single Player Mode

1. Open `index.html` in a modern web browser
2. Enter your player name
3. Click "Host Game" to play in single-player mode
4. Click anywhere to capture mouse control
5. Use WASD to move, mouse to look around, and left-click to shoot

### Multiplayer Mode

#### Host a Game:

1. Install Node.js if you haven't already
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the WebSocket server:
   ```bash
   npm start
   ```
4. Open `index.html` in your browser
5. Enter your player name
6. Make sure the server URL is `ws://localhost:8080`
7. Click "Join Game"

#### Join a Game:

1. Open `index.html` in your browser
2. Enter your player name
3. Enter the host's WebSocket server URL (e.g., `ws://192.168.1.100:8080`)
4. Click "Join Game"

## Controls

- **W/A/S/D**: Move forward/left/backward/right
- **Mouse**: Look around
- **Left Click**: Shoot
- **Space**: Jump
- **R**: Reload
- **ESC**: Release mouse control

## Network Play

To play with friends on the same network:

1. The host needs to find their local IP address (e.g., 192.168.1.100)
2. The host starts the server with `npm start`
3. Other players connect using `ws://[HOST_IP]:8080` as the server URL

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript, Three.js
- **Backend**: Node.js with WebSocket (ws library)
- **Rendering**: WebGL with shadows and lighting
- **Physics**: Custom collision detection system
- **Networking**: Real-time synchronization using WebSocket

## Browser Requirements

- Modern browser with WebGL support
- Chrome, Firefox, Safari, or Edge (latest versions recommended)
- Hardware acceleration enabled for best performance

## Troubleshooting

- **Can't connect to multiplayer**: Make sure the WebSocket server is running and firewall isn't blocking port 8080
- **Low FPS**: Try reducing browser window size or closing other tabs
- **Mouse not working**: Click on the game window to capture mouse control
- **Can't see other players**: Ensure all players are connected to the same server URL

Enjoy the game!
