const doctorModel = require('../models/doctorModel');

const getAllDoctors = async (req, res) => {
  try {
    const result = await doctorModel.getAllDoctors();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const result = await doctorModel.getDoctorById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createDoctor = async (req, res) => {
  try {
    if (req.user.role === 'doctor' && req.user.profile_id) {
      return res.status(409).json({
        error: 'This account already has a registered doctor profile',
      });
    }

    const result = req.user.role === 'doctor'
      ? await doctorModel.createDoctorForUser(req.body, req.user.user_id)
      : await doctorModel.createDoctor(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'This account already has a registered doctor profile',
      });
    }
    res.status(500).json({ error: err.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const result = await doctorModel.updateDoctor(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const result = await doctorModel.deleteDoctor(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json({ message: 'Doctor deleted', doctor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
