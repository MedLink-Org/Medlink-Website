import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarPlus2,
  Check,
  LogIn,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { hasPermission, PERMISSIONS, ROLES } from "../auth/accessControl";
import FormField from "../components/common/FormField";
import PageHeading from "../components/common/PageHeading";
import PanelHeader from "../components/common/PanelHeader";
import PersonCell from "../components/common/PersonCell";
import StatusBadge from "../components/common/StatusBadge";
import { useMedLink } from "../context/MedLinkContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, formatLongDate, formatTime, today } from "../utils/date";
import { doctorName } from "../utils/format";

function createEmptyAppointment() {
  return {
    patientId: "",
    doctorId: "",
    date: today(),
    time: "",
    visitType: "",
    reason: ""
  };
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const canCreateAppointments = hasPermission(user?.role, PERMISSIONS.APPOINTMENTS_CREATE);
  const canUpdateAppointments = hasPermission(user?.role, PERMISSIONS.APPOINTMENTS_UPDATE);
  const {
    patients,
    doctors,
    appointments,
    patientById,
    doctorById,
    addAppointment,
    setAppointmentStatus
  } = useMedLink();
  const { showToast } = useToast();
  const [form, setForm] = useState(createEmptyAppointment);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("All");
  const [requestError, setRequestError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState("");
  const patientProfileId = user?.role === ROLES.PATIENT ? user.profileId : "";

  const filteredAppointments = useMemo(
    () => appointments
      .filter(appointment => filter === "All" || appointment.status === filter)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [appointments, filter]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setRequestError(false);
    if (errors[name]) {
      setErrors(current => ({ ...current, [name]: "" }));
    }
  }

  function validate() {
    const validationErrors = {};
    const requiredFields = {
      ...(patientProfileId ? {} : { patientId: "Patient" }),
      doctorId: "Doctor",
      date: "Appointment date",
      time: "Appointment time",
      visitType: "Visit type",
      reason: "Reason for visit"
    };

    Object.entries(requiredFields).forEach(([name, label]) => {
      if (!String(form[name] || "").trim()) validationErrors[name] = `${label} is required.`;
    });
    if (form.date && form.date < today()) {
      validationErrors.date = "Appointment date cannot be in the past.";
    }
    if (form.time && (form.time < "08:00" || form.time > "18:00")) {
      validationErrors.time = "Choose a time between 8:00 AM and 6:00 PM.";
    }
    const conflict = appointments.some(appointment =>
      appointment.doctorId === form.doctorId &&
      appointment.date === form.date &&
      appointment.time === form.time &&
      appointment.status !== "Cancelled"
    );
    if (conflict) {
      validationErrors.time = "This doctor already has an appointment at that time.";
    }
    return validationErrors;
  }

  function resetForm() {
    setForm(createEmptyAppointment());
    setErrors({});
    setStatus("");
    setRequestError(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setRequestError(false);
    if (Object.keys(validationErrors).length) {
      setStatus("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Booking appointment...");
    try {
      const record = await addAppointment({
        ...form,
        patientId: patientProfileId || form.patientId
      });
      setForm(createEmptyAppointment());
      setStatus(`${record.appointmentId} was booked successfully.`);
      showToast("Appointment booked", `${record.appointmentId} has been added to the clinic schedule.`);
    } catch (error) {
      const message = error.message || "Unable to book the appointment.";
      setRequestError(true);
      setStatus(message);
      showToast("Appointment booking failed", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStatus(appointmentId, nextStatus) {
    setUpdatingAppointmentId(appointmentId);
    try {
      await setAppointmentStatus(appointmentId, nextStatus);
      showToast("Appointment updated", `The appointment is now ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      showToast(
        "Appointment update failed",
        error.message || "Unable to update the appointment.",
        "error"
      );
    } finally {
      setUpdatingAppointmentId("");
    }
  }

  function fieldClass(name) {
    return errors[name] ? "invalid" : "";
  }

  return (
    <section className="view" aria-labelledby="appointmentsHeading">
      <PageHeading
        eyebrow="Clinic scheduling"
        title="Appointment Management"
        titleId="appointmentsHeading"
        description="Schedule consultations and prevent doctor booking conflicts."
        actions={(
          <span className="date-chip">
            <Calendar />
            <span>{formatLongDate(today())}</span>
          </span>
        )}
      />

      {canCreateAppointments && <section className="form-panel">
        <div className="section-heading">
          <span className="section-icon section-icon-green"><CalendarPlus2 /></span>
          <div>
            <h3>Book an appointment</h3>
            <p>Choose a registered patient, doctor, and available time.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {!patientProfileId && <FormField label="Patient" htmlFor="appointmentPatient" required hint="Register a new patient first if they are not listed." error={errors.patientId}>
              <select className={fieldClass("patientId")} id="appointmentPatient" name="patientId" value={form.patientId} onChange={handleChange}>
                <option value="">Select a registered patient</option>
                {[...patients].sort((a, b) => a.lastName.localeCompare(b.lastName)).map(patient => (
                  <option value={patient.patientId} key={patient.patientId}>
                    {patient.patientId} - {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </FormField>}
            <FormField label="Doctor" htmlFor="appointmentDoctor" required hint="Specialization is shown beside each doctor." error={errors.doctorId}>
              <select className={fieldClass("doctorId")} id="appointmentDoctor" name="doctorId" value={form.doctorId} onChange={handleChange}>
                <option value="">Select a doctor</option>
                {doctors.map(doctor => (
                  <option value={doctor.doctorId} key={doctor.doctorId}>
                    {doctorName(doctor)} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Appointment Date" htmlFor="appointmentDate" required hint="Appointments cannot be booked in the past." error={errors.date}>
              <input className={fieldClass("date")} id="appointmentDate" name="date" type="date" min={today()} value={form.date} onChange={handleChange} />
            </FormField>
            <FormField label="Appointment Time" htmlFor="appointmentTime" required hint="Clinic hours are 8:00 AM to 6:00 PM." error={errors.time}>
              <input className={fieldClass("time")} id="appointmentTime" name="time" type="time" min="08:00" max="18:00" value={form.time} onChange={handleChange} />
            </FormField>
            <FormField label="Visit Type" htmlFor="appointmentType" required hint="This helps staff prepare the appropriate room." error={errors.visitType}>
              <select className={fieldClass("visitType")} id="appointmentType" name="visitType" value={form.visitType} onChange={handleChange}>
                <option value="">Select visit type</option>
                {["New consultation", "Follow-up", "Routine checkup", "Procedure", "Emergency review"].map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Reason for Visit" htmlFor="appointmentReason" required hint="Keep the description short and clinically relevant." error={errors.reason}>
              <input className={fieldClass("reason")} id="appointmentReason" name="reason" type="text" placeholder="Brief reason for consultation" value={form.reason} onChange={handleChange} />
            </FormField>
          </div>

          <div className="form-footer">
            <div className={`form-status ${Object.keys(errors).length || requestError ? "error" : ""}`} aria-live="polite">{status}</div>
            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={resetForm} disabled={isSubmitting}>
                <X />
                Cancel
              </button>
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                <CalendarCheck />
                {isSubmitting ? "Booking..." : "Confirm Appointment"}
              </button>
            </div>
          </div>
        </form>
      </section>}

      <section className="panel table-panel">
        <PanelHeader
          icon={CalendarClock}
          title="Appointment Schedule"
          description="Manage scheduled, completed, and cancelled visits."
          action={(
            <label className="filter-select">
              <span>Status</span>
              <select value={filter} onChange={event => setFilter(event.target.value)}>
                <option value="All">All appointments</option>
                {["Scheduled", "Checked In", "Completed", "Cancelled"].map(option => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          )}
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length ? filteredAppointments.map(appointment => {
                const patient = patientById(appointment.patientId);
                const doctor = doctorById(appointment.doctorId);
                return (
                  <tr key={appointment.appointmentId}>
                    <td>
                      <strong>{formatTime(appointment.time)}</strong><br />
                      <small>{formatDate(appointment.date, { day: "numeric", month: "short" })}</small>
                    </td>
                    <td>
                      <PersonCell
                        compact
                        person={patient}
                        title={patient ? `${patient.firstName} ${patient.lastName}` : appointment.patientId}
                        subtitle={`${appointment.appointmentId} - ${appointment.reason}`}
                      />
                    </td>
                    <td>{doctorName(doctor)}<br /><small>{doctor?.specialization}</small></td>
                    <td>{appointment.visitType}</td>
                    <td><StatusBadge status={appointment.status} /></td>
                    <td>
                      <div className="table-actions">
                        {canUpdateAppointments && appointment.status === "Scheduled" && (
                          <button className="table-action" type="button" disabled={updatingAppointmentId === appointment.appointmentId} onClick={() => updateStatus(appointment.appointmentId, "Checked In")}>
                            <LogIn />Check in
                          </button>
                        )}
                        {canUpdateAppointments && ["Scheduled", "Checked In"].includes(appointment.status) && (
                          <>
                            <button className="table-action" type="button" disabled={updatingAppointmentId === appointment.appointmentId} onClick={() => updateStatus(appointment.appointmentId, "Completed")}>
                              <Check />Complete
                            </button>
                            <button className="table-action danger" type="button" disabled={updatingAppointmentId === appointment.appointmentId} onClick={() => updateStatus(appointment.appointmentId, "Cancelled")}>
                              <X />Cancel
                            </button>
                          </>
                        )}
                        {(!canUpdateAppointments || !["Scheduled", "Checked In"].includes(appointment.status)) && "-"}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="6"><div className="empty-state">No appointments match this status.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
