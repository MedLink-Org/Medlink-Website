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

function locationPath(location) {
  const from = location.state?.from;
  return from ? `${from.pathname}${from.search}${from.hash}` : "/";
}

function validate(mode, email, password, patientId, confirmPassword) {
  const errors = {};
  if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (mode === "signup" && !patientId.trim()) {
    errors.patientId = "Enter the Patient ID from your clinic record.";
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
  const [patientId, setPatientId] = useState("");
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
      patientId,
      confirmPassword
    );
    setErrors(validationErrors);
    setRequestError("");
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === "signup") {
        await signUp(normalizedEmail, password, patientId.trim());
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
              ? "Link a new patient account to your existing clinic record."
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
              <label htmlFor="authPatientId">Patient ID</label>
              <div className={`auth-input ${errors.patientId ? "invalid" : ""}`}>
                <IdCard />
                <input
                  id="authPatientId"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. P001"
                  value={patientId}
                  onChange={event => {
                    setPatientId(event.target.value);
                    setRequestError("");
                    if (errors.patientId) {
                      setErrors(current => ({ ...current, patientId: "" }));
                    }
                  }}
                />
              </div>
              <span className="field-error">{errors.patientId}</span>
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
            ? "Patient signup requires an existing unclaimed Patient ID."
            : "Staff and clinician roles are assigned by clinic administration."}
        </p>
      </section>
    </main>
  );
}
