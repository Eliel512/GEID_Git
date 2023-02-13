const express = require('express');
const router = express.Router();

const filmCtrl = require('../controllers/mediaLibrary/film');
const multer = require('../middleware/multer-config');

router.get('/', filmCtrl.getAll);
router.post('/', filmCtrl.create);
router.get('/:id', filmCtrl.getOne);
router.put('/', multer, filmCtrl.modify);
router.delete('/', filmCtrl.deleteAll);
router.delete('/:id', filmCtrl.delete);

module.exports = router;