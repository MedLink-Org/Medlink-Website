const pool = require('../config/db');

const normalizeStatus = (status) => String(status || 'scheduled')
  .trim()
  .toLowerCase()
  .replace(/^checked in$/, 'scheduled')
  .replace(/^canceled$/, 'cancelled');

const getAllAppointment = () => pool.query('SELECT * FROM appointments');
const getAppointmentById = (id) =>
  pool.query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
const getAppointmentsByPatientId = (patientId) =>
  pool.query('SELECT * FROM appointments WHERE patient_id = $1', [patientId]);
const getAppointmentsByDoctorId = (doctorId) =>
  pool.query('SELECT * FROM appointments WHERE doctor_id = $1', [doctorId]);
const getAppointmentsByNurseId = (nurseId) =>
  pool.query('SELECT * FROM appointments WHERE nurse_id = $1', [nurseId]);

const createAppointment = (data) =>
  pool.query(
    `INSERT INTO appointments
       (patient_id, doctor_id, nurse_id, appointment_date, appointment_time, purpose, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.patient_id,
      data.doctor_id,
      data.nurse_id || null,
      data.appointment_date,
      data.appointment_time,
      data.purpose || data.reason || data.visit_type || '',
      normalizeStatus(data.status),
    ]
  );

const updateAppointment = (id, data) =>
  pool.query(
    `UPDATE appointments
     SET appointment_date = $1,
         appointment_time = $2,
         patient_id = $3,
         doctor_id = $4,
         nurse_id = $5,
         purpose = $6,
         status = $7
     WHERE appointment_id = $8
     RETURNING *`,
    [
      data.appointment_date,
      data.appointment_time,
      data.patient_id,
      data.doctor_id,
      data.nurse_id || null,
      data.purpose || data.reason || data.visit_type || '',
      normalizeStatus(data.status),
      id,
    ]
  );

const deleteAppointment = (id) =>
  pool.query('DELETE FROM appointments WHERE appointment_id = $1 RETURNING *', [id]);

module.exports = {
  getAllAppointment,
  getAppointmentById,
  getAppointmentByDoctorId: getAppointmentsByDoctorId,
  getAppointmentByNurseId: getAppointmentsByNurseId,
  getAppointmentByPatientId: getAppointmentsByPatientId,
  getAppointmentsByDoctorId,
  getAppointmentsByNurseId,
  getAppointmentsByPatientId,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
