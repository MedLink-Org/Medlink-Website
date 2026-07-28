const DateUtils = {
  toISO(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  },

  fromISO(value) {
    return new Date(`${value}T12:00:00`);
  },

  addDays(value, days) {
    const date = typeof value === "string" ? this.fromISO(value) : new Date(value);
    date.setDate(date.getDate() + days);
    return this.toISO(date);
  },

  today() {
    return this.toISO(new Date());
  },

  format(value, options = { day: "numeric", month: "short", year: "numeric" }) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-NG", options).format(this.fromISO(value));
  },

  formatLong(value) {
    return this.format(value, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  },

  time(value) {
    if (!value) return "-";
    const [hours, minutes] = value.split(":").map(Number);
    return new Intl.DateTimeFormat("en-NG", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(new Date(2026, 0, 1, hours, minutes));
  },

  range(endDate, count) {
    return Array.from({ length: count }, (_, index) => this.addDays(endDate, index - count + 1));
  }
};

const Helpers = {
  initials(firstName = "", lastName = "") {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "PT";
  },

  currency(amount) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  },

  escape(value = "") {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
  },

  statusClass(status = "") {
    return status.toLowerCase().replace(/\s+/g, "-");
  },

  doctorName(doctor) {
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unassigned doctor";
  },

  createIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
};

