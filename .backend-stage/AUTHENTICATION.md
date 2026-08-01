# Role-Based Email and Password Authentication

The backend authenticates clinic-assigned accounts with email and password.
Passwords are hashed before storage. Successful login returns a role-aware
MedLink JWT used on every protected API request.

## Backend Setup

1. Copy `.env.example` to `.env`.
2. Set `JWT_SECRET` to a long random secret.
3. Apply these migrations in order:

   ```text
   config/migrations/001_add_users.sql
   config/migrations/002_replace_google_auth_with_password.sql
   config/migrations/003_add_role_based_access.sql
   ```

4. Review existing accounts migrated to the `staff` role.
5. Restart the backend.

## Create Patient Account

Patients can create an account using an existing, unclaimed Patient ID:

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "secure-password",
  "profile_id": "P001"
}
```

The backend forces the `patient` role, verifies that the patient record exists,
and returns a MedLink session. Public signup cannot create staff, doctor, or
nurse accounts.

## Assign Privileged Account

Only an authenticated `staff` account can assign an account:

```http
POST /api/auth/accounts
Content-Type: application/json
Authorization: Bearer <staff-token>

{
  "email": "doctor@example.com",
  "password": "secure-password",
  "role": "doctor",
  "profile_id": "D01"
}
```

Valid roles are `staff`, `doctor`, `nurse`, and `patient`. Doctor, nurse, and
patient accounts require a linked clinic `profile_id`.

## Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "secure-password"
}
```

The response includes:

```json
{
  "access_token": "<medlink-jwt>",
  "token_type": "Bearer",
  "expires_in": "7d",
  "user": {
    "user_id": "1",
    "email": "doctor@example.com",
    "role": "doctor",
    "profile_id": "D01"
  }
}
```

Send the token on every protected request:

```http
Authorization: Bearer <medlink-jwt>
```

`GET /api/auth/me` returns the signed-in account. Backend route authorization
and resource ownership checks enforce the role and linked profile.
