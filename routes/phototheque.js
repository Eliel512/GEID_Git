const express = require('express');
const router = express.Router();

const imageCtrl = require('../controllers/image');
const multer = require('../middleware/multer-config');

router.get('/', imageCtrl.getAll);
router.post('/', multer, imageCtrl.create);
router.get('/:id', imageCtrl.getOne);
router.put('/:id', multer, imageCtrl.modify);
router.delete('/', imageCtrl.deleteAll);
router.delete('/:id', imageCtrl.delete);

module.exports = router;