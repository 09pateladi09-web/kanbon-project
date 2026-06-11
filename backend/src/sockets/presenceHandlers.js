const User = require('../models/User');

const setUserOnline = async (io, socket, userId) => {
  try {
    await User.findByIdAndUpdate(userId, { isOnline: true });
    // Broadcast to all rooms this user is in (or globally if tracking all online users)
    // We can emit a general 'user-online' to everyone or handle it when users join a board.
    socket.broadcast.emit('user-online', { userId, isOnline: true });
  } catch (err) {
    console.error('Error setting user online', err);
  }
};

const setUserOffline = async (io, socket, userId) => {
  try {
    const lastSeen = new Date();
    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
    socket.broadcast.emit('user-offline', { userId, isOnline: false, lastSeen });
  } catch (err) {
    console.error('Error setting user offline', err);
  }
};

module.exports = {
  setUserOnline,
  setUserOffline
};
