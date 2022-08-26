const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const workspaceRoutes = require('./workspace');
const archiveRoutes = require('./archive');
const publicRoutes = require('./public');
const bibliothequeRoutes = require('./bibliotheque');
const filmothequeRoutes = require('./filmotheque');
const photothequeRoutes = require('./phototheque');
const frozenRoutes = require('./frozen');
const coverRoutes = require('./cover');

router.use('/workspace', auth, workspaceRoutes);
router.use('/archives/public', publicRoutes);
router.use('/archives', auth, archiveRoutes);
router.use('/bibliotheque', bibliothequeRoutes);
router.use('/filmotheque', filmothequeRoutes);
router.use('/phototheque', photothequeRoutes);
router.use('/frozen', auth, frozenRoutes);
router.use('/cover', auth, coverRoutes);

module.exports = router;
