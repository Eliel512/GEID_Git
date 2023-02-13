const express = require('express');
const router = express.Router();

const validate = require('../middleware/archives/invalid');

const getAll = require('../controllers/invalids/getAll');
const addOne = require('../controllers/invalids/addOne');
const deleteOne = require('../controllers/invalids/deleteOne');

router.get('/', getAll);
router.post('/', validate, addOne);
//router.post('/set', setCover);
router.delete('/:id', deleteOne);

module.exports = router;