const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');
const permissionCtrl = require('../controllers/permission');
const addProfil = require('../middleware/addProfil');
const auth = require('../middleware/auth');

router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);
router.post('/validate', userCtrl.validate);
router.post('/profil', auth, addProfil, userCtrl.addProfil);
router.post('/permission', permissionCtrl.add);
router.post('/edit', auth, userCtrl.edit);
router.get('/init', userCtrl.init);
router.get('/users', userCtrl.getUsersList);

module.exports = router;