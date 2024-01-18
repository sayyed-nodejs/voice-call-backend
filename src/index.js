import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";

const app = express();
const APP_PORT = process.env.PORT;
app.use(cors()).use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 1000,
});

const connectedUsers = {}; // Keep track of connected users

// socket code
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.emit("me", { id: socket.id, name: null });

  socket.on("setUserName", (name) => {
    connectedUsers[socket.id] = { id: socket.id, name };
    io.emit("onlineUsers", Object.values(connectedUsers));
  });

  // Add the user to the connected users list
  connectedUsers[socket.id] = { id: socket.id, name: null };

  // Emit the list of online users to all clients
  io.emit("onlineUsers", Object.values(connectedUsers));

  socket.on("disconnect", () => {
    console.log("user disconnected");
    // Remove the user from the connected users list
    delete connectedUsers[socket.id];

    // Emit the updated list of online users to all clients
    io.emit("onlineUsers", Object.values(connectedUsers));
    socket.broadcast.emit("callEnded",{ to: socket.id });
  });
  console.log(connectedUsers,"connectedUsers")

  socket.on("callUser", (data) => {
    console.log(`callUser event from ${data.from} to ${data.name}`);
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("answerCall", (data) => {
    console.log(`answerCall event from ${data.from} to ${data.to}`);
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("callEnded", ({ to }) => {
    console.log(`Server: Call ended for user ${to}`);
  
    // Notify the other user that the call has ended
    io.to(to).emit("callEnded");
  
    // Disconnect the other user
    const otherSocket = io.sockets.sockets[to];
    if (otherSocket) {
      otherSocket.disconnect(true); // true indicates a close event
    }
  
    // Disconnect the current user
    socket.disconnect(true); // true indicates a close event
  });
  

  

  socket.on("callDeclined", ({ to }) => {
    console.log("decline")
    io.to(to).emit("callDeclined");
  });

  socket.on("user-connected", (userID) => {
    console.log(`user-connected event for ${userID}`);
    socket.broadcast.emit("user-connected", userID);
  });

  socket.on("user-disconnected", (userID) => {
    console.log(`user-disconnected event for ${userID}`);
    socket.broadcast.emit("user-disconnected", userID);
  });
});



// default route
app.get("/", async (req, res) => {
  res.send("Welcome to the voice calling API!");
});

// Static folder
// const __dirpathname = path.resolve()
// app.use('/public', express.static(path.join(__dirpathname, './public')))

const peerServer = ExpressPeerServer(server, {});

app.use("/peerjs", peerServer);

server.listen(APP_PORT, () => {
  console.log(`Server started on port ${APP_PORT}`);
});
