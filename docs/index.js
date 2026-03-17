'use strict';

/**
 * docs/index.js — Routeur ReDoc
 *
 * Monte l'interface ReDoc sur /api-docs.
 * La spécification OpenAPI complète est définie dans docs/swagger.js.
 *
 * Usage dans app.js :
 *   const swaggerDocs = require('./docs');
 *   app.use('/api-docs', swaggerDocs);
 */

const express     = require('express');
const redoc       = require('redoc-express');
const swaggerSpec = require('./swagger');

const router = express.Router();

// Expose le spec brut en JSON (ReDoc le charge depuis cette URL)
router.get('/spec.json', (req, res) => res.json(swaggerSpec));

// Interface ReDoc
router.get(
  '/',
  redoc({
    title:   'GEID API Docs',
    specUrl: '/api-docs/spec.json',
    redocOptions: {
      theme: {
        colors: { primary: { main: '#1976d2' } },
      },
      hideDownloadButton: false,
      expandResponses:    '200,201',
      sortPropsAlphabetically: true,
    },
  })
);

module.exports = router;