const DB = {
  key: "medlink_v3",
  legacyKey: "medlink_v1",
  state: null,

  doctors: [
    {
      doctorId: "D01",
      firstName: "Ifeoma",
      lastName: "Smith",
      specialization: "General Practice",
      room: "Room 01"
    },
    {
      doctorId: "D02",
      firstName: "Chinedu",
      lastName: "Adams",
      specialization: "Pediatrics",
      room: "Room 04"
    },
    {
      doctorId: "D03",
      firstName: "Bola",
      lastName: "Nwosu",
      specialization: "Cardiology",
      room: "Room 06"
    },
    {
      doctorId: "D04",
      firstName: "Tari",
      lastName: "Johnson",
      specialization: "Dermatology",
      room: "Room 08"
    }
  ],

  seed() {
    const today = DateUtils.today();
    const patients = [
      {
        patientId: "P001",
        firstName: "Adaeze",
        lastName: "Okeke",
        dob: "1992-04-16",
        gender: "Female",
        phone: "+234 803 420 1182",
        email: "adaeze.okeke@example.com",
        address: "12 Wetheral Road, Owerri, Imo State",
        bloodType: "O+",
        genotype: "AA",
        medicalHistory: "Penicillin allergy. Mild asthma."
      },
      {
        patientId: "P002",
        firstName: "Emeka",
        lastName: "Nwankwo",
        dob: "1984-09-02",
        gender: "Male",
        phone: "+234 806 118 9022",
        email: "emeka.nwankwo@example.com",
        address: "45 Egbu Road, Owerri, Imo State",
        bloodType: "A+",
        genotype: "AS",
        medicalHistory: "Hypertension. Currently taking amlodipine."
      },
      {
        patientId: "P003",
        firstName: "Chioma",
        lastName: "Eze",
        dob: "2017-11-22",
        gender: "Female",
        phone: "+234 814 990 3125",
        email: "guardian.eze@example.com",
        address: "8 Mbaise Road, Owerri, Imo State",
        bloodType: "B+",
        genotype: "AA",
        medicalHistory: "No known allergies."
      },
      {
        patientId: "P004",
        firstName: "Tunde",
        lastName: "Adebayo",
        dob: "1976-01-30",
        gender: "Male",
        phone: "+234 809 431 7740",
        email: "tunde.adebayo@example.com",
        address: "3 MCC Road, Owerri, Imo State",
        bloodType: "AB+",
        genotype: "AA",
        medicalHistory: "Type 2 diabetes. Requires glucose monitoring."
      },
      {
        patientId: "P005",
        firstName: "Ngozi",
        lastName: "Ibe",
        dob: "1998-06-11",
        gender: "Female",
        phone: "+234 705 338 8201",
        email: "ngozi.ibe@example.com",
        address: "20 Port Harcourt Road, Owerri, Imo State",
        bloodType: "O-",
        genotype: "AS",
        medicalHistory: "No chronic conditions recorded."
      },
      {
        patientId: "P006",
        firstName: "Samuel",
        lastName: "Udo",
        dob: "1968-12-08",
        gender: "Male",
        phone: "+234 802 771 4308",
        email: "samuel.udo@example.com",
        address: "14 Onitsha Road, Owerri, Imo State",
        bloodType: "A-",
        genotype: "AA",
        medicalHistory: "Cardiac review patient. Aspirin therapy."
      }
    ];

    const appointments = [
      { appointmentId: "A001", patientId: "P001", doctorId: "D01", date: DateUtils.addDays(today, -6), time: "09:00", visitType: "New consultation", reason: "Persistent cough", status: "Completed" },
      { appointmentId: "A002", patientId: "P003", doctorId: "D02", date: DateUtils.addDays(today, -5), time: "10:30", visitType: "Routine checkup", reason: "Pediatric wellness review", status: "Completed" },
      { appointmentId: "A003", patientId: "P004", doctorId: "D01", date: DateUtils.addDays(today, -4), time: "11:00", visitType: "Follow-up", reason: "Diabetes review", status: "Completed" },
      { appointmentId: "A004", patientId: "P006", doctorId: "D03", date: DateUtils.addDays(today, -3), time: "13:30", visitType: "Follow-up", reason: "Cardiac assessment", status: "Completed" },
      { appointmentId: "A005", patientId: "P005", doctorId: "D04", date: DateUtils.addDays(today, -2), time: "09:30", visitType: "New consultation", reason: "Skin irritation", status: "Completed" },
      { appointmentId: "A006", patientId: "P002", doctorId: "D01", date: DateUtils.addDays(today, -1), time: "15:00", visitType: "Follow-up", reason: "Blood pressure review", status: "Cancelled" },
      { appointmentId: "A007", patientId: "P001", doctorId: "D01", date: today, time: "08:30", visitType: "Follow-up", reason: "Respiratory review", status: "Checked In" },
      { appointmentId: "A008", patientId: "P003", doctorId: "D02", date: today, time: "09:15", visitType: "Routine checkup", reason: "Immunization review", status: "Scheduled" },
      { appointmentId: "A009", patientId: "P006", doctorId: "D03", date: today, time: "10:00", visitType: "Follow-up", reason: "ECG results review", status: "Scheduled" },
      { appointmentId: "A010", patientId: "P005", doctorId: "D04", date: today, time: "11:30", visitType: "Procedure", reason: "Dermatology procedure", status: "Scheduled" },
      { appointmentId: "A011", patientId: "P004", doctorId: "D01", date: today, time: "13:00", visitType: "Follow-up", reason: "Glucose monitoring", status: "Scheduled" },
      { appointmentId: "A012", patientId: "P002", doctorId: "D01", date: DateUtils.addDays(today, 1), time: "09:00", visitType: "Follow-up", reason: "Hypertension management", status: "Scheduled" },
      { appointmentId: "A013", patientId: "P003", doctorId: "D02", date: DateUtils.addDays(today, 2), time: "10:30", visitType: "Follow-up", reason: "Laboratory results", status: "Scheduled" },
      { appointmentId: "A014", patientId: "P006", doctorId: "D03", date: DateUtils.addDays(today, 3), time: "14:00", visitType: "Routine checkup", reason: "Cardiology review", status: "Scheduled" }
    ];

    const bills = [
      { billId: "B001", patientId: "P001", billType: "Consultation", amount: 15000, mode: "Card", dateIssued: DateUtils.addDays(today, -6), datePaid: DateUtils.addDays(today, -6), status: "Paid" },
      { billId: "B002", patientId: "P004", billType: "Laboratory", amount: 28500, mode: "Bank Transfer", dateIssued: DateUtils.addDays(today, -4), datePaid: DateUtils.addDays(today, -3), status: "Paid" },
      { billId: "B003", patientId: "P006", billType: "Procedure", amount: 45000, mode: "Insurance", dateIssued: today, datePaid: "", status: "Pending" },
      { billId: "B004", patientId: "P005", billType: "Medication", amount: 12500, mode: "Cash", dateIssued: today, datePaid: "", status: "Pending" }
    ];

    return {
      patients,
      doctors: this.doctors,
      appointments,
      bills,
      nextPatientId: 7,
      nextAppointmentId: 15,
      nextBillId: 5
    };
  },

  normalize(state) {
    const normalized = {
      patients: Array.isArray(state.patients) ? state.patients : [],
      doctors: Array.isArray(state.doctors) && state.doctors.length ? state.doctors : this.doctors,
      appointments: Array.isArray(state.appointments) ? state.appointments : [],
      bills: Array.isArray(state.bills) ? state.bills : [],
      nextPatientId: state.nextPatientId || (state.patients?.length || 0) + 1,
      nextAppointmentId: state.nextAppointmentId || state.nextApptId || (state.appointments?.length || 0) + 1,
      nextBillId: state.nextBillId || (state.bills?.length || 0) + 1
    };

    normalized.patients = normalized.patients.map(patient => ({
      phone: patient.phone || patient.contact || "",
      email: patient.email || "",
      medicalHistory: patient.medicalHistory || "",
      ...patient
    }));

    normalized.appointments = normalized.appointments.map(appointment => ({
      visitType: appointment.visitType || "Consultation",
      reason: appointment.reason || "General consultation",
      status: appointment.status || "Scheduled",
      ...appointment
    }));

    return normalized;
  },

  load() {
    const current = localStorage.getItem(this.key);
    if (current) {
      try {
        return this.normalize(JSON.parse(current));
      } catch (error) {
        console.warn("Unable to read current MedLink data.", error);
      }
    }

    const legacy = localStorage.getItem(this.legacyKey);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed.patients?.length || parsed.appointments?.length) {
          return this.normalize(parsed);
        }
      } catch (error) {
        console.warn("Unable to migrate previous MedLink data.", error);
      }
    }

    return this.seed();
  },

  init() {
    this.state = this.load();
    this.save();
  },

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.state));
  },

  addPatient(patient) {
    const patientId = `P${String(this.state.nextPatientId).padStart(3, "0")}`;
    const record = { patientId, ...patient };
    this.state.patients.push(record);
    this.state.nextPatientId += 1;
    this.save();
    return record;
  },

  addAppointment(appointment) {
    const appointmentId = `A${String(this.state.nextAppointmentId).padStart(3, "0")}`;
    const record = { appointmentId, status: "Scheduled", ...appointment };
    this.state.appointments.push(record);
    this.state.nextAppointmentId += 1;
    this.save();
    return record;
  },

  setAppointmentStatus(appointmentId, status) {
    const appointment = this.state.appointments.find(item => item.appointmentId === appointmentId);
    if (!appointment) return;
    appointment.status = status;
    this.save();
  },

  addBill(bill) {
    const billId = `B${String(this.state.nextBillId).padStart(3, "0")}`;
    const record = {
      billId,
      status: "Pending",
      dateIssued: DateUtils.today(),
      datePaid: "",
      ...bill,
      amount: Number(bill.amount)
    };
    this.state.bills.push(record);
    this.state.nextBillId += 1;
    this.save();
    return record;
  },

  markBillPaid(billId) {
    const bill = this.state.bills.find(item => item.billId === billId);
    if (!bill) return;
    bill.status = "Paid";
    bill.datePaid = DateUtils.today();
    this.save();
  },

  patientById(patientId) {
    return this.state.patients.find(patient => patient.patientId === patientId);
  },

  doctorById(doctorId) {
    return this.state.doctors.find(doctor => doctor.doctorId === doctorId);
  }
};

