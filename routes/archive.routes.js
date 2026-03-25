const express = require('express');
const router = express.Router();

const invalidRoutes = require('./invalid.routes');
const eventRoutes = require('./event.routes');
const invalidAuth = require('../middleware/archives/auth');
const postOneMiddleware = require('../middleware/archives/postOne');

const archiveCtrl = require('../controllers/archives/archive');
const getAll = require('../controllers/archives/getAll');
const getAllValidate = require('../controllers/archives/getAllValidate');
const getAllValidateMiddleware = require('../middleware/archives/getAllValidate');
const postOne = require('../controllers/archives/postOne');
const postDirect = require('../controllers/archives/postDirect');
const lifecycle = require('../controllers/archives/lifecycle');
const setDua = require('../controllers/archives/dua');
const checkWriteAccess = require('../middleware/archives/checkWriteAccess');
const checkReadAccess  = require('../middleware/archives/checkReadAccess');
const multerArchive = require('../middleware/archives/multer-archive');
const search = require('../controllers/archives/search');
const getFile = require('../controllers/archives/getFile');
const generateManualPdf = require('../controllers/archives/generateManualPdf');
const usersCtrl = require('../controllers/archives/users');
const dashPrefsCtrl = require('../controllers/archives/dashboardPrefs');

router.use('/invalid', invalidAuth, invalidRoutes);
router.use('/event', eventRoutes);

// ── Préférences dashboard — AVANT /:role ────
router.get('/prefs/dashboard',      dashPrefsCtrl.get);
router.put('/prefs/dashboard',      dashPrefsCtrl.save);
router.delete('/prefs/dashboard',   dashPrefsCtrl.reset);

// ── Gestion des utilisateurs (cadre organique) — AVANT /:role ────
router.get('/stats/global',             usersCtrl.getGlobalStats);
router.get('/users',                    usersCtrl.getUsers);
router.get('/users/:id/stats',          usersCtrl.getUserStats);
router.get('/users/:id/activity',       usersCtrl.getUserActivity);
router.patch('/users/:id/toggle',       usersCtrl.toggleActive);
router.put('/users/:id/role',           usersCtrl.assignRole);
router.get('/users/:id',                usersCtrl.getOneUser);
router.put('/users/:id/permissions',    usersCtrl.setPermissions);
router.get('/roles',                    usersCtrl.getRoles);
router.get('/auths',                    usersCtrl.getAuths);

router.get('/file/:id', checkReadAccess, getFile);    // fichier archive authentifié + vérifié par rôle
router.get('/manual/pdf', generateManualPdf);       // PDF manuel utilisateur (fallback serveur)
router.get('/archived', getAllValidateMiddleware, getAllValidate);
router.post('/upload', multerArchive, postDirect); // direct file upload (auth via parent router)
router.get('/search', search);                      // unified full-text search — AVANT /:role
router.patch('/:id/lifecycle', lifecycle);          // lifecycle transitions
router.put('/:id/dua', checkWriteAccess, setDua);   // configure DUA parameters
router.get('/:role', getAll);
router.post('/', postOneMiddleware, postOne);
router.put('/:id', checkWriteAccess, archiveCtrl.modify);
router.delete('/:id', checkWriteAccess, archiveCtrl.delete);

module.exports = router;