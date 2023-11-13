const express = require('express');
const router = express.Router();
const invitationCtrl = require('../controllers/chats/invitation');
const roomCtrl = require('../controllers/chats/room');
const chatCtrl = require('../controllers/chats/chat');
const getToken = require('../controllers/chats/getToken')
const getAll = require('../controllers/chats/getAll');
const getCallDetails = require('../controllers/chats/room/getCallDetails');
const getAllCallDetails = require('../controllers/chats/room/getAllCallDetails');
const getUserSocketInstance = require('../controllers/chats/room/getUserSocketInstance');
const createRoom = require('../controllers/chats/room/createRoom');
const auth = require('../middleware/users/auth');

const multer = require('../middleware/multer-chat');
const nocache = require('../middleware/chats/nocache');
//const { check } = require('../middleware/chat');

router.get('/', auth, getAll);

router.post('/direct', auth, multer, chatCtrl.sendDirectFile);
router.post('/file', auth, multer, chatCtrl.sendFile);
//router.post('/voice', multer, sendVoice);
router.post('/invite', auth, invitationCtrl.sendInvite);
router.post('/reject', auth, invitationCtrl.rejectInvite);
router.post('/accept', auth, invitationCtrl.acceptInvite);
router.get('/invites', auth, invitationCtrl.getInvite);   

router.post('/room/call/', auth, createRoom);
router.get('/room/call/', auth, getAllCallDetails);
router.get('/room/call/join', joinRoom);
// router.get('/room/call/instance', auth, getUserSocketInstance);
router.get('/room/call/:id', getCallDetails);
router.post('/room/new', auth, roomCtrl.createRoom);
router.put('/room/edit', auth, roomCtrl.editRoom);

router.get('/rtc/:type/:target/:role/:tokenType', auth, nocache, getToken);

module.exports = router;