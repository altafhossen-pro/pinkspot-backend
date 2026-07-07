const app = require('./src/app');
const dotenv = require('dotenv');
const http = require('http');
const socketConfig = require('./src/socket');

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = socketConfig.init(server);

io.on('connection', (socket) => {
    console.log('Client connected to socket.io');
    socket.on('disconnect', () => {
        console.log('Client disconnected from socket.io');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
