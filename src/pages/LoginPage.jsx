import {
  CircleAlert,
  Eye,
  EyeOff,
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
  { value: "staff", label: "Administrative Staff" },
  { value: "patient", label: "Patient" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" }
];

function locationPath(location) {
  const from = location.state?.from;
  return from ? `${from.pathname}${from.search}${from.hash}` : "/";
}

function onboardingPath(user) {
  if (user?.profileId) return "";
  if (user?.role === "doctor") return "/doctors";
  if (user?.role === "nurse") return "/nurses";
  if (user?.role === "patient") return "/patients";
  return "";
}

function validate(mode, email, password, confirmPassword) {
  const errors = {};
  if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address.";
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
  const { authenticated, error, loading, signIn, signUp, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("patient");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const returnTo = locationPath(location);

  if (!loading && authenticated && !submitting) {
    return <Navigate to={onboardingPath(user) || returnTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(
      mode,
      email,
      password,
      confirmPassword
    );
    setErrors(validationErrors);
    setRequestError("");
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      let authenticatedUser;
      if (mode === "signup") {
        authenticatedUser = await signUp(normalizedEmail, password, role);
      } else {
        authenticatedUser = await signIn(normalizedEmail, password);
      }
      navigate(onboardingPath(authenticatedUser) || returnTo, { replace: true });
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
              ? "Choose an administrative staff, patient, doctor, or nurse account."
              : "Use your administrative staff, doctor, nurse, or patient account."}
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
                  setRequestError("");
                }}
              >
                {signupRoles.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
              <span className="field-error">{errors.role}</span>
            </>
          )}

          <label htmlFor="authPassword">Password</label>
          <div className={`auth-input ${errors.password ? "invalid" : ""}`}>
            <LockKeyhole />
            <input
              id="authPassword"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={event => {
                setPassword(event.target.value);
                setRequestError("");
                if (errors.password) setErrors(current => ({ ...current, password: "" }));
              }}
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword(current => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <span className="field-error">{errors.password}</span>

          {mode === "signup" && (
            <>
              <label htmlFor="authConfirmPassword">Confirm Password</label>
              <div className={`auth-input ${errors.confirmPassword ? "invalid" : ""}`}>
                <LockKeyhole />
                <input
                  id="authConfirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
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
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword(current => !current)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
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
            ? "Clinician and patient accounts continue to their profile registration after account creation."
            : "Sign in with the email and password for your MedLink account."}
        </p>
      </section>
    </main>
  );
}