const Router = {
  titles: {
    dashboard: "Dashboard",
    patients: "Patients",
    appointments: "Appointments",
    billing: "Billing",
    reports: "Reports"
  },

  go(view) {
    document.querySelectorAll(".view").forEach(section => {
      section.classList.toggle("hidden", section.id !== `view-${view}`);
    });
    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle("active", button.dataset.view === view);
    });
    document.getElementById("pageTitle").textContent = this.titles[view] || "MedLink";
    document.querySelector(".sidebar").classList.remove("open");
    Render.all();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const Validation = {
  phonePattern: /^\+?[\d\s()-]{7,20}$/,
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  clear(form) {
    form.querySelectorAll(".invalid").forEach(field => field.classList.remove("invalid"));
    form.querySelectorAll(".field-error").forEach(message => {
      message.textContent = "";
    });
  },

  error(form, name, message) {
    const field = form.elements[name];
    if (field) field.classList.add("invalid");
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (error) error.textContent = message;
  },

  required(form, fields) {
    let valid = true;
    fields.forEach(({ name, label }) => {
      const value = String(form.elements[name]?.value || "").trim();
      if (!value) {
        this.error(form, name, `${label} is required.`);
        valid = false;
      }
    });
    return valid;
  },

  patient(form) {
    this.clear(form);
    let valid = this.required(form, [
      { name: "firstName", label: "First name" },
      { name: "lastName", label: "Last name" },
      { name: "dob", label: "Date of birth" },
      { name: "gender", label: "Gender" },
      { name: "phone", label: "Phone number" },
      { name: "email", label: "Email address" },
      { name: "address", label: "Address" }
    ]);

    const phone = form.elements.phone.value.trim();
    const email = form.elements.email.value.trim();
    const dob = form.elements.dob.value;

    if (phone && !this.phonePattern.test(phone)) {
      this.error(form, "phone", "Enter a valid phone number using 7-15 digits.");
      valid = false;
    }
    if (email && !this.emailPattern.test(email)) {
      this.error(form, "email", "Enter a valid email address.");
      valid = false;
    }
    if (dob && dob >= DateUtils.today()) {
      this.error(form, "dob", "Date of birth must be before today.");
      valid = false;
    }
    return valid;
  },

  appointment(form) {
    this.clear(form);
    let valid = this.required(form, [
      { name: "patientId", label: "Patient" },
      { name: "doctorId", label: "Doctor" },
      { name: "date", label: "Appointment date" },
      { name: "time", label: "Appointment time" },
      { name: "visitType", label: "Visit type" },
      { name: "reason", label: "Reason for visit" }
    ]);

    const date = form.elements.date.value;
    const time = form.elements.time.value;
    if (date && date < DateUtils.today()) {
      this.error(form, "date", "Appointment date cannot be in the past.");
      valid = false;
    }
    if (time && (time < "08:00" || time > "18:00")) {
      this.error(form, "time", "Choose a time between 8:00 AM and 6:00 PM.");
      valid = false;
    }

    const conflict = DB.state.appointments.some(appointment =>
      appointment.doctorId === form.elements.doctorId.value &&
      appointment.date === date &&
      appointment.time === time &&
      appointment.status !== "Cancelled"
    );
    if (conflict) {
      this.error(form, "time", "This doctor already has an appointment at that time.");
      valid = false;
    }
    return valid;
  },

  billing(form) {
    this.clear(form);
    let valid = this.required(form, [
      { name: "patientId", label: "Patient" },
      { name: "billType", label: "Bill type" },
      { name: "amount", label: "Amount" },
      { name: "mode", label: "Payment method" }
    ]);

    if (Number(form.elements.amount.value) <= 0) {
      this.error(form, "amount", "Amount must be greater than zero.");
      valid = false;
    }
    return valid;
  }
};

const Toast = {
  show(title, message, type = "success") {
    const region = document.getElementById("toastRegion");
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.innerHTML = `
      <span><i data-lucide="${type === "error" ? "circle-alert" : "circle-check"}"></i></span>
      <div><strong>${Helpers.escape(title)}</strong><p>${Helpers.escape(message)}</p></div>
      <button type="button" aria-label="Dismiss notification"><i data-lucide="x"></i></button>
    `;
    toast.querySelector("button").addEventListener("click", () => toast.remove());
    region.appendChild(toast);
    Helpers.createIcons();
    setTimeout(() => toast.remove(), 4500);
  }
};

