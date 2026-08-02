const path = require('node:path');

const backendRoot = process.argv[2];
if (!backendRoot) {
  throw new Error('Usage: node verify-appointment-constraint.cjs <backend-root>');
}

require(path.join(backendRoot, 'node_modules', 'dotenv')).config({
  path: path.join(backendRoot, '.env'),
});
const { Client } = require(path.join(backendRoot, 'node_modules', 'pg'));

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const constraint = await client.query(`
      SELECT
        pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'appointments'
        AND c.conname = 'appointments_status_check'
    `);
    const userColumns = await client.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log(constraint.rows[0]?.definition || 'appointments_status_check not found');
    console.log(userColumns.rows);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
