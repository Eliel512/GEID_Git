const express = require('express');
const router = express.Router();

const archiveCtrl = require('../controllers/archive');

router.get('/:role', archiveCtrl.getAllPublic);

module.exports = router;