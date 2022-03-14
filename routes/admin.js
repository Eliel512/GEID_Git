const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin');

router.get('/users', adminCtrl.getAllUsers);
router.get('/users/:datas', adminCtrl.getUsersByProps);
router.get('/:userId', adminCtrl.getOneUser);
router.post('/users', adminCtrl.AddOneUser);
router.put('/users', adminCtrl.modifyUser);
router.put('/users/permissions', adminCtrl.modifyUserPermission);
router.put('/users/permissions/:mode', adminCtrl.addOrRemoveUserPermission);
router.get('/roles', adminCtrl.getAllRoles);
router.post('/roles', adminCtrl.addOneRole);
//router.put('/roles', adminCtrl.modifyOneRole);
//router.delete('/roles', adminCtrl.removeOneRole);

module.exports = router;