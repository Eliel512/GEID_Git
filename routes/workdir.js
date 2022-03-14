const express = require('express');

const router = express.Router();
const workdirCtrl = require('../controllers/workdir');

router.get('/:path/', workdirCtrl.getOne);
router.post('/:path/', workdirCtrl.create);
router.put('/:path/:dir', workdirCtrl.modify);
router.delete('/:path', workdirCtrl.delete);

module.exports = router;