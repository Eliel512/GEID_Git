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
const multerArchive = require('../middleware/archives/multer-archive');
const search = require('../controllers/archives/search');
const generateManualPdf = require('../controllers/archives/generateManualPdf');
const usersCtrl = require('../controllers/archives/users');

router.use('/invalid', invalidAuth, invalidRoutes);
router.use('/event', eventRoutes);

// ── Gestion des utilisateurs (cadre organique) — AVANT /:role ────
router.get('/users',                    usersCtrl.getUsers);
router.get('/users/:id',                usersCtrl.getOneUser);
router.put('/users/:id/permissions',    usersCtrl.setPermissions);
router.get('/roles',                    usersCtrl.getRoles);
router.get('/auths',                    usersCtrl.getAuths);

router.get('/manual/pdf', generateManualPdf);       // PDF manuel utilisateur (fallback serveur)
router.get('/archived', getAllValidateMiddleware, getAllValidate);
router.post('/upload', checkWriteAccess, multerArchive, postDirect); // direct file upload
router.get('/search', search);                      // unified full-text search — AVANT /:role
router.patch('/:id/lifecycle', lifecycle);          // lifecycle transitions
router.put('/:id/dua', checkWriteAccess, setDua);   // configure DUA parameters
router.get('/:role', getAll);
router.post('/', postOneMiddleware, postOne);
router.put('/:id', checkWriteAccess, archiveCtrl.modify);
router.delete('/:id', checkWriteAccess, archiveCtrl.delete);

module.exports = router;