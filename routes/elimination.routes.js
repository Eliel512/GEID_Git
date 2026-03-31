const express = require('express');
const router = express.Router();

const eliminationCtrl    = require('../controllers/archives/elimination');
const eliminationPdfCtrl = require('../controllers/archives/eliminationPdf');

router.post('/',                       eliminationCtrl.create);
router.get('/',                        eliminationCtrl.getAll);
router.get('/:id/pdf',                 eliminationPdfCtrl.generatePdf);
router.get('/:id',                     eliminationCtrl.getOne);
router.patch('/:id/submit',            eliminationCtrl.submit);
router.patch('/:id/approve-producer',  eliminationCtrl.approveProducer);
router.patch('/:id/approve-dantic',    eliminationCtrl.approveDantic);
router.patch('/:id/reject',            eliminationCtrl.reject);
router.patch('/:id/execute',           eliminationCtrl.execute);

module.exports = router;
