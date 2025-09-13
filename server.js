require("dotenv").config();

const http = require("http");
const cluster = require("cluster");
const numCPU = require("os").cpus().length;
const app = require("./app");
const socketServer = require("./socket");

const isDev = process.env.NODE_ENV !== "production";

const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const errorHandler = (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port: " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const server = http.createServer(app);
socketServer.registerSocketServer(server);

if (isDev && cluster.isMaster) {
  console.error(`Node cluster master ${process.pid} is running`);

  for (let i = 0; i < numCPU; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.error(
      `Node cluster worker 
      ${worker.process.pid} 
      exited: code ${code}, 
      signal: ${signal}`
    );
  });
} else {
  server.listen(port);
}

server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log(
    `Node ${
      isDev ? "dev server" : "cluster worker " + process.pid
    } : Listening on ${bind}`
  );
});

module.exports = server;
