# Counter Strike 3D - Browser FPS Game

A 3D first-person shooter game inspired by Counter-Strike that runs entirely in your web browser with multiplayer support. Built with Three.js for 3D graphics and WebSockets for real-time multiplayer networking.

![Game Screenshot](https://via.placeholder.com/800x400/87CEEB/000000?text=Counter+Strike+3D+Browser+Game)

## 🎮 Features

- **Full 3D FPS Experience**: First-person shooter with realistic movement and controls
- **Multiplayer Support**: Play with friends over the network using WebSockets
- **Multiple Weapons**: AK-47, M4A4, AWP, Glock, USP-S with realistic stats
- **Dynamic Map**: Buildings, obstacles, weapon spawns, and collision detection
- **Real-time Combat**: Bullet physics, hit detection, and damage system
- **Game Modes**: Deathmatch with respawn system
- **Browser-based**: No downloads required, runs in any modern web browser
- **Cross-platform**: Works on Windows, Mac, Linux, and mobile devices

## 🚀 Quick Start

### Option 1: Play Locally (Single Player)

1. Download or clone this repository
2. Open `index.html` in your web browser
3. Click "Start Game" and enjoy!

### Option 2: Multiplayer Setup

1. **Install Node.js** (version 14 or higher) from [nodejs.org](https://nodejs.org/)
2. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/counter-strike-3d-browser.git
   cd counter-strike-3d-browser
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the server**:
   ```bash
   npm start
   ```
5. **Open your browser** and go to `http://localhost:3000`
6. **Share the URL** with friends to play together!

## 🎯 How to Play

### Controls

- **WASD**: Move around
- **Mouse**: Look around (click to enable mouse lock)
- **Left Click**: Shoot
- **Right Click**: Aim (future feature)
- **Space**: Jump
- **Shift**: Run
- **Ctrl**: Crouch
- **R**: Reload
- **1, 2**: Switch weapons
- **ESC**: Exit mouse lock

### Game Mechanics

- **Health**: 100 HP, decreases when shot
- **Weapons**: Each weapon has different damage, fire rate, and accuracy
- **Ammo**: Limited ammunition, reload when empty
- **Respawn**: Automatic respawn after 3 seconds when killed
- **Weapon Pickups**: Find better weapons around the map

### Multiplayer

- Up to 16 players per server
- Real-time position and action synchronization
- Player names displayed above characters
- Kill/death tracking
- Automatic respawn system

## 🛠️ Technical Details

### Architecture

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Engine**: Three.js for WebGL rendering
- **Networking**: WebSockets for real-time communication
- **Backend**: Node.js with ws library
- **Physics**: Custom collision detection and bullet physics

### File Structure

```
counter-strike-3d-browser/
├── index.html              # Main game page
├── server.js              # Node.js WebSocket server
├── package.json           # Node.js dependencies
├── js/
│   ├── main.js           # Game initialization
│   ├── game.js           # Core game engine
│   ├── player.js         # Player mechanics
│   ├── weapon.js         # Weapon system
│   ├── map.js            # Map generation
│   └── networking.js     # Multiplayer networking
└── README.md             # This file
```

### Browser Compatibility

- **Chrome**: ✅ Fully supported
- **Firefox**: ✅ Fully supported
- **Safari**: ✅ Supported (may need WebGL enabled)
- **Edge**: ✅ Fully supported
- **Mobile**: ⚠️ Limited support (touch controls not optimized)

## 🔧 Configuration

### Server Configuration

Edit `server.js` to customize:

- **PORT**: WebSocket server port (default: 8080)
- **HTTP_PORT**: HTTP server port (default: 3000)
- **maxPlayers**: Maximum players per server (default: 16)
- **gameMode**: Game mode settings

### Game Configuration

Edit the JavaScript files to customize:

- **Weapon stats**: Damage, fire rate, accuracy in `js/weapon.js`
- **Map layout**: Buildings and obstacles in `js/map.js`
- **Player settings**: Speed, health, jump height in `js/player.js`

## 🌐 Deployment

### Local Network

1. Start the server: `npm start`
2. Find your local IP address
3. Share `http://YOUR_IP:3000` with friends on the same network

### Cloud Deployment (Heroku)

1. Create a Heroku account
2. Install Heroku CLI
3. Deploy:
   ```bash
   heroku create your-game-name
   git push heroku main
   ```

### VPS/Cloud Server

1. Upload files to your server
2. Install Node.js and dependencies
3. Run with PM2 for production:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "cs3d-server"
   ```

## 🎨 Customization

### Adding New Weapons

1. Edit `js/weapon.js`
2. Add weapon stats to `WeaponFactory`
3. Update weapon spawn locations in `js/map.js`

### Creating New Maps

1. Edit `js/map.js`
2. Modify `createBuildings()` and `createObstacles()`
3. Adjust spawn points and weapon locations

### Styling

1. Edit CSS in `index.html`
2. Customize HUD elements and colors
3. Add new UI components

## 🐛 Troubleshooting

### Common Issues

- **Game won't load**: Check browser console for errors
- **Can't connect to server**: Ensure server is running and ports are open
- **Poor performance**: Lower graphics quality or close other browser tabs
- **Mouse not working**: Click on the game area to enable mouse lock

### Performance Tips

- Close unnecessary browser tabs
- Use Chrome or Firefox for best performance
- Ensure stable internet connection for multiplayer
- Lower screen resolution if experiencing lag

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Make changes and test
5. Submit pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js**: Amazing 3D graphics library
- **WebSocket API**: Real-time communication
- **Counter-Strike**: Inspiration for game mechanics
- **Open Source Community**: For tools and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/counter-strike-3d-browser/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/counter-strike-3d-browser/discussions)
- **Email**: support@yourdomain.com

## 🔮 Future Features

- [ ] Sound effects and music
- [ ] Team-based gameplay
- [ ] Bomb defusal game mode
- [ ] More weapons and equipment
- [ ] Map editor
- [ ] Mobile touch controls
- [ ] Spectator mode
- [ ] Statistics and leaderboards
- [ ] Custom skins and themes

---

**Enjoy the game and happy fragging!** 🎯💥
