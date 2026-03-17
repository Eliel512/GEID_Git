/**
 * app.js — Configuration de l'application Express
 *
 * - Connexion MongoDB via Mongoose
 * - Middlewares globaux (CORS, logging, compression, body parsing)
 * - Journalisation des requêtes en base de données
 * - Montage des routes API et admin
 * - Service des fichiers statiques (archives, profils, workspace…)
 * - Chargement des applications frontend (geid-front-config-platform)
 */

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const moment = require("moment");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");
const auth = require("./middleware/users/auth");
const adminAuth = require("./middleware/adminAuth");
const RequestLog = require("./models/request_log");
const GEID_FRONT_CONFIG_PLATFORM = require("./public/geid-front-config-platform");
const swaggerDocs = require("./docs");

// ─── Utilitaire : extraction de l'IP client ───────────────────────────────────

/**
 * Extrait l'adresse IP réelle du client en tenant compte
 * des proxies et des en-têtes X-Real-IP.
 * @param {import('express').Request} req
 * @returns {string}
 */
function getIp(req) {
  let ip = req.connection.remoteAddress;
  ip = ip.replace("::ffff:", ""); // supprime le préfixe IPv6 mapped IPv4

  // Pour les adresses passant par un proxy connu, utiliser X-Real-IP
  if (ip == "143.198.110.104" || ip == "127.0.0.1") {
    ip = req.headers["X-Real-IP"];
  }

  return ip;
}

// ─── Initialisation de l'application Express ─────────────────────────────────

app = express();

// Indique à Express qu'il est derrière un proxy (Nginx, etc.)
app.set("trust proxy", true);

// ─── Morgan : logging HTTP ────────────────────────────────────────────────────

// Token personnalisé pour afficher l'IP client dans les logs
morgan.token("clientIp", function (req, res) {
  return getIp(req);
});

// ─── Mongoose : connexion à MongoDB ──────────────────────────────────────────

mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() =>
    console.log(
      "Connexion à MongoDB échouée !\nVeuillez entrez une adresse correcte dans la variable d'environnement MONGODB_URI"
    )
  );

// ─── Middlewares de traitement des requêtes ───────────────────────────────────

// Parse les corps de requête JSON
app.use(express.json());

// Parse les corps de requête URL-encoded (formulaires HTML)
app.use(express.urlencoded({ extended: true }));

// En-têtes CORS : autorise toutes les origines et méthodes
// Note : Access-Control-Allow-Credentials ne peut pas être "true" avec origin "*"
// (violation de la spec CORS — les navigateurs l'ignorent de toute façon).
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use(cors());

// Logger HTTP avec IP client personnalisée
app.use(
  morgan(function (tokens, req, res) {
    return [
      tokens.clientIp(req, res),
      "-",
      "-",
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  })
);

// Compression gzip/deflate des réponses
app.use(compression());

// ─── Journalisation analytique en base de données ────────────────────────────

/**
 * Après chaque réponse, enregistre les métriques de la requête dans MongoDB.
 * Les routes d'analytics et les assets statiques sont exclus pour éviter les boucles.
 */
app.use((req, res, next) => {
  let requestTime = Date.now();
  res.on("finish", () => {
    // Ne pas journaliser les routes de suivi ni les fichiers statiques
    if (
      req.path === "/analytics" ||
      req.path.startsWith("/imgs") ||
      req.path.startsWith("/static")
    ) {
      return;
    }

    RequestLog.create({
      url: req.path,
      method: req.method,
      responseTime: (Date.now() - requestTime) / 1000, // en secondes
      day: moment(requestTime).format("dddd"),
      hour: moment(requestTime).hour(),
    });
  });
  next();
});

// ─── Fichiers statiques ───────────────────────────────────────────────────────

app.use("/ARCHIVES", express.static(path.join(__dirname, "ARCHIVES")));
app.use("/profils", express.static(path.join(__dirname, "profils")));
app.use("/workspace", express.static(path.join(__dirname, "workspace")));
app.use("/salon", express.static(path.join(__dirname, "salon")));
app.use("/ressources", express.static(path.join(__dirname, "ressources")));

// ─── Routes API & Admin ───────────────────────────────────────────────────────

// Routes publiques/authentifiées de l'API
app.use("/api", apiRoutes);

// Routes admin : double vérification auth JWT + rôle admin
app.use("/admin", auth, adminAuth, adminRoutes);

// Documentation Swagger UI (répertoire docs/)
app.use("/api-docs", swaggerDocs);

// Route analytics : affiche un tableau de bord des requêtes
app.get("/analytics", (req, res, next) => {
  require("./analytics_service")
    .getAnalytics()
    .then((analytics) =>
      res.render("analytics", { analytics: JSON.stringify(analytics) })
    )
    .catch((error) => {
      console.log(error);
      res.redirect("/");
    });
});

// ─── Applications frontend ────────────────────────────────────────────────────

// Charge les SPA frontend définies dans public/apps.json
GEID_FRONT_CONFIG_PLATFORM(app);

module.exports = app;
