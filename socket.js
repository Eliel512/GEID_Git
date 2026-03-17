/**
 * socket.js — Initialisation du serveur Socket.io et enregistrement des événements
 *
 * - Crée l'instance Socket.io attachée au serveur HTTP
 * - Applique le middleware d'authentification JWT sur chaque connexion
 * - Délègue chaque événement socket à son handler métier correspondant
 *
 * Handlers métier :
 *   - handlers/socket.js   → messages directs, statut, appels P2P
 *   - handlers/room.js     → création/gestion des salles d'appel
 *   - handlers/room/room.js → logique avancée de rejoindre une salle
 *   - handlers/room/queryToJoin.js → demande/réponse d'accès à une salle
 *   - handlers/updates.js  → émission des mises à jour temps-réel (contacts, historique…)
 */

const auth = require("./middleware/socketAuth");
const socketHandler = require("./handlers/socket");
const roomHandler = require("./handlers/room");
const serverStore = require("./serverStore");
const socketStore = require("./socketStore");
const RoomHandler = require("./handlers/room/room");
const {
  requestJoinRoom,
  responseJoinRoom,
} = require("./handlers/room/queryToJoin");
const { updateContacts, updateCallHistory } = require("./handlers/updates");

/**
 * Crée et configure le serveur Socket.io sur le serveur HTTP fourni.
 * @param {import('http').Server} server
 * @returns {import('socket.io').Server}
 */
const registerSocketServer = (server) => {
  const { Server } = require("socket.io");

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Stocke l'instance io pour y accéder depuis d'autres modules
  serverStore.setSocketServerInstance(io);
  socketStore.setInstance(io);

  // ─── Authentification ───────────────────────────────────────────────────────
  // Vérifie le token JWT de chaque socket avant d'accepter la connexion
  io.use(auth).on("connection", async (socket) => {

    // ─── Connexion ──────────────────────────────────────────────────────────
    socketHandler.newConnectionHandler(socket, io);
    await socketStore.addClient(socket.id, socket.userId, socket);

    const numClients = await socketStore.getConnectedClientsCount();
    console.log("Connected clients:", numClients);

    // ─── Messagerie directe ─────────────────────────────────────────────────

    // Message texte entre deux utilisateurs
    socket.on("direct-message", (data) => {
      socketHandler.directMessageHandler(socket, data);
    });

    // Partage de fichier entre deux utilisateurs
    socket.on("direct-file", (data) => {
      socketHandler.directFileHandler(socket, data);
    });

    // Ouverture/fermeture d'une conversation directe
    socket.on("direct-chat", (data) => {
      socketHandler.directChatHandler(socket, data);
    });

    // ─── Messagerie en salle ─────────────────────────────────────────────────

    // Message envoyé dans une salle de chat
    socket.on("room-message", (data) => {
      socketHandler.roomMessageHandler(socket, data);
    });

    // ─── Appels & signalisation ──────────────────────────────────────────────

    // Message de signalisation dans un appel en cours
    socket.on("call-message", (data) => {
      roomHandler.callMessageHandler(socket, data);
    });

    // Initier un appel vers un autre utilisateur
    socket.on("call", (data) => {
      socketHandler.callHandler(socket, data);
    });

    // Décrocher un appel entrant
    socket.on("pick-up", (data) => {
      socketHandler.pickUpHandler(socket, data);
    });

    // L'appelé sonne
    socket.on("ringing", (data) => {
      roomHandler.ringHandler(socket, data);
    });

    // L'utilisateur est occupé
    socket.on("busy", (data) => {
      roomHandler.busyHandler(socket, data);
    });

    // Raccrocher / terminer un appel
    socket.on("hang-up", (data) => {
      roomHandler.hangUpHandler(socket, data);
    });

    // Signal WebRTC (ICE candidates, SDP offer/answer)
    socket.on("signal", (data) => {
      roomHandler.signal(socket, data);
    });

    // ─── Salles d'appel (rooms) ──────────────────────────────────────────────

    // Planifier une réunion
    socket.on("schedule", (data) => {
      roomHandler.scheduleHandler(socket, data);
    });

    // Créer une nouvelle salle d'appel
    socket.on("create", (data) => {
      roomHandler.createHandler(socket, data);
    });

    // Rejoindre une salle existante (ancien handler)
    socket.on("join", (data) => {
      roomHandler.joinRoom(socket, data);
    });

    // Accepter une invitation à rejoindre une salle
    socket.on("accept", (data) => {
      roomHandler.accept(socket, data);
    });

    // Quitter une salle
    socket.on("leave", (data) => {
      roomHandler.leaveRoom(socket, data);
    });

    // Modifier les paramètres d'une salle (titre, permissions…)
    socket.on("edit-room", (data) => {
      roomHandler.edit(socket, data);
    });

    // Rejoindre une salle (nouveau handler avec classe RoomHandler)
    socket.on("join-room", (data) => new RoomHandler(socket, data));

    // Demander l'accès à une salle verrouillée
    socket.on("request-join-room", (data) => requestJoinRoom(socket, data));

    // Répondre à une demande d'accès (accepter/refuser)
    socket.on("response-join-room", (data) => responseJoinRoom(socket, data));

    // ─── Présence & mises à jour ─────────────────────────────────────────────

    // Changer le statut en ligne/hors-ligne/absent
    socket.on("status", (data) => {
      socketHandler.statusHandler(socket, data);
    });

    // Demander la liste des contacts mise à jour
    socket.on("contacts", () => {
      updateContacts(socket.userId);
    });

    // Demander l'historique des dernières conversations
    socket.on("last", () => {
      socketHandler.lastHandler(socket.userId);
    });

    // Demander l'historique des appels
    socket.on("call-history", () => {
      updateCallHistory(socket);
    });

    // ─── Diagnostic réseau ───────────────────────────────────────────────────

    // Mesure du RTT (Round Trip Time) réseau
    socket.on("rtt-ping", (data) => {
      socketHandler.networkRttStat(socket, data);
    });

    // Ping de test (répond immédiatement)
    socket.on("ping", (data, callback) => {
      callback("C'est bon");
    });

    // ─── Déconnexion ─────────────────────────────────────────────────────────

    socket.on("disconnect", () => {
      socketHandler.disconnectHandler(socket);
      roomHandler.disconnectHandler(socket);
      socketStore.deleteClient(socket.id);
      console.log("bye disconnected !");
    });
  });

  return io;
};

module.exports = { registerSocketServer };
