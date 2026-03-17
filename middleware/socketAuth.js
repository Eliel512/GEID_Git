/**
 * middleware/socketAuth.js — Authentification JWT pour les connexions Socket.io
 *
 * Appliqué via io.use() avant tout événement socket.
 * Vérifie le token transmis dans socket.handshake.query.token.
 *
 * En cas de succès, injecte sur l'objet socket :
 *   - socket.userId  : identifiant MongoDB de l'utilisateur
 *   - socket.isGuest : true si l'utilisateur est un invité temporaire
 *
 * En cas d'échec, la connexion est rejetée avec une erreur d'authentification.
 */

const jwt = require("../tools/jwt");

/**
 * @param {import('socket.io').Socket} socket
 * @param {(err?: Error) => void} next
 */
module.exports = async (socket, next) => {
  // Récupère le token depuis les paramètres de connexion
  // Exemple côté client : io({ query: { token: "..." } })
  const token = socket.handshake.query?.token;

  // Vérifie et décode le token (retourne null si invalide)
  const { _id: userId, isGuest } =
    jwt.verify(token, process.env.TOKEN_KEY) || {};

  let error;
  if (!userId) {
    // Token absent ou invalide → connexion refusée
    error = new Error("Authentication error");
  } else {
    // Token valide → attache les infos utilisateur au socket
    socket.userId = userId;
    socket.isGuest = isGuest || false;
  }

  next(error);
};
