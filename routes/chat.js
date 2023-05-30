const express = require('express');
const router = express.Router();
const invitationCtrl = require('../controllers/chats/invitation');
const roomCtrl = require('../controllers/chats/room');
const chatCtrl = require('../controllers/chats/chat');
const getToken = require('../controllers/chats/getToken')
const getAll = require('../controllers/chats/getAll');
const getCallDetails = require('../controllers/chats/room/getCallDetails');
const getAllCallDetails = require('../controllers/chats/room/getAllCallDetails');

const multer = require('../middleware/multer-chat');
const nocache = require('../middleware/chats/nocache');
//const { check } = require('../middleware/chat');

router.get('/', getAll);

router.post('/direct', multer, chatCtrl.sendDirectFile);
router.post('/file', multer, chatCtrl.sendFile);
router.post('/invite', invitationCtrl.sendInvite);
router.post('/reject', invitationCtrl.rejectInvite);
router.post('/accept', invitationCtrl.acceptInvite);
router.get('/invites', invitationCtrl.getInvite);   

router.get('/room/call/', getAllCallDetails);
router.get('/room/call/:id', getCallDetails);
router.post('/room/new', roomCtrl.createRoom);
router.put('/room/add', roomCtrl.addMembers);

router.get('/rtc/:type/:target/:role/:tokenType', nocache, getToken);

module.exports = router;