const pool = require('../config/db');

const getAllPatients = () => pool.query('SELECT * FROM patients');

const getPatientById = (id) =>
  pool.query('SELECT * FROM patients WHERE patient_id = $1', [id]);

const insertPatient = (client, data) => client.query(
  `INSERT INTO patients
     (first_name, last_name, date_of_birth, contact_info, gender, address)
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING *`,
  [
    data.first_name,
    data.last_name,
    data.date_of_birth,
    data.contact_info,
    data.gender,
    data.address,
  ]
);

const createPatient = (data) => insertPatient(pool, data);

const createPatientForUser = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const patient = await insertPatient(client, data);
    const linkedUser = await client.query(
      `UPDATE users
       SET profile_id = $1,
           full_name = $2,
           updated_at = NOW()
       WHERE user_id = $3
         AND role = 'patient'
         AND profile_id IS NULL
       RETURNING user_id`,
      [
        patient.rows[0].patient_id,
        `${patient.rows[0].first_name} ${patient.rows[0].last_name}`.trim(),
        userId,
      ]
    );

    if (linkedUser.rows.length === 0) {
      const error = new Error('This account already has a registered patient profile');
      error.statusCode = 409;
      throw error;
    }

    await client.query('COMMIT');
    return patient;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updatePatient = (id, data) => pool.query(
  `UPDATE patients
   SET first_name = $1,
       last_name = $2,
       contact_info = $3
   WHERE patient_id = $4
   RETURNING *`,
  [data.first_name, data.last_name, data.contact_info, id]
);

const deletePatient = (id) =>
  pool.query('DELETE FROM patients WHERE patient_id = $1 RETURNING *', [id]);

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  createPatientForUser,
  updatePatient,
  deletePatient,
};
