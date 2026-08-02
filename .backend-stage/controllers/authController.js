const userModel = require('../models/userModel');
const {
  hashPassword,
  normalizeCredentials,
  verifyPassword,
} = require('../services/passwordService');
const { createAccessToken } = require('../services/tokenService');
const { getJwtExpiresIn } = require('../config/auth');

const allowedRoles = new Set(['staff', 'doctor', 'nurse', 'patient']);

const sendAuthResponse = (res, statusCode, user) =>
  res.status(statusCode).json({
    access_token: createAccessToken(user),
    token_type: 'Bearer',
    expires_in: getJwtExpiresIn(),
    user,
  });

const createAccount = async (email, password, role, profileId, fullName) => {
  const passwordHash = await hashPassword(password);
  const result = await userModel.createUser(
    email,
    passwordHash,
    role,
    profileId || null,
    fullName
  );

  if (result.rows.length === 0) {
    const error = new Error('A user account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  return result.rows[0];
};

const register = async (req, res) => {
  try {
    const { email, password } = normalizeCredentials(req.body);
    const role = String(req.body.role || '').trim().toLowerCase();
    const profileId = String(req.body.profile_id || '').trim();
    const fullName = String(
      req.body.full_name
      || req.body.name
      || email.split('@')[0]
    ).trim();

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ error: 'A valid account role is required' });
    }
    const user = await createAccount(email, password, role, profileId, fullName);
    return sendAuthResponse(res, 201, user);
  } catch (error) {
    if (error.code === 'AUTH_CONFIG_ERROR') {
      console.error(error.message);
      return res.status(500).json({ error: 'Authentication is not configured' });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.code === '23505' || error.code === '23514') {
      return res.status(409).json({
        error: 'The email or linked clinic profile is already assigned',
      });
    }

    console.error('Registration failed:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = normalizeCredentials(req.body);
    const result = await userModel.getUserByEmail(email);
    const account = result.rows[0];
    const passwordMatches = await verifyPassword(
      password,
      account?.password_hash
    );

    if (!account || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!allowedRoles.has(account.role)) {
      return res.status(403).json({
        error: 'This account has not been assigned a MedLink role',
      });
    }

    const updatedUser = await userModel.updateLastLogin(account.user_id);
    return sendAuthResponse(res, 200, updatedUser.rows[0]);
  } catch (error) {
    if (error.code === 'AUTH_CONFIG_ERROR') {
      console.error(error.message);
      return res.status(500).json({ error: 'Authentication is not configured' });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('Login failed:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const result = await userModel.getUserById(req.user.user_id);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    return sendAuthResponse(res, 200, result.rows[0]);
  } catch (error) {
    console.error('Unable to load current user:', error);
    return res.status(500).json({ error: 'Unable to load current user' });
  }
};

module.exports = {
  getCurrentUser,
  login,
  register,
};
