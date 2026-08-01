const express = require('express');
const staffController = require('../controllers/staffController');
const validateStaff = require('../middleware/validateStaff');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authorize('staff'));
router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.post('/', validateStaff, staffController.createStaff);
router.put('/:id', validateStaff, staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;

