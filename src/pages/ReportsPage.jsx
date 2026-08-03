import {
  ChartColumnBig,
  ChartPie,
  ChartSpline,
  CircleCheckBig,
  Clock3,
  ClipboardList,
  Download,
  Stethoscope,
  UserX
} from "lucide-react";
import { useMemo, useState } from "react";
import BarChart from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import LineChart from "../components/charts/LineChart";
import PageHeading from "../components/common/PageHeading";
import PanelHeader from "../components/common/PanelHeader";
import PersonCell from "../components/common/PersonCell";
import StatCard from "../components/common/StatCard";
import { useMedLink } from "../context/MedLinkContext";
import { useToast } from "../context/ToastContext";
import { APPOINTMENT_STATUS } from "../utils/appointmentStatus";
import { dateRange, formatDate, today } from "../utils/date";
import { doctorName } from "../utils/format";

export default function ReportsPage() {
  const { appointments, doctors } = useMedLink();
  const { showToast } = useToast();
  const [period, setPeriod] = useState("weekly");
  const [endDate, setEndDate] = useState(today());

  const report = useMemo(() => {
    const dayCount = period === "monthly" ? 30 : 7;
    const dates = dateRange(endDate, dayCount);
    const startDate = dates[0];
    const scoped = appointments.filter(appointment =>
      appointment.date >= startDate &&
      appointment.date <= endDate
    );
    const active = scoped.filter(item => item.status !== APPOINTMENT_STATUS.CANCELLED);
    const attended = scoped.filter(item => item.status === APPOINTMENT_STATUS.COMPLETED);
    const noShows = scoped.filter(item => item.status === APPOINTMENT_STATUS.NO_SHOW);
    const scheduled = scoped.filter(item => item.status === APPOINTMENT_STATUS.SCHEDULED);
    const resolved = attended.length + noShows.length;
    const attendanceRate = resolved ? Math.round((attended.length / resolved) * 100) : 0;
    const doctorMetrics = doctors.map(doctor => {
      const doctorAppointments = active.filter(item => item.doctorId === doctor.doctorId);
      const completed = doctorAppointments.filter(item => item.status === APPOINTMENT_STATUS.COMPLETED).length;
      const missed = doctorAppointments.filter(item => item.status === APPOINTMENT_STATUS.NO_SHOW).length;
      const outcomeCount = completed + missed;
      return {
        doctor,
        count: doctorAppointments.length,
        completed,
        attendanceRate: outcomeCount
          ? Math.round((completed / outcomeCount) * 100)
          : 0
      };
    });
    const topDoctor = [...doctorMetrics].sort((a, b) => b.count - a.count)[0];
    const maxDoctorLoad = Math.max(...doctorMetrics.map(item => item.count), 1);

    const groupedDates = period === "monthly"
      ? Array.from({ length: 10 }, (_, index) => {
          const segmentDates = dates.slice(index * 3, index * 3 + 3);
          return {
            dates: segmentDates,
            label: formatDate(segmentDates[0], { day: "numeric", month: "short" }),
            value: segmentDates.reduce(
              (sum, date) => sum + scoped.filter(item => item.date === date).length,
              0
            )
          };
        })
      : dates.map(date => ({
          dates: [date],
          label: formatDate(date, { weekday: "short" }),
          value: active.filter(item => item.date === date).length
        }));

    const trendData = groupedDates.map(group => ({
      label: group.label,
      value: group.dates.reduce(
        (sum, date) => sum + attended.filter(item => item.date === date).length,
        0
      )
    }));

    return {
      dates,
      startDate,
      scoped,
      active,
      attended,
      noShows,
      scheduled,
      attendanceRate,
      doctorMetrics,
      topDoctor,
      maxDoctorLoad,
      groupedDates,
      trendData
    };
  }, [appointments, doctors, endDate, period]);

  function exportReport() {
    const rows = [
      ["Doctor Name", "Specialization", "Appointments", "Completed", "Attendance Rate"],
      ...report.doctorMetrics.map(metric => [
        doctorName(metric.doctor),
        metric.doctor.specialization,
        metric.count,
        metric.completed,
        `${metric.attendanceRate}%`
      ]),
      [],
      ["Report Summary", "Value"],
      ["Total bookings", report.scoped.length],
      ["Completed visits", report.attended.length],
      ["Scheduled visits", report.scheduled.length],
      ["No-shows", report.noShows.length],
      ["Cancelled visits", report.scoped.length - report.active.length]
    ];
    const csv = rows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medlink-clinic-report-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Report exported", "The doctor performance report was downloaded as CSV.");
  }

  return (
    <section className="view" aria-labelledby="reportsHeading">
      <PageHeading
        className="report-heading"
        eyebrow="Clinic performance"
        title="Clinic Attendance Statistics"
        titleId="reportsHeading"
        description="Track patient volume, completion rates, and doctor utilization."
        actions={(
          <div className="report-filters" aria-label="Report filters">
            <label>
              <span>Period</span>
              <select value={period} onChange={event => setPeriod(event.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              <span>Ending</span>
              <input type="date" max={today()} value={endDate} onChange={event => setEndDate(event.target.value)} />
            </label>
            <button className="button button-secondary" type="button" onClick={exportReport}>
              <Download />
              Export
            </button>
          </div>
        )}
      />

      <div className="stat-grid report-stat-grid">
        <StatCard
          icon={CircleCheckBig}
          tone="green"
          label="Completed Visits"
          value={report.attended.length}
          caption={`${formatDate(report.startDate)} to ${formatDate(endDate)}`}
        />
        <StatCard
          icon={Clock3}
          tone="amber"
          label="Scheduled Visits"
          value={report.scheduled.length}
          caption={`${report.scoped.length} total bookings`}
        />
        <StatCard
          icon={UserX}
          tone="red"
          label="Attendance Rate"
          value={`${report.attendanceRate}%`}
          caption={`${report.noShows.length} no-show${report.noShows.length === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={Stethoscope}
          tone="amber"
          label="Most Utilized Doctor"
          value={report.topDoctor?.count ? `Dr. ${report.topDoctor.doctor.lastName}` : "-"}
          valueClassName="stat-name"
          caption={`${report.topDoctor?.count || 0} appointments`}
        />
      </div>

      <div className="report-grid">
        <section className="panel bar-chart-panel">
          <PanelHeader icon={ChartColumnBig} title="Appointments per Day" description="Non-cancelled booking volume for the selected period" />
          <BarChart data={report.groupedDates} monthly={period === "monthly"} />
        </section>

        <section className="panel utilization-panel">
          <PanelHeader icon={ChartPie} title="Doctor Utilization" description="Share of non-cancelled clinic appointments" />
          <DonutChart metrics={report.doctorMetrics} />
        </section>

        <section className="panel line-chart-panel">
          <PanelHeader
            icon={ChartSpline}
            title="Attendance Trend"
            description="Completed visits across the reporting period"
            action={<span className="panel-chip panel-chip-green">Live data</span>}
          />
          <LineChart data={report.trendData} />
        </section>
      </div>

      <section className="panel table-panel doctor-performance-panel">
        <PanelHeader icon={ClipboardList} title="Doctor Performance" description="Appointment volume and attendance rate by clinician." />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Specialization</th>
                <th>Number of Appointments</th>
                <th>Attendance Rate</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {report.doctorMetrics.map(metric => {
                const utilization = Math.round((metric.count / report.maxDoctorLoad) * 100);
                return (
                  <tr key={metric.doctor.doctorId}>
                    <td>
                      <PersonCell
                        compact
                        doctor
                        person={metric.doctor}
                        title={doctorName(metric.doctor)}
                        subtitle={metric.doctor.room}
                      />
                    </td>
                    <td>{metric.doctor.specialization}</td>
                    <td><strong>{metric.count}</strong></td>
                    <td>{metric.attendanceRate}%</td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${utilization}%` }} />
                        </div>
                        <span>{utilization}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
