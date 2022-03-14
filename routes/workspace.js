const express = require('express');

const router = express.Router();
const workCtrl = require('../controllers/workspace');
const multer = require('../middleware/multer-work');

router.get('/:data', workCtrl.getAll);
router.post('/', multer, workCtrl.create);
//router.get('/:id', workCtrl.getOne);
router.put('/', workCtrl.modify);
//router.get('/:path', workCtrl.download);
router.delete('/:data', workCtrl.delete);

module.exports = router;