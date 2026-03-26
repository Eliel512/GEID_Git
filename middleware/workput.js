const storage = require('../tools/storage');

module.exports = async (req, res, next) => {
  try {
    const userId = res.locals.userId || req.body.userId;
    const subPath = req.body.path || '';
    const filename = req.body.oldfilename;
    if (!filename) return next();

    const parts = ['workspace', userId, subPath, filename].filter(Boolean);
    const relPath = parts.join('/');

    // Delete old file from MinIO before overwrite
    await storage.deleteFile(relPath).catch(() => {});
    next();
  } catch {
    next();
  }
};