const Render = {
  appointmentFilter: "All",
  billingFilter: "All",
  patientQuery: "",

  all() {
    this.shared();
    this.dashboard();
    this.patientSelects();
    this.patientTable();
    this.appointmentTable();
    this.billing();
    this.reports();
    Helpers.createIcons();
  },

  shared() {
    const today = DateUtils.today();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    document.getElementById("todayLabel").textContent = DateUtils.formatLong(today);
    document.getElementById("dashboardHeading").textContent = `${greeting}, Amara`;
    document.getElementById("appointmentDateLabel").textContent = DateUtils.formatLong(today);
    document.getElementById("navPatientCount").textContent = DB.state.patients.length;
    document.getElementById("navAppointmentCount").textContent = DB.state.appointments.filter(item =>
      item.date >= today && !["Completed", "Cancelled"].includes(item.status)
    ).length;
    document.getElementById("dob").max = DateUtils.addDays(today, -1);
    document.getElementById("appointmentDate").min = today;
  },

  dashboard() {
    const today = DateUtils.today();
    const todaysAppointments = DB.state.appointments
      .filter(appointment => appointment.date === today && appointment.status !== "Cancelled")
      .sort((a, b) => a.time.localeCompare(b.time));
    const completedToday = todaysAppointments.filter(item => item.status === "Completed").length;
    const pendingToday = todaysAppointments.filter(item => ["Scheduled", "Checked In"].includes(item.status)).length;
    const pendingBills = DB.state.bills.filter(bill => bill.status === "Pending");
    const outstanding = pendingBills.reduce((sum, bill) => sum + Number(bill.amount), 0);

    document.getElementById("statPatientsToday").textContent = new Set(todaysAppointments.map(item => item.patientId)).size;
    document.getElementById("statPatientsTrend").textContent = `${todaysAppointments.length} clinic visits scheduled`;
    document.getElementById("statAppointments").textContent = todaysAppointments.length;
    document.getElementById("statAppointmentTrend").textContent = `${completedToday} completed today`;
    document.getElementById("statPendingAppointments").textContent = pendingToday;
    document.getElementById("statPendingBills").textContent = pendingBills.length;
    document.getElementById("statPendingBillAmount").textContent = `${Helpers.currency(outstanding)} outstanding`;

    const appointmentsElement = document.getElementById("todayAppointments");
    appointmentsElement.innerHTML = todaysAppointments.length
      ? todaysAppointments.map(appointment => {
          const patient = DB.patientById(appointment.patientId);
          const doctor = DB.doctorById(appointment.doctorId);
          return `
            <article class="appointment-row">
              <div class="appointment-time">
                <strong>${DateUtils.time(appointment.time)}</strong>
                <small>${Helpers.escape(doctor?.room || "Consulting")}</small>
              </div>
              <div class="patient-cell">
                <span class="row-avatar">${Helpers.initials(patient?.firstName, patient?.lastName)}</span>
                <div>
                  <strong>${Helpers.escape(patient ? `${patient.firstName} ${patient.lastName}` : appointment.patientId)}</strong>
                  <small>${Helpers.escape(appointment.visitType)}</small>
                </div>
              </div>
              <div class="doctor-cell">
                <span class="row-avatar doctor-avatar">${Helpers.initials(doctor?.firstName, doctor?.lastName)}</span>
                <div>
                  <strong>${Helpers.escape(Helpers.doctorName(doctor))}</strong>
                  <small>${Helpers.escape(doctor?.specialization || "")}</small>
                </div>
              </div>
              <span class="status-badge status-${Helpers.statusClass(appointment.status)}">${Helpers.escape(appointment.status)}</span>
            </article>
          `;
        }).join("")
      : `<div class="empty-state">No appointments are scheduled for today.</div>`;

    const arrivals = DB.state.appointments
      .filter(appointment =>
        appointment.date >= today &&
        ["Scheduled", "Checked In"].includes(appointment.status)
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 5);

    document.getElementById("upcomingArrivals").innerHTML = arrivals.length
      ? arrivals.map(appointment => {
          const patient = DB.patientById(appointment.patientId);
          const doctor = DB.doctorById(appointment.doctorId);
          const dayLabel = appointment.date === today ? "Today" : DateUtils.format(appointment.date, { weekday: "short", day: "numeric" });
          return `
            <article class="arrival-row">
              <i data-lucide="${appointment.status === "Checked In" ? "badge-check" : "log-in"}"></i>
              <div>
                <strong>${Helpers.escape(patient ? `${patient.firstName} ${patient.lastName}` : appointment.patientId)}</strong>
                <small>${Helpers.escape(Helpers.doctorName(doctor))} - ${Helpers.escape(appointment.reason)}</small>
              </div>
              <span class="arrival-time">${dayLabel}, ${DateUtils.time(appointment.time)}</span>
            </article>
          `;
        }).join("")
      : `<div class="empty-state">No upcoming arrivals.</div>`;

    const alerts = this.getAlerts();
    document.getElementById("alertCount").textContent = alerts.length;
    document.getElementById("urgentNotifications").innerHTML = alerts.map(alert => `
      <article class="notification-row">
        <span class="notification-icon"><i data-lucide="${alert.icon}"></i></span>
        <div>
          <strong>${Helpers.escape(alert.title)}</strong>
          <p>${Helpers.escape(alert.message)}</p>
        </div>
        <time>${Helpers.escape(alert.time)}</time>
      </article>
    `).join("");

    const range = DateUtils.range(today, 7);
    const values = range.map(date => DB.state.appointments.filter(item => item.date === date && item.status !== "Cancelled").length);
    const max = Math.max(...values, 1);
    document.getElementById("dashboardActivityChart").innerHTML = range.map((date, index) => `
      <div class="mini-bar-column">
        <div class="mini-bar-track">
          <div class="mini-bar" style="height:${Math.max(5, (values[index] / max) * 88)}%">
            <i class="mini-bar-value">${values[index]}</i>
          </div>
        </div>
        <span>${DateUtils.format(date, { weekday: "short" })}</span>
      </div>
    `).join("");
  },

  getAlerts() {
    const pendingBills = DB.state.bills.filter(bill => bill.status === "Pending");
    const checkedIn = DB.state.appointments.filter(item => item.date === DateUtils.today() && item.status === "Checked In");
    const alerts = [];

    if (checkedIn.length) {
      alerts.push({
        icon: "siren",
        title: "Patient awaiting consultation",
        message: `${checkedIn.length} checked-in patient${checkedIn.length === 1 ? " is" : "s are"} ready for the assigned doctor.`,
        time: "Now"
      });
    }
    if (pendingBills.length) {
      alerts.push({
        icon: "receipt-text",
        title: "Outstanding patient balances",
        message: `${pendingBills.length} bill${pendingBills.length === 1 ? " remains" : "s remain"} unpaid and requires finance desk follow-up.`,
        time: "Today"
      });
    }
    alerts.push({
      icon: "heart-pulse",
      title: "Clinical record review",
      message: "Confirm Samuel Udo's current cardiac medication before the afternoon review.",
      time: "1 hr"
    });
    return alerts.slice(0, 3);
  },

  patientSelects() {
    const options = DB.state.patients
      .slice()
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
      .map(patient => `<option value="${patient.patientId}">${patient.patientId} - ${Helpers.escape(patient.firstName)} ${Helpers.escape(patient.lastName)}</option>`)
      .join("");

    ["appointmentPatient", "billingPatient"].forEach(id => {
      const select = document.getElementById(id);
      const currentValue = select.value;
      const placeholder = id === "appointmentPatient" ? "Select a registered patient" : "Select patient";
      select.innerHTML = `<option value="">${placeholder}</option>${options}`;
      select.value = currentValue;
    });

    const doctorSelect = document.getElementById("appointmentDoctor");
    const currentDoctor = doctorSelect.value;
    doctorSelect.innerHTML = `<option value="">Select a doctor</option>${DB.state.doctors.map(doctor =>
      `<option value="${doctor.doctorId}">${Helpers.escape(Helpers.doctorName(doctor))} - ${Helpers.escape(doctor.specialization)}</option>`
    ).join("")}`;
    doctorSelect.value = currentDoctor;
  },

  patientTable() {
    const query = this.patientQuery.trim().toLowerCase();
    const patients = DB.state.patients.filter(patient => {
      const searchable = [
        patient.patientId,
        patient.firstName,
        patient.lastName,
        patient.phone,
        patient.email
      ].join(" ").toLowerCase();
      return !query || searchable.includes(query);
    });

    document.getElementById("patientTable").innerHTML = patients.length
      ? patients.map(patient => {
          const visits = DB.state.appointments
            .filter(appointment => appointment.patientId === patient.patientId && appointment.status === "Completed")
            .sort((a, b) => b.date.localeCompare(a.date));
          return `
            <tr>
              <td><span class="table-id">${patient.patientId}</span></td>
              <td>
                <div class="table-person">
                  <span class="row-avatar">${Helpers.initials(patient.firstName, patient.lastName)}</span>
                  <div>
                    <strong>${Helpers.escape(patient.firstName)} ${Helpers.escape(patient.lastName)}</strong>
                    <small>${Helpers.escape(patient.gender)} - ${Helpers.escape(patient.email || "No email")}</small>
                  </div>
                </div>
              </td>
              <td>${Helpers.escape(patient.phone || "-")}</td>
              <td>${DateUtils.format(patient.dob)}</td>
              <td>${Helpers.escape(patient.bloodType || "Unknown")}</td>
              <td>${visits.length ? DateUtils.format(visits[0].date) : "No completed visit"}</td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="6"><div class="empty-state">No patient records match your search.</div></td></tr>`;
  },

  appointmentTable() {
    const appointments = DB.state.appointments
      .filter(item => this.appointmentFilter === "All" || item.status === this.appointmentFilter)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

    document.getElementById("appointmentTable").innerHTML = appointments.length
      ? appointments.map(appointment => {
          const patient = DB.patientById(appointment.patientId);
          const doctor = DB.doctorById(appointment.doctorId);
          const actions = [];
          if (appointment.status === "Scheduled") {
            actions.push(`<button class="table-action" type="button" onclick="Actions.setAppointmentStatus('${appointment.appointmentId}', 'Checked In')"><i data-lucide="log-in"></i>Check in</button>`);
          }
          if (["Scheduled", "Checked In"].includes(appointment.status)) {
            actions.push(`<button class="table-action" type="button" onclick="Actions.setAppointmentStatus('${appointment.appointmentId}', 'Completed')"><i data-lucide="check"></i>Complete</button>`);
            actions.push(`<button class="table-action danger" type="button" onclick="Actions.setAppointmentStatus('${appointment.appointmentId}', 'Cancelled')"><i data-lucide="x"></i>Cancel</button>`);
          }
          return `
            <tr>
              <td>
                <strong>${DateUtils.time(appointment.time)}</strong><br>
                <small>${DateUtils.format(appointment.date, { day: "numeric", month: "short" })}</small>
              </td>
              <td>
                <div class="table-person">
                  <span class="row-avatar">${Helpers.initials(patient?.firstName, patient?.lastName)}</span>
                  <div>
                    <strong>${Helpers.escape(patient ? `${patient.firstName} ${patient.lastName}` : appointment.patientId)}</strong>
                    <small>${Helpers.escape(appointment.appointmentId)} - ${Helpers.escape(appointment.reason)}</small>
                  </div>
                </div>
              </td>
              <td>${Helpers.escape(Helpers.doctorName(doctor))}<br><small>${Helpers.escape(doctor?.specialization || "")}</small></td>
              <td>${Helpers.escape(appointment.visitType)}</td>
              <td><span class="status-badge status-${Helpers.statusClass(appointment.status)}">${Helpers.escape(appointment.status)}</span></td>
              <td><div class="table-actions">${actions.join("") || "-"}</div></td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="6"><div class="empty-state">No appointments match this status.</div></td></tr>`;
  },

  billing() {
    const total = DB.state.bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
    const paid = DB.state.bills.filter(bill => bill.status === "Paid").reduce((sum, bill) => sum + Number(bill.amount), 0);
    const pendingBills = DB.state.bills.filter(bill => bill.status === "Pending");
    const outstanding = pendingBills.reduce((sum, bill) => sum + Number(bill.amount), 0);

    document.getElementById("totalBilled").textContent = Helpers.currency(total);
    document.getElementById("paymentsReceived").textContent = Helpers.currency(paid);
    document.getElementById("outstandingBalance").textContent = Helpers.currency(outstanding);
    document.getElementById("outstandingBillCount").textContent = `${pendingBills.length} pending bill${pendingBills.length === 1 ? "" : "s"}`;

    const bills = DB.state.bills
      .filter(bill => this.billingFilter === "All" || bill.status === this.billingFilter)
      .sort((a, b) => b.dateIssued.localeCompare(a.dateIssued));

    document.getElementById("billingTable").innerHTML = bills.length
      ? bills.map(bill => {
          const patient = DB.patientById(bill.patientId);
          return `
            <tr>
              <td><span class="table-id">${bill.billId}</span></td>
              <td>
                <div class="table-person">
                  <span class="row-avatar">${Helpers.initials(patient?.firstName, patient?.lastName)}</span>
                  <div>
                    <strong>${Helpers.escape(patient ? `${patient.firstName} ${patient.lastName}` : bill.patientId)}</strong>
                    <small>${Helpers.escape(bill.mode)}</small>
                  </div>
                </div>
              </td>
              <td>${Helpers.escape(bill.billType)}</td>
              <td>${DateUtils.format(bill.dateIssued)}</td>
              <td><strong>${Helpers.currency(bill.amount)}</strong></td>
              <td><span class="status-badge status-${Helpers.statusClass(bill.status)}">${Helpers.escape(bill.status)}</span></td>
              <td>${bill.status === "Pending" ? `<button class="table-action" type="button" onclick="Actions.payBill('${bill.billId}')"><i data-lucide="badge-check"></i>Mark paid</button>` : `Paid ${DateUtils.format(bill.datePaid, { day: "numeric", month: "short" })}`}</td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="7"><div class="empty-state">No bills match this payment status.</div></td></tr>`;
  },

  reports() {
    const period = document.getElementById("reportPeriod").value || "weekly";
    const endDate = document.getElementById("reportEndDate").value || DateUtils.today();
    const dayCount = period === "monthly" ? 30 : 7;
    const dates = DateUtils.range(endDate, dayCount);
    const startDate = dates[0];
    const scoped = DB.state.appointments.filter(appointment =>
      appointment.date >= startDate &&
      appointment.date <= endDate &&
      appointment.status !== "Cancelled"
    );
    const attended = scoped.filter(item => ["Completed", "Checked In"].includes(item.status));
    const attendanceRate = scoped.length ? Math.round((attended.length / scoped.length) * 100) : 0;

    const doctorMetrics = DB.state.doctors.map(doctor => {
      const appointments = scoped.filter(item => item.doctorId === doctor.doctorId);
      const completed = appointments.filter(item => ["Completed", "Checked In"].includes(item.status)).length;
      return {
        doctor,
        count: appointments.length,
        attendanceRate: appointments.length ? Math.round((completed / appointments.length) * 100) : 0
      };
    });
    const topDoctor = doctorMetrics.slice().sort((a, b) => b.count - a.count)[0];
    const maxDoctorLoad = Math.max(...doctorMetrics.map(item => item.count), 1);

    document.getElementById("reportAttendance").textContent = scoped.length;
    document.getElementById("reportAttendanceRate").textContent = `${attendanceRate}%`;
    document.getElementById("reportAttendanceCaption").textContent = `${DateUtils.format(startDate)} to ${DateUtils.format(endDate)}`;
    document.getElementById("reportTopDoctor").textContent = topDoctor?.count ? `Dr. ${topDoctor.doctor.lastName}` : "-";
    document.getElementById("reportTopDoctorLoad").textContent = `${topDoctor?.count || 0} appointments`;

    const groupedDates = period === "monthly"
      ? Array.from({ length: 10 }, (_, index) => {
          const segmentDates = dates.slice(index * 3, index * 3 + 3);
          return {
            label: DateUtils.format(segmentDates[0], { day: "numeric", month: "short" }),
            value: segmentDates.reduce((sum, date) => sum + scoped.filter(item => item.date === date).length, 0)
          };
        })
      : dates.map(date => ({
          label: DateUtils.format(date, { weekday: "short" }),
          value: scoped.filter(item => item.date === date).length
        }));

    const maxBar = Math.max(...groupedDates.map(item => item.value), 1);
    const barChart = document.getElementById("attendanceBarChart");
    barChart.classList.toggle("monthly", period === "monthly");
    barChart.innerHTML = groupedDates.map(item => `
      <div class="chart-column">
        <div class="chart-column-track">
          <div class="chart-column-bar" style="height:${Math.max(4, (item.value / maxBar) * 88)}%">
            <i class="chart-column-value">${item.value}</i>
          </div>
        </div>
        <span class="chart-column-label">${item.label}</span>
      </div>
    `).join("");

    const donutColors = ["#2563eb", "#10b981", "#f59e0b", "#dc2626", "#7c3aed"];
    let angle = 0;
    const donutSegments = doctorMetrics.map((metric, index) => {
      const degrees = scoped.length ? (metric.count / scoped.length) * 360 : 0;
      const segment = `${donutColors[index % donutColors.length]} ${angle}deg ${angle + degrees}deg`;
      angle += degrees;
      return segment;
    });
    document.getElementById("doctorDonut").style.background = scoped.length
      ? `conic-gradient(${donutSegments.join(",")})`
      : "conic-gradient(#e9edf3 0deg 360deg)";
    document.getElementById("donutTotal").textContent = scoped.length;
    document.getElementById("doctorLegend").innerHTML = doctorMetrics.map((metric, index) => `
      <div class="legend-item">
        <span class="legend-swatch" style="background:${donutColors[index % donutColors.length]}"></span>
        <span>Dr. ${Helpers.escape(metric.doctor.lastName)}</span>
        <strong>${metric.count}</strong>
      </div>
    `).join("");

    const trendData = period === "monthly"
      ? groupedDates.map((group, index) => {
          const segmentDates = dates.slice(index * 3, index * 3 + 3);
          return {
            label: group.label,
            value: segmentDates.reduce((sum, date) => sum + attended.filter(item => item.date === date).length, 0)
          };
        })
      : dates.map(date => ({
          label: DateUtils.format(date, { weekday: "short" }),
          value: attended.filter(item => item.date === date).length
        }));
    document.getElementById("attendanceLineChart").innerHTML = this.lineChart(trendData);

    document.getElementById("doctorPerformanceTable").innerHTML = doctorMetrics.map(metric => {
      const utilization = Math.round((metric.count / maxDoctorLoad) * 100);
      return `
        <tr>
          <td>
            <div class="table-person">
              <span class="row-avatar doctor-avatar">${Helpers.initials(metric.doctor.firstName, metric.doctor.lastName)}</span>
              <div>
                <strong>${Helpers.escape(Helpers.doctorName(metric.doctor))}</strong>
                <small>${Helpers.escape(metric.doctor.room)}</small>
              </div>
            </div>
          </td>
          <td>${Helpers.escape(metric.doctor.specialization)}</td>
          <td><strong>${metric.count}</strong></td>
          <td>${metric.attendanceRate}%</td>
          <td>
            <div class="progress-cell">
              <div class="progress-track"><div class="progress-fill" style="width:${utilization}%"></div></div>
              <span>${utilization}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },

  lineChart(data) {
    const width = 1000;
    const height = 210;
    const paddingX = 45;
    const paddingTop = 20;
    const paddingBottom = 35;
    const chartHeight = height - paddingTop - paddingBottom;
    const max = Math.max(...data.map(item => item.value), 1);
    const step = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;
    const points = data.map((item, index) => {
      const x = paddingX + step * index;
      const y = paddingTop + chartHeight - (item.value / max) * chartHeight;
      return { x, y, ...item };
    });
    const pointString = points.map(point => `${point.x},${point.y}`).join(" ");
    const areaPoints = `${paddingX},${paddingTop + chartHeight} ${pointString} ${width - paddingX},${paddingTop + chartHeight}`;
    const gridLines = Array.from({ length: 5 }, (_, index) => {
      const y = paddingTop + (chartHeight / 4) * index;
      return `<line class="line-grid" x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}"></line>`;
    }).join("");
    const labels = points.map(point => `
      <text class="line-label" x="${point.x}" y="${height - 8}" text-anchor="middle">${point.label}</text>
      <circle class="line-point" cx="${point.x}" cy="${point.y}" r="4"></circle>
    `).join("");

    return `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Completed attendance trend">
        ${gridLines}
        <polygon class="line-area" points="${areaPoints}"></polygon>
        <polyline class="line-path" points="${pointString}"></polyline>
        ${labels}
      </svg>
    `;
  }
};

const Actions = {
  setAppointmentStatus(appointmentId, status) {
    DB.setAppointmentStatus(appointmentId, status);
    Render.all();
    Toast.show("Appointment updated", `The appointment is now ${status.toLowerCase()}.`);
  },

  payBill(billId) {
    DB.markBillPaid(billId);
    Render.all();
    Toast.show("Payment recorded", `${billId} has been marked as paid.`);
  }
};

const Forms = {
  setStatus(id, message, error = false) {
    const element = document.getElementById(id);
    element.textContent = message;
    element.classList.toggle("error", error);
  },

  reset(form, statusId) {
    form.reset();
    Validation.clear(form);
    this.setStatus(statusId, "");
  },

  init() {
    const patientForm = document.getElementById("patientForm");
    patientForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!Validation.patient(patientForm)) {
        this.setStatus("patientFormStatus", "Please correct the highlighted fields.", true);
        return;
      }
      const patient = Object.fromEntries(new FormData(patientForm).entries());
      const record = DB.addPatient(patient);
      this.reset(patientForm, "patientFormStatus");
      Render.all();
      this.setStatus("patientFormStatus", `${record.patientId} was registered successfully.`);
      Toast.show("Patient registered", `${record.firstName} ${record.lastName} was added as ${record.patientId}.`);
    });

    document.getElementById("cancelPatientForm").addEventListener("click", () => {
      this.reset(patientForm, "patientFormStatus");
    });

    const appointmentForm = document.getElementById("appointmentForm");
    appointmentForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!Validation.appointment(appointmentForm)) {
        this.setStatus("appointmentFormStatus", "Please correct the highlighted fields.", true);
        return;
      }
      const appointment = Object.fromEntries(new FormData(appointmentForm).entries());
      const record = DB.addAppointment(appointment);
      this.reset(appointmentForm, "appointmentFormStatus");
      Render.all();
      this.setStatus("appointmentFormStatus", `${record.appointmentId} was booked successfully.`);
      Toast.show("Appointment booked", `${record.appointmentId} has been added to the clinic schedule.`);
    });

    document.getElementById("cancelAppointmentForm").addEventListener("click", () => {
      this.reset(appointmentForm, "appointmentFormStatus");
    });

    const billingForm = document.getElementById("billingForm");
    billingForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!Validation.billing(billingForm)) {
        this.setStatus("billingFormStatus", "Please complete the required billing fields.", true);
        return;
      }
      const bill = Object.fromEntries(new FormData(billingForm).entries());
      const record = DB.addBill(bill);
      this.reset(billingForm, "billingFormStatus");
      Render.all();
      this.setStatus("billingFormStatus", `${record.billId} was issued successfully.`);
      Toast.show("Bill issued", `${record.billId} was created for ${Helpers.currency(record.amount)}.`);
    });

    document.getElementById("cancelBillingForm").addEventListener("click", () => {
      this.reset(billingForm, "billingFormStatus");
    });
  }
};

