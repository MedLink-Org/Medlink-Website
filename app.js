/* =========================================================
   MedLink Clinic Appointment System
   Client-side demo of the proposed React + Node.js + PostgreSQL stack.
   DB.* below mirrors the ERD tables from the project charter:
   Patient, Doctor, Appointment. In production this logic would
   live behind a Node/Express API talking to PostgreSQL; here it
   runs against localStorage so the whole system can be demoed
   live, offline, with no server.
   ========================================================= */

const DB = {
  key: 'medlink_v1',

  seedDoctors: [
    { doctorId: 'D01', firstName: 'Ifeoma', lastName: 'Smith', specialization: 'General Practice' },
    { doctorId: 'D02', firstName: 'Chinedu', lastName: 'Adams', specialization: 'Pediatrics' },
    { doctorId: 'D03', firstName: 'Bola',    lastName: 'Nwosu', specialization: 'Cardiology' },
  ],

  load() {
    const raw = localStorage.getItem(this.key);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through to reseed */ }
    }
    const seed = {
      patients: [],
      doctors: this.seedDoctors,
      appointments: [],
      nextPatientId: 1,
      nextApptId: 1,
    };
    this.save(seed);
    return seed;
  },

  save(state) {
    localStorage.setItem(this.key, JSON.stringify(state));
  },

  state: null,

  init() {
    this.state = this.load();
  },

  addPatient(p) {
    const id = 'P' + String(this.state.nextPatientId).padStart(3, '0');
    const record = { patientId: id, ...p };
    this.state.patients.push(record);
    this.state.nextPatientId++;
    this.save(this.state);
    return record;
  },

  addAppointment(a) {
    const id = 'A' + String(this.state.nextApptId).padStart(3, '0');
    const record = { appointmentId: id, status: 'Scheduled', ...a };
    this.state.appointments.push(record);
    this.state.nextApptId++;
    this.save(this.state);
    return record;
  },

  setApptStatus(id, status) {
    const appt = this.state.appointments.find(a => a.appointmentId === id);
    if (appt) { appt.status = status; this.save(this.state); }
  },

  patientById(id) { return this.state.patients.find(p => p.patientId === id); },
  doctorById(id) { return this.state.doctors.find(d => d.doctorId === id); },
};

