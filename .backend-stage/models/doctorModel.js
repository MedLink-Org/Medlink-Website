const pool = require('../config/db');

const getAllDoctors = () => pool.query('SELECT * FROM doctors');

const getDoctorById = (id) =>
  pool.query('SELECT * FROM doctors WHERE doctor_id = $1', [id]);

const insertDoctor = (client, data) => client.query(
  `INSERT INTO doctors
     (first_name, last_name, date_of_birth, contact_info, address, specialization, date_of_employment)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING *`,
  [
    data.first_name,
    data.last_name,
    data.date_of_birth,
    data.contact_info,
    data.address,
    data.specialization,
    data.date_of_employment,
  ]
);

const createDoctor = (data) => insertDoctor(pool, data);

const createDoctorForUser = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const doctor = await insertDoctor(client, data);
    const linkedUser = await client.query(
      `UPDATE users
       SET profile_id = $1,
           full_name = $2,
           updated_at = NOW()
       WHERE user_id = $3
         AND role = 'doctor'
         AND profile_id IS NULL
       RETURNING user_id`,
      [
        doctor.rows[0].doctor_id,
        `${doctor.rows[0].first_name} ${doctor.rows[0].last_name}`.trim(),
        userId,
      ]
    );

    if (linkedUser.rows.length === 0) {
      const error = new Error('This account already has a registered doctor profile');
      error.statusCode = 409;
      throw error;
    }

    await client.query('COMMIT');
    return doctor;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateDoctor = (id, data) => pool.query(
  `UPDATE doctors
   SET first_name = $1,
       last_name = $2,
       date_of_birth = $3,
       contact_info = $4,
       address = $5,
       specialization = $6,
       date_of_employment = $7
   WHERE doctor_id = $8
   RETURNING *`,
  [
    data.first_name,
    data.last_name,
    data.date_of_birth,
    data.contact_info,
    data.address,
    data.specialization,
    data.date_of_employment,
    id,
  ]
);

const deleteDoctor = (id) =>
  pool.query('DELETE FROM doctors WHERE doctor_id = $1 RETURNING *', [id]);

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  createDoctorForUser,
  updateDoctor,
  deleteDoctor,
};
