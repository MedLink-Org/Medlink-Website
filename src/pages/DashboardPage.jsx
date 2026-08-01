import {
  Activity,
  CalendarCheck2,
  CalendarPlus,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  DoorOpen,
  HeartPulse,
  LogIn,
  ReceiptText,
  TriangleAlert,
  UserPlus,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { hasPermission, PERMISSIONS } from "../auth/accessControl";
import MiniBarChart from "../components/charts/MiniBarChart";
import EmptyState from "../components/common/EmptyState";
import PageHeading from "../components/common/PageHeading";
import PanelHeader from "../components/common/PanelHeader";
import PersonCell from "../components/common/PersonCell";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import { useMedLink } from "../context/MedLinkContext";
import { useAuth } from "../context/AuthContext";
import { APPOINTMENT_STATUS } from "../utils/appointmentStatus";
import { dateRange, formatDate, formatLongDate, formatTime, today } from "../utils/date";
import { doctorName, formatCurrency } from "../utils/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    appointments,
    bills,
    doctorById,
    patientById
  } = useMedLink();
  const currentDate = today();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = user?.firstName || user?.name?.split(/\s+/)[0] || "there";
  const canManagePatients = hasPermission(user?.role, PERMISSIONS.PATIENTS_MANAGE);
  const canCreateAppointments = hasPermission(user?.role, PERMISSIONS.APPOINTMENTS_CREATE);

  const todaysAppointments = appointments
    .filter(appointment =>
      appointment.date === currentDate
      && appointment.status !== APPOINTMENT_STATUS.CANCELLED
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const completedToday = todaysAppointments.filter(
    item => item.status === APPOINTMENT_STATUS.COMPLETED
  ).length;
  const pendingToday = todaysAppointments.filter(
    item => item.status === APPOINTMENT_STATUS.SCHEDULED
  ).length;
  const pendingBills = bills.filter(bill => bill.status === "Pending");
  const outstanding = pendingBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const uniquePatients = new Set(todaysAppointments.map(item => item.patientId)).size;

  const arrivals = appointments
    .filter(appointment =>
      appointment.date >= currentDate &&
      appointment.status === APPOINTMENT_STATUS.SCHEDULED
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 5);

  const alerts = [
    ...(pendingBills.length ? [{
      icon: ReceiptText,
      title: "Outstanding patient balances",
      message: `${pendingBills.length} bill${pendingBills.length === 1 ? " remains" : "s remain"} unpaid and requires finance desk follow-up.`,
      time: "Today"
    }] : []),
    {
      icon: HeartPulse,
      title: "Clinical record review",
      message: "Confirm Samuel Udo's current cardiac medication before the afternoon review.",
      time: "1 hr"
    }
  ].slice(0, 3);

  const activityData = dateRange(currentDate, 7).map(date => ({
    label: formatDate(date, { weekday: "short" }),
    value: appointments.filter(
      item => item.date === date && item.status !== APPOINTMENT_STATUS.CANCELLED
    ).length
  }));

  return (
    <section className="view" aria-labelledby="dashboardHeading">
      <PageHeading
        eyebrow={formatLongDate(currentDate)}
        title={`${greeting}, ${displayName}`}
        titleId="dashboardHeading"
        description="Monitor appointments, arrivals, patient activity, and urgent clinic tasks."
        actions={canManagePatients || canCreateAppointments ? (
          <div className="heading-actions">
            {canManagePatients && <button className="button button-secondary" type="button" onClick={() => navigate("/patients")}>
              <UserPlus />
              Register patient
            </button>}
            {canCreateAppointments && <button className="button button-primary" type="button" onClick={() => navigate("/appointments")}>
              <CalendarPlus />
              New appointment
            </button>}
          </div>
        ) : null}
      />

      <div className="stat-grid">
        <StatCard icon={Users} label="Total Patients Today" value={uniquePatients} caption={`${todaysAppointments.length} clinic visits scheduled`} />
        <StatCard icon={CalendarCheck2} tone="green" label="Total Appointments" value={todaysAppointments.length} caption={`${completedToday} completed today`} />
        <StatCard icon={Clock3} tone="amber" label="Pending Appointments" value={pendingToday} caption="Awaiting consultation" />
        <StatCard icon={CircleDollarSign} tone="red" label="Pending Bills" value={pendingBills.length} caption={`${formatCurrency(outstanding)} outstanding`} />
      </div>

      <div className="dashboard-layout">
        <section className="panel appointments-panel">
          <PanelHeader
            icon={CalendarRange}
            title="Today's Appointments"
            description="Live schedule for all consulting rooms"
            action={(
              <button className="text-button" type="button" onClick={() => navigate("/appointments")}>
                View schedule <CalendarRange />
              </button>
            )}
          />
          <div className="appointment-list">
            {todaysAppointments.length ? todaysAppointments.map(appointment => {
              const patient = patientById(appointment.patientId);
              const doctor = doctorById(appointment.doctorId);
              return (
                <article className="appointment-row" key={appointment.appointmentId}>
                  <div className="appointment-time">
                    <strong>{formatTime(appointment.time)}</strong>
                    <small>{doctor?.room || "Consulting"}</small>
                  </div>
                  <PersonCell
                    person={patient}
                    title={patient ? `${patient.firstName} ${patient.lastName}` : appointment.patientId}
                    subtitle={appointment.visitType}
                  />
                  <PersonCell
                    doctor
                    person={doctor}
                    title={doctorName(doctor)}
                    subtitle={doctor?.specialization}
                  />
                  <StatusBadge status={appointment.status} />
                </article>
              );
            }) : <EmptyState>No appointments are scheduled for today.</EmptyState>}
          </div>
        </section>

        <section className="panel arrivals-panel">
          <PanelHeader icon={DoorOpen} title="Upcoming Patient Arrivals" description="Expected within the next clinic sessions" />
          <div className="arrival-list">
            {arrivals.length ? arrivals.map(appointment => {
              const patient = patientById(appointment.patientId);
              const doctor = doctorById(appointment.doctorId);
              const ArrivalIcon = LogIn;
              const dayLabel = appointment.date === currentDate
                ? "Today"
                : formatDate(appointment.date, { weekday: "short", day: "numeric" });
              return (
                <article className="arrival-row" key={appointment.appointmentId}>
                  <ArrivalIcon />
                  <div>
                    <strong>{patient ? `${patient.firstName} ${patient.lastName}` : appointment.patientId}</strong>
                    <small>{doctorName(doctor)} - {appointment.reason}</small>
                  </div>
                  <span className="arrival-time">{dayLabel}, {formatTime(appointment.time)}</span>
                </article>
              );
            }) : <EmptyState>No upcoming arrivals.</EmptyState>}
          </div>
        </section>

        <section className="panel urgent-panel">
          <PanelHeader
            urgent
            icon={TriangleAlert}
            title="Urgent Notifications"
            description="Items requiring staff attention"
            action={<span className="alert-count">{alerts.length}</span>}
          />
          <div className="notification-list">
            {alerts.map(alert => {
              const AlertIcon = alert.icon;
              return (
                <article className="notification-row" key={alert.title}>
                  <span className="notification-icon"><AlertIcon /></span>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.message}</p>
                  </div>
                  <time>{alert.time}</time>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel activity-panel">
          <PanelHeader
            icon={Activity}
            title="Weekly Clinic Activity"
            description="Patient attendance over the last seven days"
            action={<span className="panel-chip">This week</span>}
          />
          <MiniBarChart data={activityData} />
        </section>
      </div>
    </section>
  );
}
