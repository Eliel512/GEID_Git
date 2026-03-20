const express = require('express');

const router = express.Router();
const workCtrl = require('../controllers/workspace');
const multer = require('../middleware/multer-work');

// Dossiers — routes spécifiques avant les routes génériques /:data
router.post('/folder', workCtrl.createFolder);
router.put('/folder', workCtrl.renameFolder);
router.delete('/folder/:data', workCtrl.deleteFolder);

// Fichiers
router.get('/:data', workCtrl.getAll);
router.post('/', multer, workCtrl.create);
router.put('/', workCtrl.modify);
router.delete('/:data', workCtrl.delete);

module.exports = router;
