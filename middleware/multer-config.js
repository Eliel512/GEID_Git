const multer = require('multer');
const path = require('path');
const storage = require('../tools/storage');

const memStorage = multer.memoryStorage();
const upload = multer({ storage: memStorage }).single('file');

module.exports = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    const userInput = (req.body.path || '').replace(/\.\./g, '');
    const filename = req.file.originalname;
    const relativePath = path.posix.join('ressources', userInput, filename);

    req.file.filename = filename;

    try {
      await storage.uploadFile(relativePath, req.file.buffer);
    } catch (err2) {
      console.error('[MinIO upload] multer-config:', err2.message);
    }

    next();
  });
};
