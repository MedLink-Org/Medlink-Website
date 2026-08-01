const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-auth-tests';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '10';

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  hashPassword,
  normalizeCredentials,
  verifyPassword,
} = require('../services/passwordService');
const {
  createAccessToken,
  verifyAccessToken,
} = require('../services/tokenService');

const testUser = {
  user_id: 42,
  email: 'doctor@example.com',
  role: 'doctor',
  profile_id: 'D001',
};

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

test('creates and verifies a role-aware access token', () => {
  const token = createAccessToken(testUser);
  const payload = verifyAccessToken(token);

  assert.equal(payload.sub, '42');
  assert.equal(payload.email, testUser.email);
  assert.equal(payload.role, 'doctor');
  assert.equal(payload.profile_id, 'D001');
});

test('normalizes email and requires email plus password', () => {
  assert.deepEqual(
    normalizeCredentials({
      email: ' USER@EXAMPLE.COM ',
      password: 'password123',
    }),
    {
      email: 'user@example.com',
      password: 'password123',
    }
  );
});

test('hashes and verifies passwords', async () => {
  const passwordHash = await hashPassword('password123');

  assert.notEqual(passwordHash, 'password123');
  assert.equal(await verifyPassword('password123', passwordHash), true);
  assert.equal(await verifyPassword('wrong-password', passwordHash), false);
});

test('authentication middleware exposes role and linked profile', () => {
  const token = createAccessToken(testUser);
  const req = {
    get: (header) =>
      header === 'authorization' ? `Bearer ${token}` : undefined,
  };
  const { res } = responseRecorder();
  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, {
    user_id: '42',
    email: testUser.email,
    role: 'doctor',
    profile_id: 'D001',
  });
});

test('authorization middleware accepts allowed roles', () => {
  const req = { user: { role: 'staff' } };
  const { res } = responseRecorder();
  let nextCalled = false;

  authorize('staff')(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorization middleware rejects disallowed roles', () => {
  const req = { user: { role: 'patient' } };
  const { res, response } = responseRecorder();

  authorize('staff')(req, res, () => assert.fail('next should not be called'));

  assert.equal(response.status, 403);
});

