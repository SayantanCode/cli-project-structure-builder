import { Server } from "socket.io";

export const socket = {
  init: (server) => {
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });
    console.log("✅ Socket.IO server initialized");
    return io;
  },
};
