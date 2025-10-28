const { createClient } = require("redis");

/**
 * @type {import('redis').RedisClientType}
 */
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
/**
 * @async
 * @returns {Promise<void>}
 */
(async () => {
  await redisClient.connect();
})();

/**
 * @type {import('redis').RedisClientType}
 */
module.exports = redisClient;

/**
 * @async
 * @param {string} pattern
 * @returns {Promise<void>}
 */
const deleteKeys = async (pattern) => {
  if (!pattern) return;
  const keys = await redisClient.keys(pattern);
  if (keys.length) await redisClient.del(keys);
};

module.exports.deleteKeys = deleteKeys;
