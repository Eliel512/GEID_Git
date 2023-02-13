const express = require('express');
const router = express.Router();
const coverCtrl = require('../controllers/mediaLibrary/cover');
const multer = require ('../middleware/addCover');

router.get('/', coverCtrl.getAll);
router.post('/', multer, coverCtrl.addOne);
router.post('/set', coverCtrl.setCover);
router.delete('/:name', coverCtrl.deleteOne);

module.exports = router;
