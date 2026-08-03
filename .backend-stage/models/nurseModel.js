const pool = require('../config/db');

const getAllNurses = () => pool.query('SELECT * FROM nurses');

const getNurseById = (id) =>
  pool.query('SELECT * FROM nurses WHERE nurse_id = $1', [id]);

const insertNurse = (client, data) => client.query(
  `INSERT INTO nurses
     (first_name, last_name, date_of_birth, contact_info, address, date_of_employment)
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING *`,
  [
    data.first_name,
    data.last_name,
    data.date_of_birth,
    data.contact_info,
    data.address,
    data.date_of_employment,
  ]
);

const createNurse = (data) => insertNurse(pool, data);

const createNurseForUser = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const nurse = await insertNurse(client, data);
    const linkedUser = await client.query(
      `UPDATE users
       SET profile_id = $1,
           full_name = $2,
           updated_at = NOW()
       WHERE user_id = $3
         AND role = 'nurse'
         AND profile_id IS NULL
       RETURNING user_id`,
      [
        nurse.rows[0].nurse_id,
        `${nurse.rows[0].first_name} ${nurse.rows[0].last_name}`.trim(),
        userId,
      ]
    );

    if (linkedUser.rows.length === 0) {
      const error = new Error('This account already has a registered nurse profile');
      error.statusCode = 409;
      throw error;
    }

    await client.query('COMMIT');
    return nurse;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateNurse = (id, data) => pool.query(
  `UPDATE nurses
   SET first_name = $1,
       last_name = $2,
       date_of_birth = $3,
       contact_info = $4,
       address = $5,
       date_of_employment = $6
   WHERE nurse_id = $7
   RETURNING *`,
  [
    data.first_name,
    data.last_name,
    data.date_of_birth,
    data.contact_info,
    data.address,
    data.date_of_employment,
    id,
  ]
);

const deleteNurse = (id) =>
  pool.query('DELETE FROM nurses WHERE nurse_id = $1 RETURNING *', [id]);

module.exports = {
  getAllNurses,
  getNurseById,
  createNurse,
  createNurseForUser,
  updateNurse,
  deleteNurse,
};
