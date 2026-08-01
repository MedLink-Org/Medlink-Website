const express = require('express');
const medicalRecordController = require('../controllers/medicalRecordController');
const validateMedicalRecord = require('../middleware/validateMedicalRecords');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authorize('staff', 'doctor', 'nurse', 'patient'), medicalRecordController.getAllMedicalRecords);
router.get('/patient/:patientId', authorize('staff', 'doctor', 'nurse', 'patient'), medicalRecordController.getMedicalRecordByPatientId);
router.get('/:id', authorize('staff', 'doctor', 'nurse', 'patient'), medicalRecordController.getMedicalRecordById);
router.post('/', authorize('staff', 'nurse'), validateMedicalRecord, medicalRecordController.createMedicalRecord);
router.put('/:id', authorize('staff', 'nurse'), validateMedicalRecord, medicalRecordController.updateMedicalRecord);
router.delete('/:id', authorize('staff'), medicalRecordController.deleteMedicalRecord);

module.exports = router;

