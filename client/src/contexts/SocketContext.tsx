import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinOrderRoom: (orderId: number) => void;
  leaveOrderRoom: (orderId: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  joinOrderRoom: () => {},
  leaveOrderRoom: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize Socket.io connection
    const socketInstance = io({
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
      setConnected(false);
    });

    socketInstance.on('error', (error: any) => {
      console.error('[Socket.IO] Error:', error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinOrderRoom = (orderId: number) => {
    if (socket) {
      socket.emit('order:join', orderId);
      console.log(`[Socket.IO] Joined order room: ${orderId}`);
    }
  };

  const leaveOrderRoom = (orderId: number) => {
    if (socket) {
      socket.emit('order:leave', orderId);
      console.log(`[Socket.IO] Left order room: ${orderId}`);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinOrderRoom, leaveOrderRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
