/**
 * routes/api.js — Routeur principal de l'API REST
 *
 * Monté sur /api dans app.js.
 * Regroupe toutes les sous-routes publiques/authentifiées de l'application.
 *
 * Routes disponibles :
 *   /api/auth   → authentification et gestion des utilisateurs (user.routes.js)
 *   /api/stuff  → gestion des ressources métier (stuff.js)
 *   /api/chat   → messagerie et appels (chat.js)
 */

const express = require("express");
const router = express.Router();

const stuffRoutes = require("./stuff");
const userRoutes = require("./user.routes");
const chatRoutes = require("./chat");

router.use("/auth", userRoutes);
router.use("/stuff", stuffRoutes);
router.use("/chat", chatRoutes);

module.exports = router;
