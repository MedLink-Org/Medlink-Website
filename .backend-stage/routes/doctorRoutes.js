const express = require('express');
const doctorController = require('../controllers/doctorController');
const validateDoctor = require('../middleware/validateDoctor');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authorize('staff', 'doctor', 'nurse', 'patient'), doctorController.getAllDoctors);
router.get('/:id', authorize('staff', 'doctor', 'nurse', 'patient'), doctorController.getDoctorById);
router.post('/', authorize('staff'), validateDoctor, doctorController.createDoctor);
router.put('/:id', authorize('staff'), validateDoctor, doctorController.updateDoctor);
router.delete('/:id', authorize('staff'), doctorController.deleteDoctor);

module.exports = router;