const Events = {
  init() {
    document.querySelectorAll(".nav-item").forEach(button => {
      button.addEventListener("click", () => Router.go(button.dataset.view));
    });

    document.getElementById("menuButton").addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("open");
    });

    document.getElementById("globalSearch").addEventListener("input", event => {
      Render.patientQuery = event.target.value;
      document.getElementById("patientSearch").value = event.target.value;
      if (event.target.value.trim()) Router.go("patients");
    });

    document.getElementById("patientSearch").addEventListener("input", event => {
      Render.patientQuery = event.target.value;
      Render.patientTable();
    });

    document.getElementById("appointmentStatusFilter").addEventListener("change", event => {
      Render.appointmentFilter = event.target.value;
      Render.appointmentTable();
      Helpers.createIcons();
    });

    document.getElementById("billingStatusFilter").addEventListener("change", event => {
      Render.billingFilter = event.target.value;
      Render.billing();
      Helpers.createIcons();
    });

    document.getElementById("focusBillingForm").addEventListener("click", () => {
      document.getElementById("billingFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => document.getElementById("billingPatient").focus(), 350);
    });

    ["reportPeriod", "reportEndDate"].forEach(id => {
      document.getElementById(id).addEventListener("change", () => {
        Render.reports();
        Helpers.createIcons();
      });
    });

    document.getElementById("exportReport").addEventListener("click", () => {
      this.exportReport();
    });
  },

  exportReport() {
    const rows = [["Doctor Name", "Specialization", "Number of Appointments", "Attendance Rate"]];
    document.querySelectorAll("#doctorPerformanceTable tr").forEach(row => {
      const cells = [...row.querySelectorAll("td")];
      if (!cells.length) return;
      rows.push([
        cells[0].innerText.replace(/\s+/g, " ").trim(),
        cells[1].innerText.trim(),
        cells[2].innerText.trim(),
        cells[3].innerText.trim()
      ]);
    });
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medlink-clinic-report-${DateUtils.today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    Toast.show("Report exported", "The doctor performance report was downloaded as CSV.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  DB.init();
  document.getElementById("reportEndDate").value = DateUtils.today();
  document.getElementById("appointmentDate").value = DateUtils.today();
  Forms.init();
  Events.init();
  const requestedView = new URLSearchParams(window.location.search).get("view");
  if (requestedView && Router.titles[requestedView]) {
    Router.go(requestedView);
  } else {
    Render.all();
  }
});
