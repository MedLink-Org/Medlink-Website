const nurseModel = require('../models/nurseModel');

const getAllNurses = async (req, res) => {
  try {
    const result = await nurseModel.getAllNurses();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getNurseById = async (req, res) => {
  try {
    const result = await nurseModel.getNurseById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nurse not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createNurse = async (req, res) => {
  try {
    if (req.user.role === 'nurse' && req.user.profile_id) {
      return res.status(409).json({
        error: 'This account already has a registered nurse profile',
      });
    }

    const result = req.user.role === 'nurse'
      ? await nurseModel.createNurseForUser(req.body, req.user.user_id)
      : await nurseModel.createNurse(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'This account already has a registered nurse profile',
      });
    }
    res.status(500).json({ error: err.message });
  }
};

const updateNurse = async (req, res) => {
  try {
    const result = await nurseModel.updateNurse(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nurse not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteNurse = async (req, res) => {
  try {
    const result = await nurseModel.deleteNurse(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nurse not found' });
    }
    res.status(200).json({ message: 'Nurse deleted', nurse: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllNurses,
  getNurseById,
  createNurse,
  updateNurse,
  deleteNurse,
};
