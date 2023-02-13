const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/users/user');
//const permissionCtrl = require('../controllers/users/permission');
const addProfil = require('../middleware/addProfil');
const auth = require('../middleware/users/auth');
const loginMidd = require('../middleware/users/login');
const signupMidd = require('../middleware/users/signup');
const loginCtrl = require('../controllers/users/login');
const signupCtrl = require('../controllers/users/signup')

router.post('/signup', signupMidd, signupCtrl);
router.post('/login', loginMidd, loginCtrl);
router.post('/validate', userCtrl.validate);
router.post('/profil', auth, addProfil, userCtrl.addProfil);
//router.post('/permission', permissionCtrl.add);
router.post('/edit', auth, userCtrl.edit);
router.get('/init', userCtrl.init);
router.get('/users', userCtrl.getUsersList);
router.post('/check', userCtrl.checkUser);

module.exports = router;