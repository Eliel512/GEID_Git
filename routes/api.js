const express = require('express');
const router = express.Router();
const stuffRoutes = require('./stuff');
const userRoutes = require('./user.routes');
const chatRoutes = require('./chat');
//const io = require('../server');
const auth = require('../middleware/users/auth');

router.use('/auth', userRoutes);
router.use('/stuff', stuffRoutes);
router.use('/chat', chatRoutes);

module.exports = router;