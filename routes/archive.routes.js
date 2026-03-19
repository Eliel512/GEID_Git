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

router.use('/invalid', invalidAuth, invalidRoutes);
router.use('/event', eventRoutes);

router.get('/archived', getAllValidateMiddleware, getAllValidate);
router.get('/:role', getAll);
router.post('/', postOneMiddleware, postOne);
router.put('/:id', archiveCtrl.modify);
router.delete('/:id', archiveCtrl.delete);

module.exports = router;