const multer = require('multer');
const storage = require('../tools/storage');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp'
};

const memStorage = multer.memoryStorage();
const upload = multer({ storage: memStorage }).single('file');

module.exports = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    const extension = MIME_TYPES[req.file.mimetype];
    if (!extension) {
      return res.status(400).json({ message: 'Extension de fichier incorrecte.' });
    }

    const filename = `${req.userId}.${extension}`;
    const relativePath = `profils/${filename}`;

    req.file.filename = filename;

    try {
      await storage.uploadFile(relativePath, req.file.buffer);
    } catch (err2) {
      console.error('[MinIO upload] addProfil:', err2.message);
    }

    next();
  });
};
