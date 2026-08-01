const express = require('express');
const patientController = require('../controllers/patientController');
const validatePatient = require('../middleware/validatePatient');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authorize('staff', 'doctor', 'nurse', 'patient'), patientController.getAllPatients);
router.get('/:id', authorize('staff', 'doctor', 'nurse', 'patient'), patientController.getPatientById);
router.post('/', authorize('staff'), validatePatient, patientController.createPatient);
router.put('/:id', authorize('staff'), validatePatient, patientController.updatePatient);
router.delete('/:id', authorize('staff'), patientController.deletePatient);

module.exports = router;

