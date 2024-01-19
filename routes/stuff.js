const express = require('express');
const router = express.Router();
const auth = require('../middleware/users/auth');
const workAuth = require('../middleware/users/workAuth');

const workspaceRoutes = require('./workspace');
const archiveRoutes = require('./archive.routes');
const bookRoutes = require('./book.routes');
const filmRoutes = require('./film.routes');
const imageRoutes = require('./image.routes');
const frozenRoutes = require('./frozen');
const coverRoutes = require('./cover');

router.use('/workspace', auth, workAuth, workspaceRoutes);
router.use('/archives', auth, archiveRoutes);
router.use('/bibliotheque', bookRoutes);
router.use('/filmotheque', filmRoutes);
router.use('/phototheque', imageRoutes);
router.use('/frozen', auth, frozenRoutes);
router.use('/cover', auth, coverRoutes);

module.exports = router;