const app = require('./src/app');
const dotenv = require('dotenv');
const http = require('http');
const socketConfig = require('./src/socket');
const { setupSocketHandlers } = require('./src/socket.handlers');

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = socketConfig.init(server);

// Setup Socket.io event handlers (e.g., Visitor tracking)
setupSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
