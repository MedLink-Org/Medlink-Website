const patientModel = require('../models/patientModel');
const { canAccessPatient } = require('../middleware/resourceAccess');

const getAllPatients = async (req, res) => {
  try {
    const result = req.user.role === 'patient'
      ? await patientModel.getPatientById(req.user.profile_id)
      : await patientModel.getAllPatients();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPatientById = async (req, res) => {
  if (!canAccessPatient(req.user, req.params.id)) {
    return res.status(403).json({ error: 'You cannot access this patient' });
  }
  try {
    const result = await patientModel.getPatientById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPatient = async (req, res) => {
  try {
    if (req.user.role === 'patient' && req.user.profile_id) {
      return res.status(409).json({
        error: 'This account already has a registered patient profile',
      });
    }

    const result = req.user.role === 'patient'
      ? await patientModel.createPatientForUser(req.body, req.user.user_id)
      : await patientModel.createPatient(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'This account already has a registered patient profile',
      });
    }
    res.status(500).json({ error: err.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const result = await patientModel.updatePatient(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const result = await patientModel.deletePatient(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json({ message: 'Patient deleted', patient: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
