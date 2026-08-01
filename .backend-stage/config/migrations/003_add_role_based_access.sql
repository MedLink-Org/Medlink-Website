ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS profile_id TEXT;

UPDATE users
SET role = 'staff'
WHERE role IS NULL;

ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'patient',
ALTER COLUMN role SET NOT NULL;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('staff', 'doctor', 'nurse', 'patient'));

CREATE UNIQUE INDEX IF NOT EXISTS users_role_profile_unique
ON users (role, profile_id)
WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

