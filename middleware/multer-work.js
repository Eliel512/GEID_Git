const multer = require('multer');
const mime = require('mime-types');
const storage = require('../tools/storage');

const memStorage = multer.memoryStorage();
const upload = multer({ storage: memStorage }).single('file');

module.exports = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    const name = req.body.filename;
    const extension = mime.extension(req.file.mimetype);
    if (!extension) {
      return res.status(400).json({ message: 'Type de fichier non reconnu.' });
    }

    const filename = name + '.' + extension;
    const subPath = req.body.path || '';
    const parts = ['workspace', req.body.userId, subPath, filename].filter(Boolean);
    const relativePath = parts.join('/');

    // Set filename on req.file since memoryStorage doesn't set it
    req.file.filename = filename;

    try {
      await storage.uploadFile(relativePath, req.file.buffer);
    } catch (err2) {
      console.error('[MinIO upload] multer-work:', err2.message);
    }

    next();
  });
};
