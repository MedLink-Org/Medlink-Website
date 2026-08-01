const medicalRecordModel = require('../models/medicalRecordModel');

const getAllMedicalRecords = async (req, res) => {
  try {
    const result = req.user.role === 'patient'
      ? await medicalRecordModel.getMedicalRecordByPatientId(req.user.profile_id)
      : await medicalRecordModel.getAllMedicalRecords();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMedicalRecordById = async (req, res) => {
  try {
    const result = await medicalRecordModel.getMedicalRecordById(req.params.id);
    const record = result.rows[0];
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    if (
      req.user.role === 'patient'
      && String(req.user.profile_id) !== String(record.patient_id)
    ) {
      return res.status(403).json({ error: 'You cannot access this medical record' });
    }
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMedicalRecordByPatientId = async (req, res) => {
  if (
    req.user.role === 'patient'
    && String(req.user.profile_id) !== String(req.params.patientId)
  ) {
    return res.status(403).json({ error: 'You cannot access this medical record' });
  }
  try {
    const result = await medicalRecordModel.getMedicalRecordByPatientId(req.params.patientId);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createMedicalRecord = async (req, res) => {
  try {
    const result = await medicalRecordModel.createMedicalRecord(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateMedicalRecord = async (req, res) => {
  try {
    const result = await medicalRecordModel.updateMedicalRecord(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteMedicalRecord = async (req, res) => {
  try {
    const result = await medicalRecordModel.deleteMedicalRecord(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    res.status(200).json({ message: 'Medical record deleted', record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllMedicalRecords,
  getMedicalRecordById,
  getMedicalRecordByPatientId,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
};

