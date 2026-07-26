export const chatGateway = (io) => {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket) => {
    console.log("New client connected to chat namespace: " + socket.id);

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room ${room}`);
      chatNamespace.to(room).emit("message", `${socket.id} has joined the room.`);
    });

    socket.on("sendMessage", (data) => {
      console.log(`Message from ${socket.id} in ${data.room}: ${data.message}`);
      chatNamespace.to(data.room).emit("message", `${socket.id}: ${data.message}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected: " + socket.id);
    });
  });
};
