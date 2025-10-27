// const jwt = require("jsonwebtoken");
const serverStore = require("../serverStore");
const jwt = require("../tools/jwt");

module.exports = async (socket, next) => {
  const token = socket.handshake.query?.token;
  const { _id: userId, isGuest } =
    jwt.verify(token, process.env.TOKEN_KEY) || {};
  let error;
  if (!userId) error = new Error("Authentication error");
  else {
    socket.userId = userId;
    socket.isGuest = isGuest || false;
  }
  next(error);
};
