/**
 * redisClient.js — Client Redis partagé dans toute l'application
 *
 * Se connecte automatiquement au démarrage du module.
 * Utilisé par socketStore.js pour stocker les connexions socket
 * de manière distribuée entre les workers PM2.
 *
 * Variable d'environnement : REDIS_URL (défaut : redis://localhost:6379)
 */

const { createClient } = require("redis");

// ─── Création et connexion du client ─────────────────────────────────────────

/** @type {import('redis').RedisClientType} */
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connexion asynchrone au démarrage du module
(async () => {
  await redisClient.connect();
})();

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = redisClient;

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/**
 * Supprime toutes les clés Redis correspondant au pattern donné.
 * Utile pour nettoyer les données obsolètes au démarrage.
 * @async
 * @param {string} pattern - Pattern Redis (ex: "SOCKET_DATA:*")
 * @returns {Promise<void>}
 */
const deleteKeys = async (pattern) => {
  if (!pattern) return;
  const keys = await redisClient.keys(pattern);
  if (keys.length) await redisClient.del(keys);
};

module.exports.deleteKeys = deleteKeys;
