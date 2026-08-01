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
  phone: "",
  address: "",
  dateOfEmployment: ""
};

const phonePattern = /^\+?[\d\s()-]{7,20}$/;

function validateNurse(nurse) {
  const errors = {};
  const requiredFields = {
    firstName: "First name",
    lastName: "Last name",
    dob: "Date of birth",
    phone: "Contact information",
    address: "Address",
    dateOfEmployment: "Date of employment"
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
  if (nurse.dateOfEmployment && nurse.dateOfEmployment > today()) {
    errors.dateOfEmployment = "Employment date cannot be in the future.";
  }
  if (nurse.dob && nurse.dateOfEmployment && nurse.dateOfEmployment <= nurse.dob) {
    errors.dateOfEmployment = "Employment date must be after the date of birth.";
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
          ? "Register nursing professionals and record their contact details."
          : "Review nursing professionals and their contact details."}
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
            <p>Complete the nurse's identity, address, and employment details.</p>
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
            <FormField label="Contact Information" htmlFor="nursePhone" required hint="Use 7-15 digits; spaces, +, brackets, and hyphens are allowed." error={errors.phone}>
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
            <FormField className="span-2" label="Address" htmlFor="nurseAddress" required error={errors.address}>
              <input
                className={fieldClass("address")}
                id="nurseAddress"
                name="address"
                type="text"
                autoComplete="street-address"
                placeholder="Residential or clinic address"
                value={form.address}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Date of Employment" htmlFor="nurseEmploymentDate" required error={errors.dateOfEmployment}>
              <input className={fieldClass("dateOfEmployment")} id="nurseEmploymentDate" name="dateOfEmployment" type="date" max={today()} value={form.dateOfEmployment} onChange={handleChange} />
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
          description="Review nursing staff by contact and employment details."
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nurse ID</th>
                <th>Nurse</th>
                <th>Date of Birth</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Date of Employment</th>
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
                      subtitle={nurse.address || "Clinical team member"}
                    />
                  </td>
                  <td>{nurse.dob ? formatDate(nurse.dob) : "Not recorded"}</td>
                    <td>{nurse.phone || "-"}</td>
                    <td>{nurse.address || "-"}</td>
                    <td>{nurse.dateOfEmployment ? formatDate(nurse.dateOfEmployment) : "Not recorded"}</td>
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
