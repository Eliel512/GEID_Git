const express = require('express');

const router = express.Router();
const workimgCtrl = require('../controllers/workspace');
const multer = require('../middleware/multer-config');

router.get('/:data', workimgCtrl.getAll);
router.post('/:data', multer, workimgCtrl.create);
//router.get('/:id', workimgCtrl.getOne);
router.put('/:data', multer, workimgCtrl.modify);
//router.get('/:path', workimgCtrl.download);
router.delete('/:data', workimgCtrl.delete);

module.exports = router;