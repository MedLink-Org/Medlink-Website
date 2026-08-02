const pool = require('../config/db');

const publicUserFields = `
  user_id,
  email,
  full_name,
  avatar_url,
  role,
  profile_id,
  created_at,
  updated_at,
  last_login_at
`;

const createUser = (email, passwordHash, role, profileId, fullName) =>
  pool.query(
    `INSERT INTO users (email, password_hash, role, profile_id, full_name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       profile_id = EXCLUDED.profile_id,
       full_name = EXCLUDED.full_name,
       updated_at = NOW()
     WHERE users.password_hash IS NULL
     RETURNING ${publicUserFields}`,
    [email, passwordHash, role, profileId || null, fullName]
  );

const getUserByEmail = (email) =>
  pool.query(
    `SELECT
       ${publicUserFields},
       password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );

const updateLastLogin = (userId) =>
  pool.query(
    `UPDATE users
     SET last_login_at = NOW(),
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING ${publicUserFields}`,
    [userId]
  );

const getUserById = (userId) =>
  pool.query(
    `SELECT ${publicUserFields}
     FROM users
     WHERE user_id = $1`,
    [userId]
  );

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  updateLastLogin,
};
