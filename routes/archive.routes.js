const express = require('express');
const router = express.Router();

const invalidRoutes = require('./invalid.routes');
const eventRoutes = require('./event.routes');
const invalidAuth = require('../middleware/archives/auth');

//const archiveCtrl = require('../controllers/archives/archive');
const getAll = require('../controllers/archives/getAll');
const postOne = require('../controllers/archives/postOne');

router.use('/invalid', invalidAuth, invalidRoutes);
router.use('/event', eventRoutes);

router.get('/:role', getAll);
router.post('/', postOne);
//router.post('/cover', multerCover, archiveCtrl.addCover);
//router.get('/:id', archiveCtrl.getOne);
//router.get('/types/:subtype', archiveCtrl.getByType);
//router.put('/', multer, archiveCtrl.modify);
//router.delete('/', archiveCtrl.deleteAll);
//router.get('/struct/:struct', archiveCtrl.getStruct);
//router.delete('/:id', archiveCtrl.delete);

module.exports = router;