import { Server, Socket } from "socket.io";
import { logger } from "../config/logger";

export const chatGateway = (io: Server) => {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket: Socket) => {
    logger.info("New client connected to chat namespace: " + socket.id);

    socket.on("joinRoom", (room: string) => {
      socket.join(room);
      logger.info(`Client ${socket.id} joined room ${room}`);
      chatNamespace.to(room).emit("message", `${socket.id} has joined the room.`);
    });

    socket.on("sendMessage", (data: { room: string; message: string }) => {
      logger.info(`Message from ${socket.id} in ${data.room}: ${data.message}`);
      chatNamespace.to(data.room).emit("message", `${socket.id}: ${data.message}`);
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected: " + socket.id);
    });
  });
};
