const express = require('express');
const router = express.Router();

const archiveCtrl = require('../controllers/archive');
const multer = require('../middleware/multer-config');
const multerCover = require('../middleware/addCover');

router.get('/:role', archiveCtrl.getAllForOne);
router.post('/', archiveCtrl.create);
router.post('/cover', multerCover, archiveCtrl.addCover);
//router.get('/:id', archiveCtrl.getOne);
//router.get('/types/:subtype', archiveCtrl.getByType);
router.put('/', multer, archiveCtrl.modify);
router.delete('/', archiveCtrl.deleteAll);
router.get('/struct/:struct', archiveCtrl.getStruct);
router.delete('/:id', archiveCtrl.delete);

module.exports = router;