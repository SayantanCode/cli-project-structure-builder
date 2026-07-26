import { Server } from "socket.io";
import http from "http";

export const socket = {
  init: (server: http.Server) => {
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });
    console.log("✅ Socket.IO server initialized");
    return io;
  },
};
