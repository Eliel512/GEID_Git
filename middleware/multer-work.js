const multer = require('multer');
const mime = require('mime-types');
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

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const path = "workspace/"+req.body.userId+"/"+req.body.path;
    callback(null, path);
  },
  filename: (req, file, callback) => {
    const name = req.body.filename.split(' ').join('_');
    const extension = mime.extension(file.mimetype);
    if(!extension){
      throw 'Invalid file type';
    }
    /* + '.' + extension*/
    callback(null, name + '.' + extension);
  }
});

module.exports = multer({storage: storage}).single('file');