const path = require('node:path');

const backendRoot = process.argv[2];
if (!backendRoot) {
  throw new Error('Usage: node verify-live-patient-onboarding.cjs <backend-root>');
}

require(path.join(backendRoot, 'node_modules', 'dotenv')).config({
  path: path.join(backendRoot, '.env'),
});
const { Client } = require(path.join(backendRoot, 'node_modules', 'pg'));

const apiUrl = 'http://127.0.0.1:5000';
const email = `codex-onboarding-${Date.now()}@example.invalid`;
const password = 'TemporaryPass123!';
let patientId = null;

async function request(pathname, options = {}) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status} ${payload.error || payload.message}`);
  }
  return payload;
}

async function cleanup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    const account = await client.query(
      'DELETE FROM users WHERE email = $1 RETURNING profile_id',
      [email]
    );
    patientId = patientId || account.rows[0]?.profile_id || null;
    if (patientId) {
      await client.query('DELETE FROM patients WHERE patient_id = $1', [patientId]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    const signup = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        role: 'patient',
      }),
    });
    if (!signup.access_token || signup.user?.profile_id) {
      throw new Error('Signup did not return an unlinked authenticated patient account');
    }

    const patient = await request('/api/patients', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${signup.access_token}`,
      },
      body: JSON.stringify({
        first_name: 'Temporary',
        last_name: 'Patient',
        date_of_birth: '1990-01-01',
        contact_info: '+234 800 000 0000',
        gender: 'Prefer not to say',
        address: 'Temporary verification record',
      }),
    });
    patientId = patient.patient_id;

    const session = await request('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${signup.access_token}`,
      },
    });
    if (!session.access_token || session.user?.profile_id !== patientId) {
      throw new Error('The patient profile was not linked into the refreshed session');
    }

    console.log(JSON.stringify({
      signupStatus: 'authenticated',
      patientId,
      linkedProfileId: session.user.profile_id,
      cleanup: 'pending',
    }));
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