/* ===================== ROUTER ===================== */
const Router = {
  go(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + view).classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    Render.all();
    NavMenu.close();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

/* ===================== NAV MENU (mobile hamburger) ===================== */
const NavMenu = {
  btn: null,
  nav: null,

  init() {
    this.btn = document.getElementById('hamburgerBtn');
    this.nav = document.getElementById('topnav');
    if (!this.btn || !this.nav) return;

    this.btn.addEventListener('click', () => this.toggle());

    document.addEventListener('click', (e) => {
      const isOpen = this.nav.classList.contains('open');
      if (!isOpen) return;
      if (!this.nav.contains(e.target) && !this.btn.contains(e.target)) {
        this.close();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) this.close();
    });
  },

  toggle() {
    this.nav.classList.toggle('open');
    this.btn.classList.toggle('open');
    this.btn.setAttribute('aria-expanded', this.nav.classList.contains('open'));
  },

  close() {
    this.nav.classList.remove('open');
    this.btn.classList.remove('open');
    this.btn.setAttribute('aria-expanded', 'false');
  }
};

/* ===================== RENDER ===================== */
const Render = {
  all() {
    this.homeStats();
    this.dashboard();
    this.patientTable();
    this.apptSelects();
    this.apptTable();
    this.records();
    this.reports();
  },

  homeStats() {
    document.getElementById('statPatients').textContent = DB.state.patients.length;
    document.getElementById('statAppointments').textContent = DB.state.appointments.length;
    document.getElementById('statDoctors').textContent = DB.state.doctors.length;
    const today = new Date().toISOString().slice(0, 10);
    const todays = DB.state.appointments.filter(a => a.date === today).length;
    document.getElementById('panelToday').textContent = todays;
  },

  dashboard() {
    document.getElementById('dashPatients').textContent = DB.state.patients.length;
    document.getElementById('dashDoctors').textContent = DB.state.doctors.length;
    document.getElementById('dashAppointments').textContent = DB.state.appointments.length;
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('dashToday').textContent = DB.state.appointments.filter(a => a.date === today).length;

    const tbody = document.querySelector('#dashApptTable tbody');
    const upcoming = [...DB.state.appointments]
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 6);
    tbody.innerHTML = upcoming.length ? upcoming.map(a => {
      const p = DB.patientById(a.patientId), d = DB.doctorById(a.doctorId);
      return `<tr>
        <td>${a.appointmentId}</td>
        <td>${p ? p.firstName + ' ' + p.lastName : a.patientId}</td>
        <td>${d ? 'Dr. ' + d.lastName : a.doctorId}</td>
        <td>${a.date}</td><td>${a.time}</td>
        <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
      </tr>`;
    }).join('') : `<tr><td colspan="6" style="color:var(--ink-soft);">No appointments booked yet.</td></tr>`;

    const list = document.getElementById('doctorList');
    list.innerHTML = DB.state.doctors.map(d => {
      const load = DB.state.appointments.filter(a => a.doctorId === d.doctorId && a.status === 'Scheduled').length;
      return `<div class="doctor-chip">
        <div><strong>Dr. ${d.firstName} ${d.lastName}</strong><span>${d.specialization}</span></div>
        <span class="load">${load} booked</span>
      </div>`;
    }).join('');
  },

  patientTable() {
    document.getElementById('patientCount').textContent = DB.state.patients.length;
    const tbody = document.getElementById('patientTable');
    tbody.innerHTML = DB.state.patients.length ? DB.state.patients.map(p => `
      <tr>
        <td>${p.patientId}</td>
        <td>${p.firstName} ${p.lastName}</td>
        <td>${p.dob}</td>
        <td>${p.gender}</td>
        <td>${p.contact}</td>
        <td>${p.bloodType || '—'}</td>
      </tr>`).join('') : `<tr><td colspan="6" style="color:var(--ink-soft);">No patients registered yet.</td></tr>`;
  },

  apptSelects() {
    const pSel = document.getElementById('apptPatientSelect');
    const dSel = document.getElementById('apptDoctorSelect');
    const curP = pSel.value, curD = dSel.value;
    pSel.innerHTML = '<option value="">Select a registered patient</option>' +
      DB.state.patients.map(p => `<option value="${p.patientId}">${p.patientId} — ${p.firstName} ${p.lastName}</option>`).join('');
    dSel.innerHTML = '<option value="">Select a doctor</option>' +
      DB.state.doctors.map(d => `<option value="${d.doctorId}">Dr. ${d.firstName} ${d.lastName} — ${d.specialization}</option>`).join('');
    pSel.value = curP; dSel.value = curD;
  },

  apptTable() {
    document.getElementById('apptCount').textContent = DB.state.appointments.length;
    const tbody = document.getElementById('apptTable');
    tbody.innerHTML = DB.state.appointments.length ? [...DB.state.appointments].reverse().map(a => {
      const p = DB.patientById(a.patientId), d = DB.doctorById(a.doctorId);
      return `<tr>
        <td>${a.appointmentId}</td>
        <td>${p ? p.firstName + ' ' + p.lastName : a.patientId}</td>
        <td>${d ? 'Dr. ' + d.lastName : a.doctorId}</td>
        <td>${a.date}</td><td>${a.time}</td>
        <td>${a.reason || '—'}</td>
        <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
        <td>${a.status === 'Scheduled' ? `<button class="link-btn" onclick="Actions.complete('${a.appointmentId}')">Mark done</button>` : ''}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="8" style="color:var(--ink-soft);">No appointments yet — book one above.</td></tr>`;
  },

  records(filter = '') {
    const list = document.getElementById('recordList');
    const q = filter.trim().toLowerCase();
    const patients = DB.state.patients.filter(p =>
      !q || p.patientId.toLowerCase().includes(q) ||
      (p.firstName + ' ' + p.lastName).toLowerCase().includes(q)
    );
    list.innerHTML = patients.length ? patients.map(p => {
      const appts = DB.state.appointments.filter(a => a.patientId === p.patientId);
      return `<div class="record-card">
        <div>
          <h4>${p.firstName} ${p.lastName}</h4>
          <div class="meta">${p.patientId} · ${p.gender} · DOB ${p.dob}<br>${p.contact}<br>${p.address || ''}</div>
        </div>
        <div class="meta">
          <span class="tag">Blood: ${p.bloodType || 'Unknown'}</span>
          <span class="tag">Genotype: ${p.genotype || 'Unknown'}</span>
        </div>
        <div class="meta">
          <strong style="color:var(--green-deep)">${appts.length} appointment${appts.length === 1 ? '' : 's'}</strong><br>
          ${appts.slice(-3).reverse().map(a => `${a.date} — ${DB.doctorById(a.doctorId)?.lastName || a.doctorId} (${a.status})`).join('<br>') || 'No visits recorded yet.'}
        </div>
      </div>`;
    }).join('') : `<p style="color:var(--ink-soft);">No matching patient records.</p>`;
  },

  reports() {
    const bars = document.getElementById('reportBars');
    const max = Math.max(1, ...DB.state.doctors.map(d => DB.state.appointments.filter(a => a.doctorId === d.doctorId).length));
    bars.innerHTML = DB.state.doctors.map(d => {
      const n = DB.state.appointments.filter(a => a.doctorId === d.doctorId).length;
      const pct = Math.round((n / max) * 100);
      return `<div class="bar-row">
        <span class="label">Dr. ${d.lastName}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="val">${n}</span>
      </div>`;
    }).join('');

    const statusEl = document.getElementById('statusReport');
    const counts = { Scheduled: 0, Completed: 0, Cancelled: 0 };
    DB.state.appointments.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    const colors = { Scheduled: 'var(--orange-soft)', Completed: 'var(--green-soft)', Cancelled: '#f4e2e2' };
    const textColors = { Scheduled: 'var(--orange)', Completed: 'var(--green-deep)', Cancelled: '#b3453f' };
    statusEl.innerHTML = Object.entries(counts).map(([status, n]) => `
      <div class="status-chip" style="background:${colors[status]}">
        <strong style="color:${textColors[status]}">${n}</strong>
        <span style="color:${textColors[status]}">${status}</span>
      </div>`).join('');
  }
};

/* ===================== ACTIONS ===================== */
const Actions = {
  complete(id) { DB.setApptStatus(id, 'Completed'); Render.all(); }
};

/* ===================== EVENTS ===================== */
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  Render.all();
  NavMenu.init();

  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => Router.go(btn.dataset.view));
  });

  document.getElementById('patientForm').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const patient = Object.fromEntries(fd.entries());
    const record = DB.addPatient(patient);
    document.getElementById('patientMsg').textContent = `✓ Registered as ${record.patientId}`;
    e.target.reset();
    Render.all();
    setTimeout(() => document.getElementById('patientMsg').textContent = '', 4000);
  });

  document.getElementById('apptForm').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const appt = Object.fromEntries(fd.entries());
    if (!appt.patientId || !appt.doctorId) return;
    const record = DB.addAppointment(appt);
    document.getElementById('apptMsg').textContent = `✓ Booked as ${record.appointmentId}`;
    e.target.reset();
    Render.all();
    setTimeout(() => document.getElementById('apptMsg').textContent = '', 4000);
  });

  document.getElementById('recordSearch').addEventListener('input', e => {
    Render.records(e.target.value);
  });
});