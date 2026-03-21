'use strict';

/**
 * routes/physical.routes.js
 *
 * Routeur Express — Archivage Physique
 *
 * Expose l'ensemble des routes REST de la hiérarchie physique d'archivage.
 * Ce routeur est monté sur `/api/stuff/archives/physical` dans routes/stuff.js,
 * derrière le middleware d'authentification JWT (`auth`).
 *
 * ─── Hiérarchie physique gérée ───────────────────────────────────────────────
 *
 *   Conteneur   → élément de stockage racine (armoire, salle…)
 *       └── Étagère   → subdivision du conteneur (rayon, travée…)
 *               └── Étage     → niveau de l'étagère, lié à une unité administrative
 *                       └── Classeur  → porte-dossiers spécialisé (nature + capacité)
 *                               └── Dossier   → dossier physique avec QR code
 *                                       └── Archive → document numérique (archive.model.js)
 *
 * ─── Toutes les routes sont protégées par JWT ────────────────────────────────
 *   Le middleware `auth` est appliqué en amont dans stuff.js :
 *     router.use('/archives/physical', auth, physicalRoutes)
 *   res.locals.userId est donc disponible dans tous les contrôleurs.
 *
 * ─── Table des routes ────────────────────────────────────────────────────────
 *
 *   CONTENEURS
 *     GET    /containers                       → liste tous les conteneurs
 *     GET    /containers/:id                   → détail d'un conteneur
 *     POST   /containers                       → crée un conteneur
 *     PUT    /containers/:id                   → modifie un conteneur
 *     DELETE /containers/:id                   → supprime un conteneur
 *
 *   ÉTAGÈRES
 *     GET    /shelves                          → liste toutes les étagères
 *     GET    /shelves/container/:containerId   → étagères d'un conteneur
 *     GET    /shelves/:id                      → détail d'une étagère
 *     POST   /shelves                          → crée une étagère
 *     PUT    /shelves/:id                      → modifie une étagère
 *     DELETE /shelves/:id                      → supprime une étagère
 *
 *   ÉTAGES
 *     GET    /floors                           → liste tous les étages
 *     GET    /floors/shelf/:shelfId            → étages d'une étagère
 *     GET    /floors/:id                       → détail d'un étage
 *     POST   /floors                           → crée un étage
 *     PUT    /floors/:id                       → modifie un étage
 *     DELETE /floors/:id                       → supprime un étage
 *
 *   CLASSEURS
 *     GET    /binders                          → liste tous les classeurs
 *     GET    /binders/floor/:floorId           → classeurs d'un étage
 *     GET    /binders/:id                      → détail + taux de remplissage
 *     POST   /binders                          → crée un classeur
 *     PUT    /binders/:id                      → modifie un classeur
 *     DELETE /binders/:id                      → supprime (refusé si non vide)
 *
 *   DOSSIERS (records)
 *     GET    /records                          → liste tous les dossiers
 *     GET    /records/binder/:binderId         → dossiers d'un classeur
 *     GET    /records/qr/:qrCode               → retrouve un dossier par QR code
 *     GET    /records/:id                      → détail avec hiérarchie complète
 *     POST   /records                          → crée (valide nature + capacité)
 *     PUT    /records/:id                      → modifie (re-valide si besoin)
 *     DELETE /records/:id                      → supprime un dossier
 *
 * ─── Ordre des routes — IMPORTANT ───────────────────────────────────────────
 *   Les routes avec segments fixes (ex: /shelves/container/:containerId) sont
 *   déclarées AVANT les routes avec paramètre générique (:id) pour éviter
 *   qu'Express ne confonde "container" avec un _id MongoDB.
 */

const express = require('express');
const router  = express.Router();

const containerCtrl    = require('../controllers/archives/physical/container');
const shelfCtrl        = require('../controllers/archives/physical/shelf');
const floorCtrl        = require('../controllers/archives/physical/floor');
const binderCtrl       = require('../controllers/archives/physical/binder');
const recordCtrl       = require('../controllers/archives/physical/record');
const recordArchives   = require('../controllers/archives/physical/record-archives');

// ─── Routes des conteneurs ────────────────────────────────────────────────────

router.get   ('/containers',     containerCtrl.getAll);
router.post  ('/containers',     containerCtrl.create);
router.get   ('/containers/:id', containerCtrl.getOne);
router.put   ('/containers/:id', containerCtrl.update);
router.delete('/containers/:id', containerCtrl.delete);

// ─── Routes des étagères ──────────────────────────────────────────────────────
// Remarque : /shelves/container/:containerId avant /shelves/:id (ordre critique)

router.get   ('/shelves',                          shelfCtrl.getAll);
router.post  ('/shelves',                          shelfCtrl.create);
router.get   ('/shelves/container/:containerId',   shelfCtrl.getAllByContainer);
router.get   ('/shelves/:id',                      shelfCtrl.getOne);
router.put   ('/shelves/:id',                      shelfCtrl.update);
router.delete('/shelves/:id',                      shelfCtrl.delete);

// ─── Routes des étages ────────────────────────────────────────────────────────
// Remarque : /floors/shelf/:shelfId avant /floors/:id (ordre critique)

router.get   ('/floors',                 floorCtrl.getAll);
router.post  ('/floors',                 floorCtrl.create);
router.get   ('/floors/shelf/:shelfId',  floorCtrl.getAllByShelf);
router.get   ('/floors/:id',             floorCtrl.getOne);
router.put   ('/floors/:id',             floorCtrl.update);
router.delete('/floors/:id',             floorCtrl.delete);

// ─── Routes des classeurs ─────────────────────────────────────────────────────
// Remarque : /binders/floor/:floorId avant /binders/:id (ordre critique)

router.get   ('/binders',                binderCtrl.getAll);
router.post  ('/binders',                binderCtrl.create);
router.get   ('/binders/floor/:floorId', binderCtrl.getAllByFloor);
router.get   ('/binders/:id',            binderCtrl.getOne);
router.put   ('/binders/:id',            binderCtrl.update);
router.delete('/binders/:id',            binderCtrl.delete);

// ─── Routes des dossiers (records) ───────────────────────────────────────────
// Remarque : routes fixes (/binder/:binderId et /qr/:qrCode) avant /:id

router.get   ('/records',                    recordCtrl.getAll);
router.post  ('/records',                    recordCtrl.create);
router.get   ('/records/binder/:binderId',   recordCtrl.getAllByBinder);
router.get   ('/records/qr/:qrCode',         recordCtrl.getByQrCode);
router.get   ('/records/:id/archives',       recordArchives);        // archives liées — AVANT /:id
router.get   ('/records/:id',                recordCtrl.getOne);
router.put   ('/records/:id',                recordCtrl.update);
router.delete('/records/:id',                recordCtrl.delete);

module.exports = router;
