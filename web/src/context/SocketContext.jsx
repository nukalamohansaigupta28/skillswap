import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { info } = useToast();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
      return;
    }

    // Connect to backend Socket.io server
    const defaultBackend = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://skillswap-ud11.onrender.com';
    const socketUrl = import.meta.env.VITE_API_URL || defaultBackend;

    const newSocket = io(socketUrl, {
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('⚡ Socket disconnected');
    });

    // Handle online users updates
    newSocket.on('users:online', (userIds) => {
      if (Array.isArray(userIds)) {
        setOnlineUsers(new Set(userIds));
      }
    });

    newSocket.on('user:status', ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === 'online') {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // Real-time notification toast
    newSocket.on('notification:new', (notification) => {
      if (notification?.title) {
        info(`🔔 ${notification.title}: ${notification.message || ''}`);
      }
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, info]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const id = typeof userId === 'object' ? userId._id || userId.id : userId;
    return onlineUsers.has(id?.toString());
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;

