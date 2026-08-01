import {
  CircleAlert,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function locationPath(location) {
  const from = location.state?.from;
  return from ? `${from.pathname}${from.search}${from.hash}` : "/";
}

function validate(email, password) {
  const errors = {};
  if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

export default function LoginPage() {
  const { authenticated, error, loading, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const returnTo = locationPath(location);

  if (!loading && authenticated) {
    return <Navigate to={returnTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(email, password);
    setErrors(validationErrors);
    setRequestError("");
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
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
          <p className="eyebrow">Secure staff access</p>
          <h1 id="loginHeading">
            Sign in to MedLink
          </h1>
          <p>
            Use the account assigned to your staff, doctor, nurse, or patient profile.
          </p>
        </div>

        {(requestError || error) && (
          <div className="auth-alert" role="alert">
            <CircleAlert />
            <span>{requestError || error}</span>
          </div>
        )}

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

          <label htmlFor="authPassword">Password</label>
          <div className={`auth-input ${errors.password ? "invalid" : ""}`}>
            <LockKeyhole />
            <input
              id="authPassword"
              type="password"
              autoComplete="current-password"
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

          <button className="button button-primary auth-submit" type="submit" disabled={submitting || loading}>
            <LogIn />
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footnote">
          Account roles are assigned by clinic administration and verified by the MedLink backend.
        </p>
      </section>
    </main>
  );
}
