import {
  BriefcaseMedical,
  CircleUserRound,
  Stethoscope,
  UserPlus,
  X
} from "lucide-react";
import { useState } from "react";
import { hasPermission, PERMISSIONS, ROLES } from "../auth/accessControl";
import FormField from "../components/common/FormField";
import PageHeading from "../components/common/PageHeading";
import PanelHeader from "../components/common/PanelHeader";
import PersonCell from "../components/common/PersonCell";
import { useAuth } from "../context/AuthContext";
import { useMedLink } from "../context/MedLinkContext";
import { useToast } from "../context/ToastContext";
import { addDays, formatDate, today } from "../utils/date";

const emptyDoctor = {
  firstName: "",
  lastName: "",
  dob: "",
  phone: "",
  address: "",
  specialization: "",
  dateOfEmployment: ""
};

const phonePattern = /^\+?[\d\s()-]{7,20}$/;

function validateDoctor(doctor) {
  const errors = {};
  const requiredFields = {
    firstName: "First name",
    lastName: "Last name",
    dob: "Date of birth",
    phone: "Contact information",
    address: "Address",
    specialization: "Specialization",
    dateOfEmployment: "Date of employment"
  };

  Object.entries(requiredFields).forEach(([name, label]) => {
    if (!String(doctor[name] || "").trim()) {
      errors[name] = `${label} is required.`;
    }
  });

  if (doctor.dob && doctor.dob >= today()) {
    errors.dob = "Date of birth must be before today.";
  }
  if (doctor.phone && !phonePattern.test(doctor.phone)) {
    errors.phone = "Enter a valid phone number using 7-15 digits.";
  }
  if (doctor.dateOfEmployment && doctor.dateOfEmployment > today()) {
    errors.dateOfEmployment = "Employment date cannot be in the future.";
  }
  if (doctor.dob && doctor.dateOfEmployment && doctor.dateOfEmployment <= doctor.dob) {
    errors.dateOfEmployment = "Employment date must be after the date of birth.";
  }

  return errors;
}

export default function DoctorsPage() {
  const { refreshSession, user } = useAuth();
  const canManageDoctors = hasPermission(user?.role, PERMISSIONS.DOCTORS_MANAGE);
  const isDoctorAccount = user?.role === ROLES.DOCTOR;
  const canRegisterDoctor = canManageDoctors || (isDoctorAccount && !user?.profileId);
  const { doctors, addDoctor } = useMedLink();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyDoctor);
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
    setForm(emptyDoctor);
    setErrors({});
    setStatus("");
    setRequestError(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateDoctor(form);
    setErrors(validationErrors);
    setRequestError(false);

    if (Object.keys(validationErrors).length) {
      setStatus("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Registering doctor...");
    try {
      const record = await addDoctor(form);
      if (isDoctorAccount) {
        await refreshSession();
      }
      setForm(emptyDoctor);
      setStatus(`${record.doctorId} was registered successfully.`);
      showToast(
        "Doctor registered",
        `${record.firstName} ${record.lastName} is now available for appointments.`
      );
    } catch (error) {
      const message = error.message || "Unable to register the doctor.";
      setRequestError(true);
      setStatus(message);
      showToast("Doctor registration failed", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function fieldClass(name) {
    return errors[name] ? "invalid" : "";
  }

  return (
    <section className="view" aria-labelledby="doctorsHeading">
      <PageHeading
        eyebrow="Clinical team"
        title={canRegisterDoctor ? "Doctor Registration" : "Doctor Directory"}
        titleId="doctorsHeading"
        description={canRegisterDoctor
          ? "Register clinicians so they can be assigned to patient appointments."
          : "Review clinicians available for patient appointments."}
        actions={canRegisterDoctor ? (
          <div className="page-badge">
            <Stethoscope />
            New doctors sync to the database
          </div>
        ) : null}
      />

      {canRegisterDoctor && <section className="form-panel">
        <div className="section-heading">
          <span className="section-icon section-icon-green"><CircleUserRound /></span>
          <div>
            <h3>Professional profile</h3>
            <p>Complete the required identity and clinical details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <FormField label="First Name" htmlFor="doctorFirstName" required error={errors.firstName}>
              <input
                className={fieldClass("firstName")}
                id="doctorFirstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Enter first name"
                value={form.firstName}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Last Name" htmlFor="doctorLastName" required error={errors.lastName}>
              <input
                className={fieldClass("lastName")}
                id="doctorLastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Enter last name"
                value={form.lastName}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Date of Birth" htmlFor="doctorDob" required error={errors.dob}>
              <input
                className={fieldClass("dob")}
                id="doctorDob"
                name="dob"
                type="date"
                max={addDays(today(), -1)}
                value={form.dob}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Specialization" htmlFor="doctorSpecialization" required error={errors.specialization}>
              <input
                className={fieldClass("specialization")}
                id="doctorSpecialization"
                name="specialization"
                type="text"
                placeholder="e.g. Cardiology"
                value={form.specialization}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Contact Information" htmlFor="doctorPhone" required hint="Use 7-15 digits; spaces, +, brackets, and hyphens are allowed." error={errors.phone}>
              <input
                className={fieldClass("phone")}
                id="doctorPhone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+234 801 234 5678"
                value={form.phone}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Date of Employment" htmlFor="doctorEmploymentDate" required error={errors.dateOfEmployment}>
              <input
                className={fieldClass("dateOfEmployment")}
                id="doctorEmploymentDate"
                name="dateOfEmployment"
                type="date"
                max={today()}
                value={form.dateOfEmployment}
                onChange={handleChange}
              />
            </FormField>
            <FormField className="span-2" label="Address" htmlFor="doctorAddress" required error={errors.address}>
              <textarea
                className={fieldClass("address")}
                id="doctorAddress"
                name="address"
                rows="3"
                autoComplete="street-address"
                placeholder="Residential or clinic address"
                value={form.address}
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
                {isSubmitting ? "Registering..." : "Register Doctor"}
              </button>
            </div>
          </div>
        </form>
      </section>}

      {isDoctorAccount && user?.profileId && (
        <section className="form-panel registration-complete">
          <div className="section-heading">
            <span className="section-icon section-icon-green"><Stethoscope /></span>
            <div>
              <h3>Registration complete</h3>
              <p>Your doctor profile is linked to this account as {user.profileId}.</p>
            </div>
          </div>
        </section>
      )}

      <section className="panel table-panel">
        <PanelHeader
          icon={BriefcaseMedical}
          title="Registered Doctors"
          description="Doctors in this directory are available in appointment booking."
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor ID</th>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Contact</th>
                <th>Date of Employment</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length ? doctors.map(doctor => (
                <tr key={doctor.doctorId}>
                  <td><span className="table-id">{doctor.doctorId}</span></td>
                  <td>
                    <PersonCell
                      compact
                      doctor
                      person={doctor}
                      title={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                      subtitle={doctor.address || "Clinical team member"}
                    />
                  </td>
                  <td>{doctor.specialization || "General practice"}</td>
                  <td>{doctor.phone || "-"}</td>
                  <td>
                    {doctor.dateOfEmployment
                      ? formatDate(doctor.dateOfEmployment)
                      : "Not recorded"}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">No doctors are registered yet.</div>
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
