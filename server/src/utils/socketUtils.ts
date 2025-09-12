import { Server, Socket } from "socket.io";

/**
 * Broadcast a message to everyone in a room except sender
 */
export const broadcastToRoom = (
  io: Server,
  roomId: string,
  event: string,
  data: any,
  sender?: Socket
) => {
  if (sender) {
    sender.to(roomId).emit(event, data);
  } else {
    io.to(roomId).emit(event, data);
  }
};

/**
 * Send a message to ALL clients in a room (including sender)
 */
export const emitToRoom = (io: Server, roomId: string, event: string, data: any) => {
  io.to(roomId).emit(event, data);
};

/**
 * Send a message to a single client
 */
export const emitToClient = (io: Server, clientId: string, event: string, data: any) => {
  io.to(clientId).emit(event, data);
};
