import {
  FolderHeart,
  Search,
  ShieldCheck,
  UserPlus,
  UserRoundPlus,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FormField from "../components/common/FormField";
import PageHeading from "../components/common/PageHeading";
import PanelHeader from "../components/common/PanelHeader";
import PersonCell from "../components/common/PersonCell";
import { useMedLink } from "../context/MedLinkContext";
import { useToast } from "../context/ToastContext";
import { addDays, formatDate, today } from "../utils/date";

const emptyPatient = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  bloodType: "",
  genotype: "",
  medicalHistory: ""
};

const phonePattern = /^\+?[\d\s()-]{7,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePatient(patient) {
  const errors = {};
  const requiredFields = {
    firstName: "First name",
    lastName: "Last name",
    dob: "Date of birth",
    gender: "Gender",
    phone: "Phone number",
    email: "Email address",
    address: "Address"
  };

  Object.entries(requiredFields).forEach(([name, label]) => {
    if (!String(patient[name] || "").trim()) errors[name] = `${label} is required.`;
  });
  if (patient.phone && !phonePattern.test(patient.phone)) {
    errors.phone = "Enter a valid phone number using 7-15 digits.";
  }
  if (patient.email && !emailPattern.test(patient.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (patient.dob && patient.dob >= today()) {
    errors.dob = "Date of birth must be before today.";
  }
  return errors;
}

export default function PatientsPage() {
  const { patients, appointments, addPatient } = useMedLink();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(emptyPatient);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const query = searchParams.get("q") || "";

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return patients.filter(patient => {
      const searchable = [
        patient.patientId,
        patient.firstName,
        patient.lastName,
        patient.phone,
        patient.email
      ].join(" ").toLowerCase();
      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [patients, query]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors(current => ({ ...current, [name]: "" }));
    }
  }

  function resetForm() {
    setForm(emptyPatient);
    setErrors({});
    setStatus("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validatePatient(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setStatus("Please correct the highlighted fields.");
      return;
    }

    const record = addPatient(form);
    setForm(emptyPatient);
    setStatus(`${record.patientId} was registered successfully.`);
    showToast("Patient registered", `${record.firstName} ${record.lastName} was added as ${record.patientId}.`);
  }

  function fieldClass(name) {
    return errors[name] ? "invalid" : "";
  }

  return (
    <section className="view" aria-labelledby="patientsHeading">
      <PageHeading
        eyebrow="Patient records"
        title="Patient Registration"
        titleId="patientsHeading"
        description="Create a secure patient profile and medical record."
        actions={(
          <div className="page-badge">
            <ShieldCheck />
            Required fields are protected
          </div>
        )}
      />

      <section className="form-panel">
        <div className="section-heading">
          <span className="section-icon"><UserRoundPlus /></span>
          <div>
            <h3>Personal and contact information</h3>
            <p>Fields marked with an asterisk are required.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <FormField label="First Name" htmlFor="firstName" required hint="Use the patient's legal first name." error={errors.firstName}>
              <input className={fieldClass("firstName")} id="firstName" name="firstName" type="text" autoComplete="given-name" placeholder="Enter first name" value={form.firstName} onChange={handleChange} />
            </FormField>
            <FormField label="Last Name" htmlFor="lastName" required hint="Use the patient's legal surname." error={errors.lastName}>
              <input className={fieldClass("lastName")} id="lastName" name="lastName" type="text" autoComplete="family-name" placeholder="Enter last name" value={form.lastName} onChange={handleChange} />
            </FormField>
            <FormField label="Date of Birth" htmlFor="dob" required hint="Patient must have a valid past date of birth." error={errors.dob}>
              <input className={fieldClass("dob")} id="dob" name="dob" type="date" max={addDays(today(), -1)} value={form.dob} onChange={handleChange} />
            </FormField>
            <FormField label="Gender" htmlFor="gender" required hint="Select the patient's recorded gender." error={errors.gender}>
              <select className={fieldClass("gender")} id="gender" name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </FormField>
            <FormField label="Phone Number" htmlFor="phone" required hint="Use 7-15 digits; spaces, +, brackets, and hyphens are allowed." error={errors.phone}>
              <input className={fieldClass("phone")} id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+234 801 234 5678" value={form.phone} onChange={handleChange} />
            </FormField>
            <FormField label="Email Address" htmlFor="email" required hint="Enter a valid email for appointment updates." error={errors.email}>
              <input className={fieldClass("email")} id="email" name="email" type="email" autoComplete="email" placeholder="patient@example.com" value={form.email} onChange={handleChange} />
            </FormField>
            <FormField className="span-2" label="Residential Address" htmlFor="address" required hint="Include enough detail for patient identification and correspondence." error={errors.address}>
              <textarea className={fieldClass("address")} id="address" name="address" rows="3" autoComplete="street-address" placeholder="Street address, city, and state" value={form.address} onChange={handleChange} />
            </FormField>
            <FormField label="Blood Type" htmlFor="bloodType" hint="Leave as unknown if it has not been confirmed." error={errors.bloodType}>
              <select id="bloodType" name="bloodType" value={form.bloodType} onChange={handleChange}>
                <option value="">Unknown</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(type => <option key={type}>{type}</option>)}
              </select>
            </FormField>
            <FormField label="Genotype" htmlFor="genotype" hint="Only record a clinically confirmed result." error={errors.genotype}>
              <select id="genotype" name="genotype" value={form.genotype} onChange={handleChange}>
                <option value="">Unknown</option>
                {["AA", "AS", "SS", "AC"].map(type => <option key={type}>{type}</option>)}
              </select>
            </FormField>
            <FormField className="span-2" label="Medical History" htmlFor="medicalHistory" hint="Do not include unverified diagnoses." error={errors.medicalHistory}>
              <textarea id="medicalHistory" name="medicalHistory" rows="4" placeholder="Allergies, chronic conditions, current medication, or relevant notes" value={form.medicalHistory} onChange={handleChange} />
            </FormField>
          </div>

          <div className="form-footer">
            <div className={`form-status ${Object.keys(errors).length ? "error" : ""}`} aria-live="polite">{status}</div>
            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={resetForm}>
                <X />
                Cancel
              </button>
              <button className="button button-primary" type="submit">
                <UserPlus />
                Register Patient
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="panel table-panel">
        <PanelHeader
          icon={FolderHeart}
          title="Patient Directory"
          description="Search and review registered patient records."
          action={(
            <label className="table-search">
              <Search />
              <span className="sr-only">Search patient directory</span>
              <input
                type="search"
                placeholder="Search name, ID, or phone"
                value={query}
                onChange={event => {
                  const value = event.target.value;
                  setSearchParams(value ? { q: value } : {});
                }}
              />
            </label>
          )}
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient</th>
                <th>Contact</th>
                <th>Date of Birth</th>
                <th>Blood Type</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length ? filteredPatients.map(patient => {
                const visits = appointments
                  .filter(appointment => appointment.patientId === patient.patientId && appointment.status === "Completed")
                  .sort((a, b) => b.date.localeCompare(a.date));
                return (
                  <tr key={patient.patientId}>
                    <td><span className="table-id">{patient.patientId}</span></td>
                    <td>
                      <PersonCell
                        compact
                        person={patient}
                        title={`${patient.firstName} ${patient.lastName}`}
                        subtitle={`${patient.gender} - ${patient.email || "No email"}`}
                      />
                    </td>
                    <td>{patient.phone || "-"}</td>
                    <td>{formatDate(patient.dob)}</td>
                    <td>{patient.bloodType || "Unknown"}</td>
                    <td>{visits.length ? formatDate(visits[0].date) : "No completed visit"}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6"><div className="empty-state">No patient records match your search.</div></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
