/**
 * middleware/users/auth.js — Authentification JWT pour les routes HTTP
 *
 * Vérifie le token JWT transmis dans l'en-tête Authorization (Bearer).
 * Si valide, injecte le userId dans req et res.locals pour les handlers suivants.
 *
 * Exception : les routes de prévisualisation d'appel (/room/call/:id)
 * sont accessibles sans token pour permettre aux invités de rejoindre.
 */

const jwt = require("jsonwebtoken");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = (req, res, next) => {
  try {
    // Extrait le token depuis "Authorization: Bearer <token>" ou query param ?token=
    let token;
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }
    if (!token) throw new Error("No token");
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);
    const userId = decodedToken._id || decodedToken.userId;

    // Rend l'userId accessible aux middlewares et contrôleurs suivants
    res.locals.userId = userId;
    req.userId = userId;
    next();
  } catch {
    // Autorise l'accès anonyme aux pages de prévisualisation de salle d'appel
    // (ex: /room/call/abc123xyz) pour que les invités puissent rejoindre
    if (/^\/room\/call\/[a-zA-Z0-9]{9}$/.test(req.path)) {
      next();
    } else {
      res.status(401).json({ error: new Error("Invalid request") });
    }
  }
};
