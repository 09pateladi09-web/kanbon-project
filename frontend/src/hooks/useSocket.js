import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { taskAdded, taskUpdated, taskDeleted, tasksBulkUpdated } from '../redux/slices/taskSlice';
import { userOnline, userOffline } from '../redux/slices/uiSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useSocket = (boardId) => {
  const socketRef = useRef();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected');
      if (boardId) {
        socket.emit('join-board', { boardId });
      }
    });

    // Task Events
    socket.on('task:created', (task) => {
      dispatch(taskAdded(task));
    });

    socket.on('task:updated', (task) => {
      dispatch(taskUpdated(task));
    });

    socket.on('task:bulk-updated', (tasks) => {
      dispatch(tasksBulkUpdated(tasks));
    });

    socket.on('task:deleted', ({ taskId }) => {
      dispatch(taskDeleted({ taskId }));
    });

    // Presence Events
    socket.on('user-online', ({ userId }) => {
      dispatch(userOnline(userId));
    });

    socket.on('user-offline', ({ userId }) => {
      dispatch(userOffline(userId));
    });

    return () => {
      if (boardId) {
        socket.emit('leave-board', { boardId });
      }
      socket.disconnect();
    };
  }, [boardId, isAuthenticated, dispatch]);

  const emitEvent = (eventName, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(eventName, data);
    }
  };

  return { emitEvent, socket: socketRef.current };
};

export default useSocket;
