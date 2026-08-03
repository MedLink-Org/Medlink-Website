const test = require('node:test');
const assert = require('node:assert/strict');

const validateAppointment = require('../middleware/validateAppointment');
const { canAccessAppointment } = require('../middleware/resourceAccess');

const responseRecorder = () => {
  const response = {};
  return {
    response,
    res: {
      status(code) {
        response.status = code;
        return this;
      },
      json(body) {
        response.body = body;
        return this;
      },
    },
  };
};

const validRequest = (status) => ({
  body: {
    patient_id: 'P001',
    doctor_id: 'D001',
    appointment_date: '2026-08-03',
    appointment_time: '09:00',
    status,
  },
  user: { role: 'staff' },
});

test('normalizes display-case appointment statuses for the database constraint', () => {
  const req = validRequest('Scheduled');
  const { res } = responseRecorder();
  let nextCalled = false;

  validateAppointment(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.status, 'scheduled');
});

test('rejects statuses outside the appointment database constraint', () => {
  const req = validRequest('pending');
  const { res, response } = responseRecorder();

  validateAppointment(req, res, () => assert.fail('next should not be called'));

  assert.equal(response.status, 400);
  assert.match(response.body.error, /scheduled, completed, cancelled, no-show/);
});

test('limits doctors to appointments assigned to their linked profile', () => {
  const assignedAppointment = {
    patient_id: 'P001',
    doctor_id: 'D001',
    nurse_id: 'N001',
  };

  assert.equal(
    canAccessAppointment(
      { role: 'doctor', profile_id: 'D001' },
      assignedAppointment
    ),
    true
  );
  assert.equal(
    canAccessAppointment(
      { role: 'doctor', profile_id: 'D002' },
      assignedAppointment
    ),
    false
  );
  assert.equal(
    canAccessAppointment(
      { role: 'doctor', profile_id: null },
      assignedAppointment
    ),
    false
  );
});

test('limits nurses to appointments assigned to their linked profile', () => {
  const assignedAppointment = {
    patient_id: 'P001',
    doctor_id: 'D001',
    nurse_id: 'N001',
  };

  assert.equal(
    canAccessAppointment(
      { role: 'nurse', profile_id: 'N001' },
      assignedAppointment
    ),
    true
  );
  assert.equal(
    canAccessAppointment(
      { role: 'nurse', profile_id: 'N002' },
      assignedAppointment
    ),
    false
  );
  assert.equal(
    canAccessAppointment(
      { role: 'nurse', profile_id: null },
      assignedAppointment
    ),
    false
  );
});

test('keeps staff access to every appointment', () => {
  assert.equal(
    canAccessAppointment(
      { role: 'staff', profile_id: null },
      { patient_id: 'P001', doctor_id: 'D001', nurse_id: 'N001' }
    ),
    true
  );
});
