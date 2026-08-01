const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const validateAppointment = require('../middleware/validateAppointment');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authorize('staff', 'doctor', 'nurse', 'patient'), appointmentController.getAllAppointment);
router.get('/patient/:patientId', authorize('staff', 'doctor', 'nurse', 'patient'), appointmentController.getAppointmentsByPatientId);
router.get('/doctor/:doctorId', authorize('staff', 'doctor', 'nurse'), appointmentController.getAppointmentsByDoctorId);
router.get('/nurse/:nurseId', authorize('staff', 'doctor', 'nurse'), appointmentController.getAppointmentsByNurseId);
router.get('/:id', authorize('staff', 'doctor', 'nurse', 'patient'), appointmentController.getAppointmentById);
router.post('/', authorize('staff', 'patient'), validateAppointment, appointmentController.createAppointment);
router.put('/:id', authorize('staff', 'doctor', 'nurse'), validateAppointment, appointmentController.updateAppointment);
router.delete('/:id', authorize('staff'), appointmentController.deleteAppointment);

module.exports = router;

