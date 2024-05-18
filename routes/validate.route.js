const express = require('express');
const router = express.Router();

const validateMiddleware = require('../middleware/archives/validate');
const getAllvalidateMiddleware = require('../middleware/archives/getAllValidate');

const validate = require('../controllers/archives/validate');
const getAll = require('../controllers/archives/getAllValidate');


router.get('/', getAllvalidateMiddleware, getAll);
router.post('/', validateMiddleware, validate);

module.exports = router;