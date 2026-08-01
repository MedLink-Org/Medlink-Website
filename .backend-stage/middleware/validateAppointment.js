const validateAppointment = (req, res, next) => {
  const {
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    status,
  } = req.body || {};
  const missingFields = [];

  if (!patient_id && req.user?.role !== 'patient') missingFields.push('patient_id');
  if (!doctor_id) missingFields.push('doctor_id');
  if (!appointment_date) missingFields.push('appointment_date');
  if (!appointment_time) missingFields.push('appointment_time');

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required field(s): ${missingFields.join(', ')}`,
    });
  }

  const validStatuses = [
    'Scheduled',
    'Checked In',
    'Completed',
    'Cancelled',
    'No-show',
  ];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  next();
};

module.exports = validateAppointment;

