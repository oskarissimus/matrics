const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const os = require('os');
const { PORT } = require('./server/constants.js');
const { setupSocketHandlers } = require('./server/events/handlers.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    setupSocketHandlers(io, socket);
});

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

server.listen(PORT, () => {
    const localIP = getLocalIP();
    console.log(`Server running on:`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://${localIP}:${PORT}`);
});
