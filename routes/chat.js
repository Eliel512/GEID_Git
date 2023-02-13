const express = require('express');
const router = express.Router();
const invitationCtrl = require('../controllers/chats/invitation');
const roomCtrl = require('../controllers/chats/room');
const chatCtrl = require('../controllers/chats/chat');

const multer = require('../middleware/multer-chat');
//const { check } = require('../middleware/chat');

router.post('/direct', multer, chatCtrl.sendDirectFile);
router.post('/file', multer, chatCtrl.sendFile);
router.post('/invite', invitationCtrl.sendInvite);
router.post('/reject', invitationCtrl.rejectInvite);
router.post('/accept', invitationCtrl.acceptInvite);
router.get('/invites', invitationCtrl.getInvite);   

router.post('/room/new', roomCtrl.createRoom);
router.put('/room/add', roomCtrl.addMembers);

module.exports = router;