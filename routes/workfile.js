const express = require('express');

const router = express.Router();
const workfileCtrl = require('../controllers/workfile');
const multer = require('../middleware/multer-config');

const setPath = (req, res, next) => {
    req.path = `../workspace/${req.body.userId}/${req.params.path}`;
    next();
};

router.get('/', workfileCtrl.getAll);
router.post('/:path', setPath, multer, workfileCtrl.create);
router.get('/:id', workfileCtrl.getOne);
router.put('/:id', setPath, multer, workfileCtrl.modify);
router.get('/:path', workfileCtrl.download);
router.delete('/:id', workfileCtrl.delete);

module.exports = router;