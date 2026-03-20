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

router.use('/invalid', invalidAuth, invalidRoutes);
router.use('/event', eventRoutes);

router.get('/archived', getAllValidateMiddleware, getAllValidate);
router.post('/upload', checkWriteAccess, multerArchive, postDirect); // direct file upload
router.patch('/:id/lifecycle', lifecycle);          // lifecycle transitions
router.put('/:id/dua', checkWriteAccess, setDua);   // configure DUA parameters
router.get('/:role', getAll);
router.post('/', postOneMiddleware, postOne);
router.put('/:id', checkWriteAccess, archiveCtrl.modify);
router.delete('/:id', checkWriteAccess, archiveCtrl.delete);

module.exports = router;