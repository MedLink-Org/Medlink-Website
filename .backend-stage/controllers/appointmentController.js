const appointmentModel = require('../models/appointmentModel');
const { canAccessAppointment } = require('../middleware/resourceAccess');

const scopedAppointments = (user) => {
  if (user.role === 'patient') {
    return appointmentModel.getAppointmentsByPatientId(user.profile_id);
  }
  if (user.role === 'doctor') {
    return appointmentModel.getAppointmentsByDoctorId(user.profile_id);
  }
  if (user.role === 'nurse') {
    return appointmentModel.getAppointmentsByNurseId(user.profile_id);
  }
  return appointmentModel.getAllAppointment();
};

const getAllAppointment = async (req, res) => {
  try {
    const result = await scopedAppointments(req.user);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const result = await appointmentModel.getAppointmentById(req.params.id);
    const appointment = result.rows[0];
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (!canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ error: 'You cannot access this appointment' });
    }
    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAppointmentsByPatientId = async (req, res) => {
  if (
    req.user.role === 'patient'
    && String(req.user.profile_id) !== String(req.params.patientId)
  ) {
    return res.status(403).json({ error: 'You cannot access these appointments' });
  }
  try {
    const result = await appointmentModel.getAppointmentsByPatientId(req.params.patientId);
    res.status(200).json(result.rows.filter(item => canAccessAppointment(req.user, item)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAppointmentsByDoctorId = async (req, res) => {
  try {
    const result = await appointmentModel.getAppointmentsByDoctorId(req.params.doctorId);
    res.status(200).json(result.rows.filter(item => canAccessAppointment(req.user, item)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAppointmentsByNurseId = async (req, res) => {
  try {
    const result = await appointmentModel.getAppointmentsByNurseId(req.params.nurseId);
    res.status(200).json(result.rows.filter(item => canAccessAppointment(req.user, item)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAppointment = async (req, res) => {
  try {
    const data = {
      ...req.body,
      patient_id: req.user.role === 'patient'
        ? req.user.profile_id
        : req.body.patient_id,
    };
    const result = await appointmentModel.createAppointment(data);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const current = await appointmentModel.getAppointmentById(req.params.id);
    const appointment = current.rows[0];
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (!canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ error: 'You cannot update this appointment' });
    }
    const result = await appointmentModel.updateAppointment(req.params.id, {
      ...appointment,
      ...req.body,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      nurse_id: appointment.nurse_id,
    });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const result = await appointmentModel.deleteAppointment(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json({ message: 'Appointment deleted', appointment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllAppointment,
  getAppointmentById,
  getAppointmentsByPatientId,
  getAppointmentsByDoctorId,
  getAppointmentsByNurseId,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};

