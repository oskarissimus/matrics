# Matrics - Counter-Strike Style Browser Game

A multiplayer first-person shooter game inspired by Counter-Strike, built with HTML5 Canvas and JavaScript. Play with friends over the network in your browser!

## Features

- **Real-time Multiplayer**: Play with friends over WebSocket connections
- **Counter-Strike Inspired Gameplay**:
  - Two teams: Terrorists vs Counter-Terrorists
  - Round-based matches with bomb defusal objectives
  - Multiple weapons: AK-47, M4A4, AWP, Glock, USP-S, Knife
- **Tactical Gameplay**:
  - Realistic weapon mechanics with recoil and accuracy
  - Strategic map design with bomb sites A and B
  - Team-based objectives and scoring
- **Modern Browser Features**:
  - Pointer lock for smooth mouse look
  - Real-time chat system
  - Minimap with player positions
  - Sound effects using Web Audio API

## Controls

- **WASD**: Move
- **Mouse**: Look around
- **Left Click**: Shoot
- **R**: Reload
- **T**: Open chat
- **C**: Crouch
- **Shift**: Run
- **1-3**: Switch weapons
- **Escape**: Pause/Menu
- **F1**: Show help
- **F11**: Toggle fullscreen

## Quick Start

1. **Local Play**: Simply open `index.html` in your browser and click "Host Game"
2. **Multiplayer**:
   - One player hosts a game
   - Other players click "Join Game" and enter the host's IP address
   - For local network play, use `localhost:8080` or the host's local IP

## Game Modes

### Bomb Defusal

- **Terrorists**: Plant the bomb at site A or B
- **Counter-Terrorists**: Prevent bomb planting or defuse planted bombs
- **Win Conditions**:
  - Eliminate all enemies
  - Successfully plant and detonate bomb (Terrorists)
  - Defuse the bomb or prevent planting (Counter-Terrorists)

## Technical Features

### Architecture

- **Modular Design**: Separate classes for Game, Player, Weapon, Map, and Network
- **Client-Server Model**: WebSocket-based networking for real-time multiplayer
- **Optimized Rendering**: Frustum culling and efficient collision detection
- **Cross-Platform**: Works on any modern browser supporting HTML5 Canvas

### Networking

- **WebSocket Communication**: Real-time player updates and game events
- **State Synchronization**: Player positions, health, and actions
- **Lag Compensation**: Client-side prediction and server reconciliation
- **Reconnection Handling**: Automatic reconnection with message queuing

### Performance

- **60 FPS Target**: Optimized game loop with requestAnimationFrame
- **Collision Grid**: Spatial partitioning for efficient collision detection
- **View Culling**: Only render objects within camera view
- **Memory Management**: Automatic cleanup of old bullets and effects

## File Structure

```
matrics/
├── index.html          # Main game page
├── js/
│   ├── main.js         # Game initialization and menu handling
│   ├── game.js         # Core game engine and rendering
│   ├── player.js       # Player class with movement and actions
│   ├── weapon.js       # Weapon system with different gun types
│   ├── map.js          # Map/level system with collision detection
│   └── network.js      # WebSocket networking for multiplayer
└── README.md           # This file
```

## Development

### Adding New Weapons

1. Add weapon configuration to `weapon.js` in the `setupWeapon()` method
2. Include damage, fire rate, accuracy, and other properties
3. Weapons automatically support reloading, sound effects, and muzzle flash

### Creating New Maps

1. Extend the `GameMap` class in `map.js`
2. Define walls, spawn points, and bomb sites
3. Maps support collision detection, line-of-sight, and minimap rendering

### Network Protocol

The game uses a simple JSON message protocol over WebSockets:

- `player_join`: Player connects to game
- `player_update`: Position and state updates
- `player_shoot`: Shooting events
- `chat_message`: Text chat
- `game_state`: Round and score updates

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires user interaction for audio)
- **Edge**: Full support

## Deployment Options

### Local Network Play

1. Start a simple HTTP server in the project directory
2. Players connect using the host's local IP address
3. Ensure firewall allows connections on port 8080

### Online Deployment

1. Deploy to any web hosting service (GitHub Pages, Netlify, etc.)
2. Set up a WebSocket server for multiplayer functionality
3. Update connection URLs in the network configuration

### Docker Deployment

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

## Known Limitations

- **Server Implementation**: Currently uses client-side simulation for demo purposes
- **Anti-Cheat**: No server-side validation (suitable for trusted players)
- **Scalability**: Designed for small groups (2-10 players)
- **Mobile Support**: Optimized for desktop with mouse and keyboard

## Future Enhancements

- [ ] Dedicated server implementation
- [ ] More weapons and equipment
- [ ] Additional game modes (Team Deathmatch, Arms Race)
- [ ] Map editor and custom maps
- [ ] Player statistics and rankings
- [ ] Mobile touch controls
- [ ] Spectator mode
- [ ] Voice chat integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Credits

Inspired by Counter-Strike and built as a demonstration of modern web game development techniques using HTML5 Canvas and WebSocket technology.

---

**Ready to play?** Open `index.html` in your browser and start fragging!
