const express = require('express');
const router = express.Router();

const frozenCtrl = require('../controllers/frozen');

router.get('/:datas', frozenCtrl.getAllForOne);
router.post('/', frozenCtrl.addOne);
//router.put('/:datas', frozenCtrl.modify);
router.delete('/:datas', frozenCtrl.deleteOne);

module.exports = router;