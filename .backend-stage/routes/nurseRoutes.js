const express = require('express');
const nurseController = require('../controllers/nurseController');
const validateNurse = require('../middleware/validateNurse');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authorize('staff', 'doctor', 'nurse'), nurseController.getAllNurses);
router.get('/:id', authorize('staff', 'doctor', 'nurse'), nurseController.getNurseById);
router.post('/', authorize('staff'), validateNurse, nurseController.createNurse);
router.put('/:id', authorize('staff'), validateNurse, nurseController.updateNurse);
router.delete('/:id', authorize('staff'), nurseController.deleteNurse);

module.exports = router;

