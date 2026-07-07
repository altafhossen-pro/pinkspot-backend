let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
      cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://64.227.133.212',
            'http://forpink.com',
            'https://forpink.com',
            'http://www.forpink.com',
            'https://www.forpink.com',
            'http://api.forpink.com',
            'https://api.forpink.com',
            'http://64.227.133.212:3000'
        ],
        methods: ["GET", "POST"]
      }
    });
    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
