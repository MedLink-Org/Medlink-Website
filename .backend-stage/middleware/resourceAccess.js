const canAccessProfile = (user, role, profileId) =>
  user?.role === 'staff'
  || (user?.role === role && String(user.profile_id) === String(profileId));

const canAccessPatient = (user, patientId) =>
  user?.role !== 'patient'
  || String(user.profile_id) === String(patientId);

const canAccessAppointment = (user, appointment) => {
  if (user?.role === 'staff') return true;
  if (user?.role === 'patient') {
    return String(user.profile_id) === String(appointment.patient_id);
  }
  if (user?.role === 'doctor') {
    return String(user.profile_id) === String(appointment.doctor_id);
  }
  if (user?.role === 'nurse') {
    return String(user.profile_id) === String(appointment.nurse_id);
  }
  return false;
};

module.exports = {
  canAccessAppointment,
  canAccessPatient,
  canAccessProfile,
};

