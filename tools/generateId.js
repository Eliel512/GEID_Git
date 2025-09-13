const crypto = require("crypto");

/**
 * @param {number} char
 * @returns {string}
 */
module.exports = (char) => {
  const uid = crypto.randomUUID();
  const hash = crypto.createHash("sha1").update(uid).digest("hex");
  return hash.slice(0, char);
};
