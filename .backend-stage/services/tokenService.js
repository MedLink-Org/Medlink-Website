const jwt = require('jsonwebtoken');
const {
  getJwtExpiresIn,
  getJwtSecret,
} = require('../config/auth');

const JWT_ISSUER = 'medlink-api';
const JWT_AUDIENCE = 'medlink-web';

const createAccessToken = (user) =>
  jwt.sign(
    {
      email: user.email,
      role: user.role,
      profile_id: user.profile_id || null,
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      audience: JWT_AUDIENCE,
      expiresIn: getJwtExpiresIn(),
      issuer: JWT_ISSUER,
      subject: String(user.user_id),
    }
  );

const verifyAccessToken = (token) =>
  jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
  });

module.exports = {
  createAccessToken,
  verifyAccessToken,
};

