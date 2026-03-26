const express = require('express');
const router = express.Router();
const workCtrl = require('../controllers/workspace/index');
const multer = require('../middleware/multer-work');

// ── Recherche (avant /:data pour éviter le conflit) ─────────────────────────
router.get('/search', workCtrl.search);

// ── Récents ─────────────────────────────────────────────────────────────────
router.get('/recent/tags', workCtrl.getRecentTags);
router.get('/recent', workCtrl.getRecent);

// ── Favoris ─────────────────────────────────────────────────────────────────
router.get('/favorites', workCtrl.getFavorites);
router.patch('/favorite/:id', workCtrl.toggleFavorite);

// ── Corbeille ───────────────────────────────────────────────────────────────
router.get('/trash', workCtrl.getTrash);
router.patch('/trash/:id', workCtrl.moveToTrash);
router.patch('/restore/:id', workCtrl.restoreFromTrash);
router.delete('/trash/empty', workCtrl.emptyTrash);
router.delete('/trash/:id', workCtrl.permanentDelete);

// ── Tags ────────────────────────────────────────────────────────────────────
router.get('/tags', workCtrl.getAllTags);
router.patch('/tags/:id', workCtrl.updateTags);

// ── Déplacer / Copier ───────────────────────────────────────────────────────
router.post('/move', workCtrl.moveFile);
router.post('/copy', workCtrl.copyFile);

// ── Quota ───────────────────────────────────────────────────────────────────
router.get('/quota', workCtrl.getQuota);

// ── Journal d'activité ──────────────────────────────────────────────────────
router.get('/activity', workCtrl.getActivity);

// ── Partage ─────────────────────────────────────────────────────────────
router.get('/users/list', workCtrl.listUsers);
router.get('/shared', workCtrl.getSharedWithMe);
router.get('/share/invitations', workCtrl.getInvitations);
router.get('/share/sent', workCtrl.getSentInvitations);
router.post('/share', workCtrl.shareWithUser);
router.post('/share/link', workCtrl.createShareLink);
router.patch('/share/accept/:id', workCtrl.acceptInvitation);
router.patch('/share/reject/:id', workCtrl.rejectInvitation);
router.delete('/share/:id', workCtrl.revokeShare);

// ── Dossiers (routes spécifiques avant /:data) ──────────────────────────────
router.post('/folder/tree', workCtrl.createFolderTree);
router.post('/folder', workCtrl.createFolder);
router.put('/folder', workCtrl.renameFolder);
router.patch('/folder/color/:id', workCtrl.setFolderColor);
router.delete('/folder/:data', workCtrl.deleteFolder);

// ── Miniature (thumbnail) ──────────────────────────────────────────────────────
router.get('/thumbnail/*', workCtrl.serveThumbnail);

// ── Informations vidéo (durée, résolution, codec) ─────────────────────────────
router.get('/video-info/*', workCtrl.getVideoInfo);

// ── Téléchargement authentifié ────────────────────────────────────────────────
router.get('/file/*', workCtrl.serveFile);

// ── Fichiers (routes génériques) ────────────────────────────────────────────
router.get('/:data', workCtrl.getAll);
router.post('/', multer, workCtrl.create);
router.put('/', workCtrl.modify);
router.delete('/:data', workCtrl.delete);

module.exports = router;
