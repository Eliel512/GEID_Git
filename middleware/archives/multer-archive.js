'use strict';

const multer = require('multer');

/**
 * Multer middleware — memory storage so the controller can write
 * to the correct path using res.locals.userId.
 * Max file size: 50 MB.
 */
module.exports = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
}).single('file');
