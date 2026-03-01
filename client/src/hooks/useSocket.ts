import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    // Development'ta Vite proxy kullanıyor, production'da doğrudan bağlan
    const socketUrl = import.meta.env.DEV ? window.location.origin : undefined;
    const socket = io(socketUrl, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['polling'], // Sadece polling kullan - Manus dev ortamında WebSocket proxy sorunları için
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
