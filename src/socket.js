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
          'http://pinkspot.bd',
          'https://pinkspot.bd',
          'http://www.pinkspot.bd',
          'https://www.pinkspot.bd',
          'http://api.pinkspot.bd',
          'https://api.pinkspot.bd',
          'http://pinkspot.vip',
          'https://pinkspot.vip',
          'http://www.pinkspot.vip',
          'https://www.pinkspot.vip',
          'http://office.pinkspot.vip',
          'https://office.pinkspot.vip',
          'http://api.pinkspot.vip',
          'https://api.pinkspot.vip',
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
