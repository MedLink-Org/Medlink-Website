const { verifyAccessToken } = require('../services/tokenService');

const authenticate = (req, res, next) => {
  const authorization = req.get('authorization');

  if (!authorization) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const [scheme, token] = authorization.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ error: 'Use a Bearer access token' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      user_id: payload.sub,
      email: payload.email,
      role: payload.role,
      profile_id: payload.profile_id || null,
    };
    next();
  } catch (error) {
    if (error.code === 'AUTH_CONFIG_ERROR') {
      console.error(error.message);
      return res.status(500).json({ error: 'Authentication is not configured' });
    }

    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
};

module.exports = authenticate;

