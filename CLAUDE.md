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

## Multi-Agent Coordination

**IMPORTANT:** Multiple AI agents may be working on this codebase simultaneously. To avoid conflicts:

1. **Track your work:** Each agent must create and maintain its own work log file named `agent-work-{agent-id}.md` in the project root (e.g., `agent-work-alice.md`, `agent-work-bob.md`)

2. **Log file format:** Your work log should include:
   - Timestamp of when you started working
   - Current task or feature you're implementing
   - Files you're actively editing
   - Status updates as you progress
   - Timestamp when you finish

3. **Before editing code:**
   - Check for other agent work logs (`agent-work-*.md`) to see what files others are editing
   - If another agent is working on the same file, coordinate by adding a note to your log and consider working on a different task
   - Update your log before touching any file

4. **Communication:** Use your work log as a communication mechanism. Other agents will read these logs to understand what's in progress.

Example work log entry:
```
## 2025-12-05 14:30
Agent: alice
Status: In Progress
Task: Adding grenade weapon functionality
Files: game.js (lines 300-350), server.js (lines 65-80)
Notes: Implementing grenade throwing mechanics

## 2025-12-05 15:15
Status: Complete
```

## Development Commands

Development server with hot reload (preferred for development):
```bash
npm run dev
```

Production server (runs on http://localhost:3000):
```bash
npm start
```

## Architecture

### Server Architecture (server.js)

The server runs an Express HTTP server with Socket.IO for real-time communication on port 3000. It maintains a single shared game state for all players:

- `players` object: stores all player data including position, rotation, HP, color, and name
- `playerCount`: auto-incrementing counter for player names (Player1, Player2, etc.)

Key server responsibilities:
- Player lifecycle: connection, initialization with random spawn position and color, disconnection
- Movement synchronization: broadcasts player position/rotation updates to other clients
- Combat system: handles hit detection validation, HP updates, death events, and respawn after 3 seconds
- Shooting events: broadcasts shot events to all players for bullet visualization

### Client Architecture (game.js + index.html)

The client uses Three.js for 3D rendering with two renderers:
- `THREE.WebGLRenderer`: renders 3D scene with shadow mapping enabled
- `THREE.CSS2DRenderer`: overlays HTML name tags above players

Key client systems:

**Player Representation:**
- Local player: first-person camera at y=1.6 (eye height) with weapon attached to camera
- Remote players: blocky character models (head, torso, arms, legs) created with Three.js box geometries, rendered in random colors

**Controls:**
- WASD movement uses pitch/yaw angles to calculate forward/right vectors
- Mouse movement updates pitch (clamped to ±90°) and yaw for camera rotation
- Pointer lock API for FPS-style mouse control
- Left click triggers raycasting for hit detection and emits shoot event

**Combat:**
- Client-side raycasting determines hits against remote player meshes
- Bullets are visual-only (yellow cylinder meshes) that fade out over 1 second lifetime
- Damage (25 HP per hit) is calculated client-side and sent to server for validation
- HP bar shows current health with color gradient (green > 60, yellow 30-60, red < 30)

**Networking:**
Socket.IO events:
- `init`: receives player ID, full player list, and spawn position
- `playerJoined/playerLeft`: handles player connection/disconnection
- `playerMoved`: updates remote player positions
- `playerShot`: spawns bullet visualization for remote shots
- `hpUpdate`: syncs HP changes from server
- `playerDied/playerRespawn`: handles death state and respawn at new random position

### Key Implementation Details

**Weapon Model:**
Created in `createWeapon()` as a group of primitive shapes (box body, cylinder barrel, box handle, cylinder scope) positioned at (0.3, -0.3, -0.5) relative to camera for proper first-person view.

**Character Models:**
`createBlockyCharacter()` builds player models from box geometries with proper body proportions. Y-offset of -1.0 applied when positioning so feet align with ground plane.

**Movement System:**
Camera position represents player position. Movement updates sent to server every frame when socket is connected. Server broadcasts position to other clients who update their local representations.

**Hit Detection:**
Client performs raycasting on mouse click. If ray intersects remote player mesh, client sends hit event to server. Server is authoritative for HP values and broadcasts updates to all clients.

### Project Constraints

From spec.md:
- No comments in code
- No README file
- Single game instance per server (no room management)
- Players spawn immediately with sequential names (Player1, Player2, etc.)
