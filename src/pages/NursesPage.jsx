import {
  BriefcaseMedical,
  CircleUserRound,
  HeartPulse,
  UserPlus,
  X
} from "lucide-react";
import { useState } from "react";
import { hasPermission, PERMISSIONS } from "../auth/accessControl";
import FormField from "../components/common/FormField";
import PageHeading from "../components/common/PageHeading";
import PanelHeader from "../components/common/PanelHeader";
import PersonCell from "../components/common/PersonCell";
import { useAuth } from "../context/AuthContext";
import { useMedLink } from "../context/MedLinkContext";
import { useToast } from "../context/ToastContext";
import { addDays, formatDate, today } from "../utils/date";

const emptyNurse = {
  firstName: "",
  lastName: "",
  dob: "",
  specialization: "",
  department: "",
  phone: "",
  email: ""
};

const phonePattern = /^\+?[\d\s()-]{7,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateNurse(nurse) {
  const errors = {};
  const requiredFields = {
    firstName: "First name",
    lastName: "Last name",
    dob: "Date of birth",
    specialization: "Specialization",
    department: "Department",
    phone: "Phone number",
    email: "Email address"
  };

  Object.entries(requiredFields).forEach(([name, label]) => {
    if (!String(nurse[name] || "").trim()) {
      errors[name] = `${label} is required.`;
    }
  });
  if (nurse.phone && !phonePattern.test(nurse.phone)) {
    errors.phone = "Enter a valid phone number using 7-15 digits.";
  }
  if (nurse.dob && nurse.dob >= today()) {
    errors.dob = "Date of birth must be before today.";
  }
  if (nurse.email && !emailPattern.test(nurse.email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

export default function NursesPage() {
  const { user } = useAuth();
  const canManageNurses = hasPermission(user?.role, PERMISSIONS.NURSES_MANAGE);
  const { nurses, addNurse } = useMedLink();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyNurse);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [requestError, setRequestError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setRequestError(false);
    if (errors[name]) {
      setErrors(current => ({ ...current, [name]: "" }));
    }
  }

  function resetForm() {
    setForm(emptyNurse);
    setErrors({});
    setStatus("");
    setRequestError(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateNurse(form);
    setErrors(validationErrors);
    setRequestError(false);

    if (Object.keys(validationErrors).length) {
      setStatus("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Registering nurse...");
    try {
      const record = await addNurse(form);
      setForm(emptyNurse);
      setStatus(`${record.nurseId} was registered successfully.`);
      showToast(
        "Nurse registered",
        `${record.firstName} ${record.lastName} was added to the clinical team.`
      );
    } catch (error) {
      const message = error.message || "Unable to register the nurse.";
      setRequestError(true);
      setStatus(message);
      showToast("Nurse registration failed", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function fieldClass(name) {
    return errors[name] ? "invalid" : "";
  }

  return (
    <section className="view" aria-labelledby="nursesHeading">
      <PageHeading
        eyebrow="Nursing team"
        title={canManageNurses ? "Nurse Registration" : "Nurse Directory"}
        titleId="nursesHeading"
        description={canManageNurses
          ? "Register nursing professionals and organize them by department."
          : "Review nursing professionals by department and specialization."}
        actions={canManageNurses ? (
          <div className="page-badge">
            <HeartPulse />
            Nurses join the clinical directory
          </div>
        ) : null}
      />

      {canManageNurses && <section className="form-panel">
        <div className="section-heading">
          <span className="section-icon section-icon-green"><CircleUserRound /></span>
          <div>
            <h3>Professional profile</h3>
            <p>Complete the nurse's identity, department, and contact details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <FormField label="First Name" htmlFor="nurseFirstName" required error={errors.firstName}>
              <input
                className={fieldClass("firstName")}
                id="nurseFirstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Enter first name"
                value={form.firstName}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Last Name" htmlFor="nurseLastName" required error={errors.lastName}>
              <input
                className={fieldClass("lastName")}
                id="nurseLastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Enter last name"
                value={form.lastName}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Date of Birth" htmlFor="nurseDob" required error={errors.dob}>
              <input
                className={fieldClass("dob")}
                id="nurseDob"
                name="dob"
                type="date"
                max={addDays(today(), -1)}
                value={form.dob}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Specialization" htmlFor="nurseSpecialization" required error={errors.specialization}>
              <input
                className={fieldClass("specialization")}
                id="nurseSpecialization"
                name="specialization"
                type="text"
                placeholder="e.g. Emergency Nursing"
                value={form.specialization}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Department" htmlFor="nurseDepartment" required error={errors.department}>
              <select
                className={fieldClass("department")}
                id="nurseDepartment"
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="">Select department</option>
                {[
                  "Outpatient",
                  "Emergency",
                  "Pediatrics",
                  "Surgical",
                  "Maternity",
                  "Medical Ward",
                  "Intensive Care"
                ].map(department => <option key={department}>{department}</option>)}
              </select>
            </FormField>
            <FormField label="Phone Number" htmlFor="nursePhone" required hint="Use 7-15 digits; spaces, +, brackets, and hyphens are allowed." error={errors.phone}>
              <input
                className={fieldClass("phone")}
                id="nursePhone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+234 801 234 5678"
                value={form.phone}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Email Address" htmlFor="nurseEmail" required error={errors.email}>
              <input
                className={fieldClass("email")}
                id="nurseEmail"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nurse@medlink.example"
                value={form.email}
                onChange={handleChange}
              />
            </FormField>
          </div>

          <div className="form-footer">
            <div className={`form-status ${Object.keys(errors).length || requestError ? "error" : ""}`} aria-live="polite">
              {status}
            </div>
            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={resetForm} disabled={isSubmitting}>
                <X />
                Clear
              </button>
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                <UserPlus />
                {isSubmitting ? "Registering..." : "Register Nurse"}
              </button>
            </div>
          </div>
        </form>
      </section>}

      <section className="panel table-panel">
        <PanelHeader
          icon={BriefcaseMedical}
          title="Registered Nurses"
          description="Review nursing staff by department and specialization."
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nurse ID</th>
                <th>Nurse</th>
                <th>Date of Birth</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {nurses.length ? nurses.map(nurse => (
                <tr key={nurse.nurseId}>
                  <td><span className="table-id">{nurse.nurseId}</span></td>
                  <td>
                    <PersonCell
                      compact
                      person={nurse}
                      title={`${nurse.firstName} ${nurse.lastName}`}
                      subtitle={nurse.email}
                    />
                  </td>
                  <td>{nurse.dob ? formatDate(nurse.dob) : "Not recorded"}</td>
                  <td>{nurse.department || "Not assigned"}</td>
                  <td>{nurse.specialization || "General Nursing"}</td>
                  <td>{nurse.phone || "-"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">No nurses are registered yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
