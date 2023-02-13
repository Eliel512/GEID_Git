const express = require('express');
const router = express.Router();

const auth = require('../middleware/archives/auth');

const getAll = require('../controllers/events/getAll');
const getAllForOne = require('../controllers/events/getAllForOne');
const addOne = require('../controllers/events/addOne');
const deleteOne = require('../controllers/events/deleteOne');

router.get('/', auth, getAll);
router.get('/:role', getAllForOne);
router.post('/', auth, addOne);
//router.post('/set', setCover);
router.delete('/:id', auth, deleteOne);

module.exports = router;