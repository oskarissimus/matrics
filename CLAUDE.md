# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference

When using voice conversation (converse tool), always respond in Polish.

## Sudo Commands

When a command requires sudo/admin privileges, open an interactive Terminal window with sudo command. This allows Touch ID authentication (osascript's "with administrator privileges" doesn't support Touch ID as it uses Authorization Services which only allows Touch ID for Apple-signed apps).

Example:
```bash
osascript <<'EOF'
tell application "Terminal"
    activate
    do script "sudo YOUR_COMMAND_HERE; exit"
end tell
EOF
```

## Project Overview

Matrics is a browser-based 3D multiplayer FPS game built with Three.js and Socket.IO. Players spawn immediately into the game with no lobby, can move around, shoot each other with pistols, and respawn after death.

## Development Commands

Development server with hot reload (preferred for development):
```bash
npm run dev
```

Production server (runs on http://localhost:3000):
```bash
npm start
```

## Architecture Overview

The codebase is organized into modular ES6 modules using import maps (no build step required).

### Directory Structure

```
matrics/
├── index.html              # Entry point with import map config
├── server.js               # Server entry point (thin, delegates to modules)
├── maps.js                 # Map definitions (shared server/client via UMD)
├── styles/
│   └── main.css            # All CSS styles
├── client/                 # Client-side ES6 modules
│   ├── main.js             # Client entry point
│   ├── constants.js        # All game constants
│   ├── state.js            # Centralized state management
│   ├── core/
│   │   ├── renderer.js     # Three.js scene, camera, lighting
│   │   └── game-loop.js    # Main game loop
│   ├── networking/
│   │   ├── socket.js       # Socket.IO connection
│   │   └── events.js       # Socket event handlers
│   ├── input/
│   │   ├── keyboard.js     # WASD, Tab, backtick handlers
│   │   ├── mouse.js        # Pointer lock, mouse movement
│   │   └── controls.js     # High-level input setup
│   ├── player/
│   │   ├── character-model.js  # createBlockyCharacter()
│   │   ├── remote-players.js   # Remote player management
│   │   └── movement.js         # Player movement + collision
│   ├── combat/
│   │   ├── weapon.js       # Weapon model + recoil
│   │   ├── bullets.js      # Bullet lifecycle
│   │   └── shooting.js     # Raycasting + hit detection
│   ├── map/
│   │   ├── loader.js       # Map loading + clearing
│   │   ├── elements.js     # Floor + obstacle creation
│   │   └── collision.js    # Collision detection
│   └── ui/
│       ├── hud.js          # HP bar display
│       ├── scoreboard.js   # Scoreboard rendering
│       ├── console.js      # In-game console
│       ├── overlay.js      # Click-to-play overlay
│       └── username.js     # Username editing
└── server/                 # Server-side CommonJS modules
    ├── constants.js        # Server constants
    ├── state.js            # Server state
    ├── players/
    │   ├── manager.js      # Player CRUD operations
    │   ├── spawning.js     # Spawn positions + colors
    │   └── validation.js   # Name validation
    ├── combat/
    │   └── handler.js      # Hit, death, respawn logic
    └── events/
        └── handlers.js     # Socket event handlers
```

### State Management

All client state is centralized in `client/state.js`:

- **gameState**: Core game status (isDead, isConnected, currentHP, myPlayerId)
- **inputState**: User input (movement keys, pitch, yaw)
- **sceneState**: Three.js objects (scene, camera, renderers, weapon)
- **entityState**: Game entities (players, bullets, obstacles)
- **uiState**: UI data (scoreboard, console history)
- **networkState**: Socket.IO connection

### Constants

All magic numbers are in `client/constants.js`:

- Movement: MOVE_SPEED, MOUSE_SENSITIVITY, PLAYER_RADIUS
- Combat: DAMAGE_PER_HIT, BULLET properties, WEAPON properties
- Visual: HP thresholds, SCENE colors, CAMERA settings, LIGHTING

## Common Tasks

### Adding a New Weapon

1. Edit `client/combat/weapon.js` - Add weapon geometry
2. Edit `client/constants.js` - Add weapon constants
3. Edit `client/combat/shooting.js` - Add firing logic

### Adding a New Socket Event

1. Server: Add handler in `server/events/handlers.js`
2. Client: Add handler in `client/networking/events.js`

### Adding a New Map

1. Add map definition to `maps.js` with:
   - Metadata (name, floorSize, spawnArea)
   - Floor definition
   - collisionData array
   - elements array

### Modifying Player Appearance

1. Edit `client/player/character-model.js`

### Modifying UI

1. Edit relevant file in `client/ui/`
2. CSS changes go in `styles/main.css`

### Modifying Movement/Physics

1. Edit `client/player/movement.js` for movement
2. Edit `client/map/collision.js` for collision detection

## Key Implementation Details

### Client Architecture

The client uses ES6 modules loaded via import maps (see index.html):
- Three.js loaded from CDN
- CSS2DRenderer for name tags
- Socket.IO loaded from server

Entry point: `client/main.js` calls:
1. `initRenderer()` - Sets up Three.js scene
2. `loadMap('default')` - Loads initial map
3. `createWeapon()` - Creates first-person weapon
4. `setupControls()` - Binds input handlers
5. `setupConsoleInput()` - Sets up console
6. `initUsername()` - Loads saved name
7. `startGameLoop()` - Begins render loop

### Server Architecture

The server uses CommonJS modules:
- Express serves static files
- Socket.IO handles real-time communication
- State stored in `server/state.js`

Entry point: `server.js` sets up Express and delegates socket handling to `server/events/handlers.js`.

### Networking Events

Socket.IO events handled:
- `init` - Player initialization with full state
- `playerJoined/playerLeft` - Player lifecycle
- `playerMoved` - Position sync
- `playerShot` - Bullet visualization
- `hit` - Damage processing
- `hpUpdate` - HP synchronization
- `playerDied/playerRespawn` - Death/respawn cycle
- `scoreUpdate` - Scoreboard data
- `playerNameChanged` - Name updates
- `mapChange` - Map switching
- `consoleMessage` - Server messages

### Project Constraints

From spec.md:
- No comments in code
- No README file
- Single game instance per server (no room management)
- Players spawn immediately with sequential names (Player1, Player2, etc.)

## Multi-Agent Coordination

**IMPORTANT:** Multiple AI agents may be working on this codebase simultaneously. To avoid conflicts:

1. **Track your work:** Each agent must create and maintain its own work log file named `agent-work-{agent-id}.md` in the project root

2. **Log file format:** Include timestamp, task, files being edited, status

3. **Before editing code:** Check for other agent work logs to avoid conflicts

4. **Communication:** Use your work log as a communication mechanism
