import {
  CircleAlert,
  IdCard,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const signupRoles = [
  { value: "patient", label: "Patient", needsProfile: true },
  { value: "doctor", label: "Doctor", needsProfile: true },
  { value: "nurse", label: "Nurse", needsProfile: true },
  { value: "staff", label: "Staff", needsProfile: false }
];

function locationPath(location) {
  const from = location.state?.from;
  return from ? `${from.pathname}${from.search}${from.hash}` : "/";
}

function validate(mode, email, password, role, profileId, confirmPassword) {
  const errors = {};
  if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (mode === "signup" && role !== "staff" && !profileId.trim()) {
    errors.profileId = `Enter the ${role} profile ID from your clinic record.`;
  }
  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (mode === "signup" && confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

export default function LoginPage() {
  const { authenticated, error, loading, signIn, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("patient");
  const [profileId, setProfileId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const returnTo = locationPath(location);

  if (!loading && authenticated) {
    return <Navigate to={returnTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(
      mode,
      email,
      password,
      role,
      profileId,
      confirmPassword
    );
    setErrors(validationErrors);
    setRequestError("");
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === "signup") {
        await signUp(normalizedEmail, password, role, profileId.trim());
      } else {
        await signIn(normalizedEmail, password);
      }
      navigate(returnTo, { replace: true });
    } catch (authenticationError) {
      setRequestError(authenticationError.message || "Authentication could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="loginHeading">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true"><Stethoscope /></span>
          <div>
            <strong>MedLink</strong>
            <small>Clinic Management</small>
          </div>
        </div>

        <div className="auth-copy">
          <span className="auth-icon" aria-hidden="true"><ShieldCheck /></span>
          <p className="eyebrow">Secure clinic access</p>
          <h1 id="loginHeading">
            {mode === "signup" ? "Create your MedLink account" : "Sign in to MedLink"}
          </h1>
          <p>
            {mode === "signup"
              ? "Choose your clinic role and link your account to an existing profile."
              : "Use your assigned staff, doctor, nurse, or patient account."}
          </p>
        </div>

        {(requestError || error) && (
          <div className="auth-alert" role="alert">
            <CircleAlert />
            <span>{requestError || error}</span>
          </div>
        )}

        <div className="auth-mode" aria-label="Authentication method">
          <button
            className={mode === "signin" ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("signin");
              setErrors({});
              setRequestError("");
            }}
          >
            Sign In
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("signup");
              setErrors({});
              setRequestError("");
            }}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="authEmail">Email Address</label>
          <div className={`auth-input ${errors.email ? "invalid" : ""}`}>
            <Mail />
            <input
              id="authEmail"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={event => {
                setEmail(event.target.value);
                setRequestError("");
                if (errors.email) setErrors(current => ({ ...current, email: "" }));
              }}
            />
          </div>
          <span className="field-error">{errors.email}</span>

          {mode === "signup" && (
            <>
              <label htmlFor="authRole">Account Type</label>
              <select
                id="authRole"
                className={errors.role ? "invalid" : ""}
                value={role}
                onChange={event => {
                  setRole(event.target.value);
                  setProfileId("");
                  setRequestError("");
                }}
              >
                {signupRoles.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
              <span className="field-error">{errors.role}</span>

              {role !== "staff" && (
                <>
              <label htmlFor="authProfileId">{signupRoles.find(option => option.value === role)?.label} Profile ID</label>
              <div className={`auth-input ${errors.profileId ? "invalid" : ""}`}>
                <IdCard />
                <input
                  id="authProfileId"
                  type="text"
                  autoComplete="off"
                  placeholder={role === "doctor" ? "e.g. D001" : role === "nurse" ? "e.g. N001" : "e.g. P001"}
                  value={profileId}
                  onChange={event => {
                    setProfileId(event.target.value);
                    setRequestError("");
                    if (errors.profileId) {
                      setErrors(current => ({ ...current, profileId: "" }));
                    }
                  }}
                />
              </div>
              <span className="field-error">{errors.profileId}</span>
                </>
              )}
            </>
          )}

          <label htmlFor="authPassword">Password</label>
          <div className={`auth-input ${errors.password ? "invalid" : ""}`}>
            <LockKeyhole />
            <input
              id="authPassword"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={event => {
                setPassword(event.target.value);
                setRequestError("");
                if (errors.password) setErrors(current => ({ ...current, password: "" }));
              }}
            />
          </div>
          <span className="field-error">{errors.password}</span>

          {mode === "signup" && (
            <>
              <label htmlFor="authConfirmPassword">Confirm Password</label>
              <div className={`auth-input ${errors.confirmPassword ? "invalid" : ""}`}>
                <LockKeyhole />
                <input
                  id="authConfirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter the password again"
                  value={confirmPassword}
                  onChange={event => {
                    setConfirmPassword(event.target.value);
                    setRequestError("");
                    if (errors.confirmPassword) {
                      setErrors(current => ({ ...current, confirmPassword: "" }));
                    }
                  }}
                />
              </div>
              <span className="field-error">{errors.confirmPassword}</span>
            </>
          )}

          <button className="button button-primary auth-submit" type="submit" disabled={submitting || loading}>
            {mode === "signup" ? <UserPlus /> : <LogIn />}
            {submitting
              ? (mode === "signup" ? "Creating account..." : "Signing in...")
              : (mode === "signup" ? "Create Account" : "Sign In")}
          </button>
        </form>

        <p className="auth-footnote">
          {mode === "signup"
            ? "Doctor, nurse, and patient signup requires an existing unclaimed clinic profile ID."
            : "Staff and clinician roles are assigned by clinic administration."}
        </p>
      </section>
    </main>
  );
}
