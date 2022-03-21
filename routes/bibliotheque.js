const express = require('express');
const router = express.Router();

const bookCtrl = require('../controllers/book');
const multer = require('../middleware/multer-config');
//const auth = require('../middleware/mediaAuth');

router.get('/', bookCtrl.getAll);
router.post('/', /*auth, multer,*/ bookCtrl.create);
router.post('/cover', /*auth, multer,*/ bookCtrl.addCover);
router.get('/:id', bookCtrl.getOne);
router.put('/', /*auth,*/ multer, bookCtrl.modify);
router.delete('/', bookCtrl.deleteAll);
router.delete('/:id', bookCtrl.delete);

module.exports = router;