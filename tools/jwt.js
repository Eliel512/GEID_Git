const JWT = require("jsonwebtoken");

const jwt = {
  /**
   * @param {Object} payload
   * @param {{expiresIn?: string|number}} [options]
   */
  sign: (payload, { expiresIn = "24h" }) => {
    return JWT.sign(payload, process.env.TOKEN_KEY, { expiresIn });
  },
  /**
   * @param {string} token
   * @returns {Object>}
   * */
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
