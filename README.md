# MedLink Clinic Management Frontend

MedLink is a React clinic-management frontend for patient registration, doctors, nurses, appointments, billing, dashboards, and reports. Access is protected by email/password authentication and a MedLink JWT issued by the separate backend.

Documentation updated: August 1, 2026.

## Contents

- [Features](#features)
- [Authentication Architecture](#authentication-architecture)
- [Requirements](#requirements)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Environment Variables](#environment-variables)
- [Authentication API](#authentication-api)
- [Password Security](#password-security)
- [Database Migration](#database-migration)
- [Clinic API](#clinic-api)
- [CORS](#cors)
- [Offline Data Behavior](#offline-data-behavior)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Deployment Checklist](#deployment-checklist)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)

## Features

- Assigned email and password accounts
- Staff, doctor, nurse, and patient roles
- Role-based navigation and API authorization
- bcrypt password hashing in the backend
- MedLink JWT bearer authentication
- Protected frontend routes
- Authenticated profile display and sign-out
- Patient registration and directory
- Doctor registration and directory
- Nurse registration and directory
- Appointment booking and status management
- Billing and payment status management
- Dashboard and clinic reports
- CSV report export
- Responsive desktop and mobile layouts
- Local data fallback for unavailable clinic endpoints
- Browser smoke tests covering authentication and clinic workflows

## Authentication Architecture

```text
Frontend login page
  |
  | 1. User submits email and password
  v
POST /api/auth/login
  |
  | 2. Backend validates the assigned account
  | 3. Backend compares the password with bcrypt
  | 4. Backend signs a role-aware MedLink JWT
  v
Frontend receives access_token and user
  |
  | 5. JWT is stored in sessionStorage
  | 6. API requests send Authorization: Bearer <token>
  v
Protected MedLink API routes
```

Passwords are never stored in the frontend or returned by the backend.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- PostgreSQL configured for the backend
- The frontend repository
- The MedLink backend repository

Local repository locations:

```text
C:\Users\PC\ins204\Medlink-Website
C:\Users\PC\Medlink-Backend
```

## Frontend Setup

1. Open the frontend:

   ```powershell
   Set-Location C:\Users\PC\ins204\Medlink-Website
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` from `.env.example`.

4. Confirm the frontend environment:

   ```dotenv
   VITE_API_URL=http://127.0.0.1:5000
   VITE_AUTH_LOGIN_PATH=/api/auth/login
   VITE_AUTH_SESSION_PATH=/api/auth/me
   ```

5. Start the frontend:

   ```bash
   npm run dev -- --host 127.0.0.1 --port 5173
   ```

6. Open:

   ```text
   http://127.0.0.1:5173/login
   ```

The sign-in screen accepts accounts assigned by clinic administration. Public self-registration is not available.

## Backend Setup

1. Open the backend:

   ```powershell
   Set-Location C:\Users\PC\Medlink-Backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure `.env`:

   ```dotenv
   PORT=5000
   DATABASE_URL=postgresql://user:password@host:5432/database
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   ```

4. Apply the database migrations:

   ```text
   config/migrations/001_add_users.sql
   config/migrations/002_replace_google_auth_with_password.sql
   config/migrations/003_add_role_based_access.sql
   ```

   Migration `001` creates the users table, migration `002` enables password accounts, and migration `003` adds account roles and linked clinic profile IDs.

5. Start the backend:

   ```bash
   npm start
   ```

6. Confirm:

   ```text
   http://127.0.0.1:5000/
   ```

   Expected response:

   ```text
   Medlink Backend is running
   ```

Confirm all three migrations are applied before assigning accounts.

## Environment Variables

### Frontend

File:

```text
C:\Users\PC\ins204\Medlink-Website\.env
```

```dotenv
VITE_API_URL=http://127.0.0.1:5000
VITE_AUTH_LOGIN_PATH=/api/auth/login
VITE_AUTH_SESSION_PATH=/api/auth/me
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Backend origin without a trailing slash. |
| `VITE_AUTH_LOGIN_PATH` | Yes | Email/password login endpoint. |
| `VITE_AUTH_SESSION_PATH` | Yes | Endpoint that returns the authenticated user. |

All `VITE_*` values are public browser configuration. Never put database credentials, password hashes, or the JWT secret in the frontend environment.

### Backend

File:

```text
C:\Users\PC\Medlink-Backend\.env
```

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | Backend HTTP port. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `JWT_SECRET` | Yes | Secret used to sign and verify MedLink access tokens. |
| `JWT_EXPIRES_IN` | No | JWT lifetime. Defaults to `7d`. |
| `BCRYPT_ROUNDS` | No | bcrypt cost factor. Defaults to `12`. |

## Authentication API

### Assign Account

```http
POST /api/auth/register
Content-Type: application/json
Authorization: Bearer <staff-token>
```

Request:

```json
{
  "email": "user@example.com",
  "password": "a-secure-password",
  "role": "doctor",
  "profile_id": "D01"
}
```

Successful response:

```http
HTTP/1.1 201 Created
```

```json
{
  "user": {
    "user_id": "1",
    "email": "user@example.com",
    "full_name": null,
    "avatar_url": null,
    "role": "doctor",
    "profile_id": "D01"
  }
}
```

Only a signed-in `staff` account can call this endpoint. Doctor, nurse, and patient accounts require a matching clinic profile ID. Staff accounts may use `null` for `profile_id`.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "user@example.com",
  "password": "a-secure-password"
}
```

Successful response:

```http
HTTP/1.1 200 OK
```

The response includes `access_token`, `token_type`, `expires_in`, and a user object containing `role` and `profile_id`.

### Current User

```http
GET /api/auth/me
Authorization: Bearer <medlink-jwt>
```

Response:

```json
{
  "user_id": "1",
  "email": "user@example.com",
  "full_name": null,
  "avatar_url": null,
  "role": "doctor",
  "profile_id": "D01"
}
```

### Sign-Out

The MedLink token is stateless, so sign-out is handled by removing:

```text
medlink_access_token
```

from `sessionStorage`.

### Authentication Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid credentials, role, profile assignment, or password policy failure. |
| `401` | Invalid email/password or expired/invalid JWT. |
| `403` | The authenticated role cannot access the requested operation. |
| `409` | The email or clinic profile is already assigned. |
| `500` | Database or authentication configuration failure. |

Protected API `401` responses automatically clear the frontend token and return the user to the login page.

## Password Security

The backend:

- Normalizes email addresses to lowercase.
- Requires a valid email format.
- Requires passwords between 8 and 128 characters.
- Hashes passwords with `bcryptjs`.
- Uses a default bcrypt cost factor of `12`.
- Stores only `password_hash`.
- Returns a generic `Invalid email or password` message for login failures.
- Never includes password hashes in API responses.

The frontend:

- Uses `type="password"`.
- Uses the `current-password` autocomplete value.
- Stores no password after submission.
- Stores the JWT in `sessionStorage`, not `localStorage`.

## Database Migration

Migrations:

```text
C:\Users\PC\Medlink-Backend\config\migrations\001_add_users.sql
C:\Users\PC\Medlink-Backend\config\migrations\002_replace_google_auth_with_password.sql
C:\Users\PC\Medlink-Backend\config\migrations\003_add_role_based_access.sql
```

Together they:

1. Create the users table and password authentication fields.
2. Add a case-insensitive unique email index.
3. Add required `role` values: `staff`, `doctor`, `nurse`, or `patient`.
4. Add `profile_id` for linking doctor, nurse, and patient accounts to clinic records.
5. Prevent the same role/profile pair from being assigned more than once.

Existing accounts without a role are migrated to `staff`. Review those assignments before production use.

## Clinic API

Every clinic request sends:

```http
Authorization: Bearer <medlink-jwt>
```

| Resource | Base route |
| --- | --- |
| Patients | `/api/patients` |
| Doctors | `/api/doctors` |
| Nurses | `/api/nurses` |
| Staff | `/api/staff` |
| Appointments | `/api/appointments` |
| Medical records | `/api/medical-records` |
| Billing | `/api/billing` |

Supported operations:

```text
GET    /api/resource
GET    /api/resource/:id
POST   /api/resource
PUT    /api/resource/:id
DELETE /api/resource/:id
```

Specialized routes:

```text
GET /api/appointments/patient/:patientId
GET /api/appointments/doctor/:doctorId
GET /api/appointments/nurse/:nurseId
GET /api/medical-records/patient/:patientId
GET /api/billing/patient/:patientId
```

### Role Access

| Area | Staff | Doctor | Nurse | Patient |
| --- | --- | --- | --- | --- |
| Dashboard | View | View | View | View |
| Patients | View/manage | View | View | Own profile |
| Doctors | View/manage | View | View | View |
| Nurses | View/manage | View | View | No access |
| Appointments | View/manage | Assigned/update | Assigned/update | Own/create |
| Billing | View/manage | No access | No access | Own records |
| Reports | View | View | No access | No access |
| Medical records | View/manage | View | View/update | Own records |

The backend enforces resource ownership for patient, doctor, and nurse accounts. Frontend visibility is only a usability layer and is not the security boundary.

## CORS

The frontend uses bearer authorization and does not use cross-origin authentication cookies.

The backend must allow:

```http
Access-Control-Allow-Origin: http://127.0.0.1:5173
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

Use the same hostname consistently. Do not mix `localhost` and `127.0.0.1`.

## Offline Data Behavior

Authentication is never bypassed offline.

After a user has a valid JWT:

- Clinic resources load independently.
- A failed clinic endpoint does not hide the entire application.
- Only `staff` accounts can use local fallback records and offline changes.
- Staff fallback data is stored under an account-scoped `medlink_offline_v1:<account-id>` key.
- Doctor, nurse, and patient accounts receive no cached clinic-wide fallback data.
- The connection banner provides a **Reconnect** action.

Closing the browser tab removes the JWT because it is stored in `sessionStorage`.

## Available Scripts

```bash
npm run dev
```

Starts Vite.

```bash
npm run build
```

Creates the production build in `dist/`.

```bash
npm run preview
```

Serves the production build.

```bash
npm run test:smoke
```

Runs the browser smoke suite with a mock password backend.

Backend:

```bash
npm test
```

Runs password hashing, JWT, and authentication middleware tests.

## Testing

The frontend smoke suite verifies:

- Protected-route redirect
- Assigned-account email/password login
- Role-based route and control visibility
- JWT storage and restoration
- Bearer authorization headers
- Patient, doctor, and nurse workflows
- Appointment and billing workflows
- Reports and CSV export
- Offline record fallback
- Sign-out
- Mobile navigation

Run:

```bash
npm run build
npm run test:smoke
```

Backend:

```powershell
Set-Location C:\Users\PC\Medlink-Backend
npm test
```

## Project Structure

```text
Medlink-Website/
|-- scripts/
|   `-- smoke.mjs
|-- src/
|   |-- auth/
|   |   `-- accessControl.js
|   |-- components/
|   |   |-- auth/
|   |   |   `-- ProtectedRoute.jsx
|   |   |-- charts/
|   |   |-- common/
|   |   `-- layout/
|   |-- context/
|   |   |-- AuthContext.jsx
|   |   |-- MedLinkContext.jsx
|   |   `-- ToastContext.jsx
|   |-- pages/
|   |   |-- LoginPage.jsx
|   |   |-- DashboardPage.jsx
|   |   |-- PatientsPage.jsx
|   |   |-- DoctorsPage.jsx
|   |   |-- NursesPage.jsx
|   |   |-- AppointmentsPage.jsx
|   |   |-- BillingPage.jsx
|   |   `-- ReportsPage.jsx
|   |-- services/
|   |   |-- apiClient.js
|   |   |-- authService.js
|   |   |-- tokenStorage.js
|   |   `-- clinic services
|   |-- App.jsx
|   `-- main.jsx
|-- .env.example
|-- README.md
|-- package.json
|-- style.css
`-- vite.config.js
```

Backend authentication files:

```text
Medlink-Backend/
|-- config/
|   |-- auth.js
|   `-- migrations/
|       |-- 001_add_users.sql
|       |-- 002_replace_google_auth_with_password.sql
|       `-- 003_add_role_based_access.sql
|-- controllers/authController.js
|-- middleware/
|   |-- authenticate.js
|   |-- authorize.js
|   `-- resourceAccess.js
|-- models/userModel.js
|-- routes/authRoutes.js
|-- services/
|   |-- passwordService.js
|   `-- tokenService.js
`-- tests/auth.test.js
```

## Deployment Checklist

### Frontend

- Set the production `VITE_API_URL`.
- Build with `npm run build`.
- Serve over HTTPS.
- Configure SPA fallback to `index.html`.

### Backend

- Use a strong production `JWT_SECRET`.
- Configure PostgreSQL securely.
- Apply all three users-table migrations.
- Review migrated `staff` role assignments and linked profile IDs.
- Set an appropriate JWT lifetime.
- Keep bcrypt rounds at an acceptable security/performance level.
- Restrict CORS to the production frontend.
- Serve over HTTPS.
- Add rate limiting to login and account-assignment routes.
- Add authentication audit logging.

## Troubleshooting

### `Failed to fetch`

Confirm the backend is running:

```text
http://127.0.0.1:5000/
```

Expected:

```text
Medlink Backend is running
```

### `127.0.0.1 refused to connect`

Start the backend:

```powershell
Set-Location C:\Users\PC\Medlink-Backend
npm start
```

### Account assignment returns `403`

Only a signed-in `staff` account can call `POST /api/auth/register`.

### Account assignment returns `409`

The email or linked role/profile pair is already assigned.

### Login returns `Invalid email or password`

Check the normalized email and assigned password. Confirm the account has a valid role and that doctor, nurse, or patient accounts have the correct linked profile ID.

### Backend reports missing authentication columns

Apply:

```text
config/migrations/002_replace_google_auth_with_password.sql
config/migrations/003_add_role_based_access.sql
```

### Backend reports `Authentication is not configured`

Confirm `JWT_SECRET` exists in the backend `.env`, then restart the backend.

### API returns `401`

The JWT is missing or expired. Sign in again.

### CORS error

Confirm the backend accepts:

```text
Origin: http://127.0.0.1:5173
Header: Authorization
```

### Local-record banner appears

Authentication succeeded, but a clinic endpoint failed. Staff can use account-scoped local records; other roles wait for the API to reconnect.

## Security Notes

- Never store plaintext passwords.
- Never return `password_hash`.
- Keep `JWT_SECRET` and database credentials backend-only.
- Use HTTPS in production.
- Add login and account-assignment rate limits.
- Consider email verification before allowing sensitive clinic access.
- Provision accounts through an audited clinic-administration workflow.
- Use short JWT lifetimes appropriate for clinic policy.
- Review and encrypt browser-stored offline clinical data before production use.
