const JWT = require("jsonwebtoken");
const { isPlainObject } = require("lodash");

const jwt = {
  /**
   * @param {Object} payload
   * @param {{expiresIn?: string|number}} [options]
   */
  sign: (payload, opt = {}) => {
    if (isPlainObject(opt)) opt.expiresIn = opt.expiresIn || "24h";
    return JWT.sign(payload, process.env.TOKEN_KEY, opt);
  },
  /**
   * @param {string} token
   * @returns {Object>}
   */
  verify: (token) => {
    let data = false;
    try {
      data = JWT.verify(token, process.env.TOKEN_KEY);
    } catch (e) {
      console.error(e);
    }
    return data;
  },
};

module.exports = jwt;
