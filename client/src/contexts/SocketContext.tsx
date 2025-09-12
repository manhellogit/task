import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  reconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectSocket = useCallback((): Socket => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    // Cleanup existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const newSocket = io('http://localhost:4000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true, // Force new connection
    });

    newSocket.on('connect', () => {
      console.log('[socket] connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason);
      setIsConnected(false);
      
      // Auto-reconnect after a delay if disconnected unexpectedly
      if (reason === 'transport close' || reason === 'transport error') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[socket] attempting reconnect...');
          newSocket.connect();
        }, 2000);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('[socket] connection error:', err);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return newSocket;
  }, []);

  const reconnect = useCallback(() => {
    const s = connectSocket();
    if (!s.connected) {
      s.connect();
    }
  }, [connectSocket]);

  useEffect(() => {
    const s = connectSocket();
    s.connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};
