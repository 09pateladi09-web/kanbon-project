const { Server } = require('socket.io');
const env = require('./env');
const socketAuth = require('../sockets/socketAuth');
const boardHandlers = require('../sockets/boardHandlers');
const taskHandlers = require('../sockets/taskHandlers');
const presenceHandlers = require('../sockets/presenceHandlers');

let io;

// In-memory presence map: Map<userId, Set<socketId>>
// For multi-instance scaling, this should be moved to Redis (e.g. using socket.io-redis adapter and Redis GET/SET)
const userSocketsMap = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  // Authentication Middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    
    // Add to presence map
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId).add(socket.id);

    // Set user online
    presenceHandlers.setUserOnline(io, socket, userId);

    // Register handlers
    boardHandlers.registerBoardHandlers(io, socket);
    taskHandlers.registerTaskHandlers(io, socket);

    socket.on('disconnect', () => {
      // Remove from presence map
      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
          presenceHandlers.setUserOffline(io, socket, userId);
        }
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = initSocket;
module.exports.getIo = getIo;
module.exports.userSocketsMap = userSocketsMap;
