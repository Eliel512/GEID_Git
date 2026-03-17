/**
 * server.js — Point d'entrée principal de l'application
 *
 * Crée le serveur HTTP, attache Socket.io, puis démarre l'écoute.
 * Le clustering multi-process est géré en dehors par PM2 (ecosystem.config.js).
 */

require("dotenv").config();

const http = require("http");
const app = require("./app");
const socketServer = require("./socket");

// ─── Configuration du port ────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== "production";

/**
 * Normalise la valeur de port : retourne un entier, une chaîne (pipe),
 * ou false si la valeur est invalide.
 * @param {string} val
 * @returns {number|string|false}
 */
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;       // pipe nommé (ex: /tmp/sock)
  if (port >= 0) return port;        // port TCP valide
  return false;
};

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

// ─── Gestion des erreurs de démarrage ─────────────────────────────────────────

/**
 * Gestionnaire d'erreurs pour les erreurs de bind du serveur HTTP.
 * @param {NodeJS.ErrnoException} error
 */
const errorHandler = (error) => {
  if (error.syscall !== "listen") throw error;

  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port: " + port;

  switch (error.code) {
    case "EACCES":
      // Port < 1024 sans les droits root
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
      break;
    case "EADDRINUSE":
      // Port déjà utilisé par un autre processus
      console.error(bind + " is already in use.");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// ─── Création du serveur ───────────────────────────────────────────────────────

const server = http.createServer(app);

// Attache Socket.io au serveur HTTP
socketServer.registerSocketServer(server);

// Démarre l'écoute — PM2 fork mode crée autant de process que défini dans ecosystem.config.js
server.listen(port);

// ─── Événements du serveur ────────────────────────────────────────────────────

server.on("error", errorHandler);

server.on("listening", () => {
  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port " + port;
  console.log(
    `Node ${isDev ? "dev server" : "worker " + process.pid} : Listening on ${bind}`
  );
});

module.exports = server;
