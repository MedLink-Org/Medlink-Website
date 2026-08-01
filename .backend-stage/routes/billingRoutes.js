const express = require('express');
const billingController = require('../controllers/billingController');
const validateBilling = require('../middleware/validateBilling');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authorize('staff', 'patient'), billingController.getAllBilling);
router.get('/patient/:patientId', authorize('staff', 'patient'), billingController.getBillingByPatientId);
router.get('/:id', authorize('staff', 'patient'), billingController.getBillingById);
router.post('/', authorize('staff'), validateBilling, billingController.createBilling);
router.put('/:id', authorize('staff'), validateBilling, billingController.updateBilling);
router.delete('/:id', authorize('staff'), billingController.deleteBilling);

module.exports = router;

