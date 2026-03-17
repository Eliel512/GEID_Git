/**
 * public/geid-front-config-platform.js — Chargement des applications frontend
 *
 * Lit la liste des SPA (Single Page Applications) définies dans apps.json
 * et monte chacune d'elles sur l'application Express :
 *   - Sert les fichiers statiques depuis le dossier de l'application
 *   - Redirige toutes les routes inconnues vers index.html (SPA routing côté client)
 *
 * Format d'une entrée dans apps.json :
 *   { "uri": "/app", "filesPath": "./public/geid-platform", "isRoot": false }
 *
 * Si isRoot est true, la route catch-all est "uri/*" au lieu de "uri"
 * pour capturer toutes les sous-routes de l'application racine.
 */

const express = require("express");
const path = require("path");
const apps = require("./apps.json");

/**
 * Normalise l'URL d'une application pour Express.
 * - Supprime le slash final si présent
 * - Si isRoot, ajoute "/*" pour capturer toutes les sous-routes (SPA routing)
 * - Si l'URL est vide et isRoot, retourne "*" (catch-all global)
 *
 * @param {string} appUrl  - L'URI définie dans apps.json
 * @param {boolean} isRoot - Indique si l'app doit capturer toutes les sous-routes
 * @returns {string}
 */
const modifyUrl = (appUrl = "", isRoot = false) => {
  let url = appUrl.trim();
  url = url.endsWith("/") ? url.slice(0, -1) : url; // supprime le slash final
  return isRoot ? (url === "" ? "*" : url + "/*") : url;
};

/**
 * Monte chaque application frontend sur l'instance Express fournie.
 * @param {import('express').Application} app
 */
module.exports = (app = express()) => {
  apps.forEach(({ uri, filesPath, isRoot }) => {
    const staticPath = express.static(path.resolve(filesPath));
    const appUrl = modifyUrl(uri, isRoot);

    // Sert les assets statiques (JS, CSS, images…)
    app.use(uri, staticPath);

    // Renvoie index.html pour toutes les routes (permet le routing côté client)
    app.get(appUrl, (_req, res) => {
      res.sendFile(`${path.resolve(filesPath)}/index.html`);
    });
  });
};
