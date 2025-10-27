require("dotenv").config();
const http = require("http");
const app = require("./app");
const socketServer = require("./socket");
const { Server } = require("socket.io");
const { setupWorker } = require("@socket.io/sticky");
const { createAdapter } = require("@socket.io/cluster-adapter");

const isDev = process.env.NODE_ENV !== "production";

const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const PORT = normalizePort(process.env.PORT || "3000");
app.set("port", PORT);

// Serveur HTTP pour ce worker
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Cluster adapter pour partager messages entre workers
io.adapter(createAdapter());

// Sticky worker
setupWorker(io);

// Initialisation  SocketStore + handlers
socketServer.registerSocketServer(server);

// Gestion des erreurs
const errorHandler = (error) => {
  if (error.syscall !== "listen") throw error;
  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port: " + PORT;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
    default:
      throw error;
  }
};

server.on("error", errorHandler);

server.listen(PORT, () => {
  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port: " + PORT;
  console.log(`Worker ${process.pid} listening on ${bind} | isDev=${isDev}`);
});
