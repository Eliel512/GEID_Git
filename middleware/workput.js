const fs = require('fs');
const storage = require('../tools/storage');

const MIME_TYPES = {
    'text/plain': 'text',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'audio/3gpp': '3gp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'video/m4v': 'm4v',
    'video/mpeg': 'mpeg',
    'video/webm': 'webm',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/epub+zip': 'epub',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/rtf': 'rtf'
  };  

module.exports = (req, res, next) => {
    const extension = MIME_TYPES[req.file.mimetype];
    const filename = req.body.oldfilename.split(' ').join('_') + '.' + extension;
    const userId = req.body.userId || res.locals.userId;
    const subPath = req.body.path || '';
    const relPath = `workspace/${userId}/${subPath}/${filename}`.replace(/\/+/g, '/');
    try {
        fs.accessSync(`./${relPath}`, fs.constants.F_OK);
        fs.unlinkSync(`./${relPath}`);
        storage.deleteFile(relPath).catch(e => console.error('[MinIO] workput:', e.message));
        next();
      } catch(err) {
        next();
      }
}