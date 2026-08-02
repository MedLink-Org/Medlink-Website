import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { createSeedData } from "../src/data/seedData.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactDir = path.join(projectRoot, ".smoke-artifacts");
const baseUrl = "http://127.0.0.1:5174";
const apiUrl = "http://127.0.0.1:5001";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": baseUrl,
    "Content-Type": "application/json"
  });
  response.end(payload === null ? "" : JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }
  return body ? JSON.parse(body) : {};
}

function createMockApi() {
  const seed = createSeedData();
  const state = {
    patients: seed.patients.map(patient => ({
      patient_id: patient.patientId,
      first_name: patient.firstName,
      last_name: patient.lastName,
      date_of_birth: patient.dob,
      contact_info: patient.phone,
      gender: patient.gender,
      address: patient.address,
      email: patient.email,
      blood_type: patient.bloodType,
      genotype: patient.genotype,
      medical_history: patient.medicalHistory
    })),
    doctors: seed.doctors.map(doctor => ({
      doctor_id: doctor.doctorId,
      first_name: doctor.firstName,
      last_name: doctor.lastName,
      specialization: doctor.specialization,
      room: doctor.room
    })),
    nurses: seed.nurses.map(nurse => ({
      nurse_id: nurse.nurseId,
      first_name: nurse.firstName,
      last_name: nurse.lastName,
      date_of_birth: `${nurse.dob}T00:00:00.000Z`,
      specialization: nurse.specialization,
      department: nurse.department,
      phone: nurse.phone,
      date_of_employment: `${nurse.dateOfEmployment}T00:00:00.000Z`
    })),
    staff: [],
    appointments: seed.appointments.map(appointment => ({
      appointment_id: appointment.appointmentId,
      patient_id: appointment.patientId,
      doctor_id: appointment.doctorId,
      appointment_date: appointment.date,
      appointment_time: appointment.time,
      visit_type: appointment.visitType,
      reason: appointment.reason,
      status: appointment.status
    })),
    medicalRecords: [],
    bills: seed.bills.map(bill => ({
      bill_id: bill.billId,
      patient_id: bill.patientId,
      bill_type: bill.billType,
      amount: bill.amount,
      mode: bill.mode,
      date_issued: bill.dateIssued,
      date_paid: bill.datePaid,
      status: bill.status
    })),
    accessToken: "mock-medlink-jwt",
    currentUser: {
      user_id: "U001",
      full_name: "Amara Okafor",
      email: "amara.okafor@medlink.example",
      avatar_url: null,
      role: "staff",
      profile_id: null
    },
    password: "SecurePass123!",
    dataUnavailable: false
  };

  const collections = new Map([
    ["/api/patients", state.patients],
    ["/api/doctors", state.doctors],
    ["/api/nurses", state.nurses],
    ["/api/staff", state.staff],
    ["/api/appointments", state.appointments],
    ["/api/medical-records", state.medicalRecords],
    ["/api/billing", state.bills]
  ]);

  const server = createServer(async (request, response) => {
    try {
      if (request.method === "OPTIONS") {
        sendJson(response, 204, null);
        return;
      }

      const url = new URL(request.url, apiUrl);

      if (request.method === "POST" && url.pathname === "/api/auth/register") {
        const body = await readJson(request);
        if (state.currentUser) {
          sendJson(response, 409, { error: "A user account with this email already exists." });
          return;
        }
        state.currentUser = {
          user_id: "U003",
          full_name: "",
          email: body.email,
          avatar_url: null,
          role: body.role,
          profile_id: null
        };
        state.password = body.password;
        sendJson(response, 201, {
          access_token: state.accessToken,
          token_type: "Bearer",
          expires_in: "7d",
          user: state.currentUser
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/auth/login") {
        const body = await readJson(request);
        if (
          body.email !== state.currentUser?.email
          || body.password !== state.password
        ) {
          sendJson(response, 401, { error: "Invalid email or password." });
          return;
        }
        sendJson(response, 200, {
          access_token: state.accessToken,
          token_type: "Bearer",
          expires_in: "7d",
          user: state.currentUser
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/auth/me") {
        if (request.headers.authorization !== `Bearer ${state.accessToken}`) {
          sendJson(response, 401, { error: "Authentication required." });
          return;
        }
        sendJson(response, 200, {
          access_token: state.accessToken,
          token_type: "Bearer",
          expires_in: "7d",
          user: state.currentUser
        });
        return;
      }

      if (
        url.pathname.startsWith("/api/")
        && request.headers.authorization !== `Bearer ${state.accessToken}`
      ) {
        sendJson(response, 401, { error: "Authentication required." });
        return;
      }

      if (state.dataUnavailable) {
        sendJson(response, 503, { message: "Mock API unavailable." });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/patients") {
        const records = state.currentUser?.role === "patient"
          ? state.patients.filter(
            item => String(item.patient_id) === String(state.currentUser.profile_id)
          )
          : state.patients;
        sendJson(response, 200, { data: records });
        return;
      }

      const collection = collections.get(url.pathname);

      if (request.method === "GET" && collection) {
        sendJson(response, 200, { data: collection });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/patients") {
        const record = {
          ...await readJson(request),
          patient_id: `P${String(state.patients.length + 1).padStart(3, "0")}`
        };
        state.patients.push(record);
        if (state.currentUser?.role === "patient" && !state.currentUser.profile_id) {
          state.currentUser = {
            ...state.currentUser,
            full_name: `${record.first_name} ${record.last_name}`,
            profile_id: record.patient_id
          };
        }
        sendJson(response, 201, { data: record });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/doctors") {
        const record = {
          doctor_id: `D${String(state.doctors.length + 1).padStart(2, "0")}`,
          ...await readJson(request)
        };
        state.doctors.push(record);
        sendJson(response, 201, { data: { doctor: record } });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/nurses") {
        const record = await readJson(request);
        state.nurses.push(record);
        sendJson(response, 201, { data: { nurse: record } });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/appointments") {
        const record = await readJson(request);
        state.appointments.push(record);
        sendJson(response, 201, { data: record });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/billing") {
        const record = await readJson(request);
        state.bills.push(record);
        sendJson(response, 201, { data: record });
        return;
      }

      const appointmentMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)$/);
      if (request.method === "PUT" && appointmentMatch) {
        const record = await readJson(request);
        const index = state.appointments.findIndex(
          item => String(item.appointment_id) === decodeURIComponent(appointmentMatch[1])
        );
        if (index >= 0) state.appointments[index] = record;
        sendJson(response, 200, { data: record });
        return;
      }

      const billMatch = url.pathname.match(/^\/api\/billing\/([^/]+)$/);
      if (request.method === "PUT" && billMatch) {
        const record = await readJson(request);
        const index = state.bills.findIndex(
          item => String(item.bill_id) === decodeURIComponent(billMatch[1])
        );
        if (index >= 0) state.bills[index] = record;
        sendJson(response, 200, { data: record });
        return;
      }

      sendJson(response, 404, { message: `No mock route for ${request.method} ${url.pathname}.` });
    } catch (error) {
      sendJson(response, 500, { message: error.message });
    }
  });

  return { server, state };
}

async function listen(server, port) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}

async function close(server) {
  await new Promise(resolve => server.close(resolve));
}

async function waitForServer(server) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Vite exited before becoming ready with code ${server.exitCode}.`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Vite has not bound the port yet.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the Vite development server.");
}

async function assertNoPageOverflow(page, route) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  assert(
    dimensions.scrollWidth <= dimensions.clientWidth + 1,
    `${route} overflows horizontally (${dimensions.scrollWidth}px > ${dimensions.clientWidth}px).`
  );
}

async function screenshot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  const layout = await page.evaluate(() => {
    const topbar = document.querySelector(".topbar")?.getBoundingClientRect();
    const heading = document.querySelector(".page-heading")?.getBoundingClientRect();
    return topbar && heading
      ? { topbarBottom: topbar.bottom, headingTop: heading.top }
      : null;
  });
  assert(
    !layout || layout.headingTop >= layout.topbarBottom,
    `${name} page heading is obscured by the top bar.`
  );
  await page.screenshot({
    path: path.join(artifactDir, `${name}.png`),
    fullPage: true
  });
}

async function navigate(page, route, heading) {
  await page.goto(`${baseUrl}${route}`);
  await page.getByRole("heading", { name: heading, exact: true }).waitFor();
  await assertNoPageOverflow(page, route);
}

async function run() {
  await mkdir(artifactDir, { recursive: true });

  const mockApi = createMockApi();
  await listen(mockApi.server, 5001);

  const vitePath = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
  const server = spawn(
    process.execPath,
    [vitePath, "--host", "127.0.0.1", "--port", "5174", "--strictPort"],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        VITE_API_URL: apiUrl
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    }
  );
  let serverLog = "";
  server.stdout.on("data", chunk => {
    serverLog += chunk;
  });
  server.stderr.on("data", chunk => {
    serverLog += chunk;
  });

  let browser;
  try {
    await waitForServer(server);
    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true
    });
    const context = await browser.newContext({
      acceptDownloads: true,
      colorScheme: "light",
      timezoneId: "Africa/Lagos",
      viewport: { width: 1440, height: 1000 }
    });
    const page = await context.newPage();
    const runtimeErrors = [];

    page.on("pageerror", error => runtimeErrors.push(error.message));
    page.on("console", message => {
      const text = message.text();
      const expectedAuthResponse = /401 \(Unauthorized\)/.test(text);
      if (message.type() === "error" && !expectedAuthResponse) runtimeErrors.push(text);
    });

    await page.goto(baseUrl);
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();
    await page.getByRole("heading", { name: "Sign in to MedLink", exact: true }).waitFor();
    await screenshot(page, "login-desktop");
    await page.locator("#authEmail").fill("amara.okafor@medlink.example");
    await page.locator("#authPassword").fill("SecurePass123!");
    await page.locator(".auth-form").getByRole("button", { name: "Sign In", exact: true }).click();
    await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
    await page.getByText("Amara Okafor", { exact: true }).waitFor();
    await page.getByRole("heading", { name: /Good (morning|afternoon|evening), Amara/ }).waitFor();
    await assertNoPageOverflow(page, "/");
    assert(await page.locator(".stat-card").count() === 4, "Dashboard stat cards did not render.");
    assert(await page.locator(".appointment-row").count() === 5, "Today's seeded appointments did not render.");
    await screenshot(page, "dashboard-desktop");

    await navigate(page, "/patients", "Patient Registration");
    await page.locator("#firstName").fill("Zara");
    await page.locator("#lastName").fill("Mensah");
    await page.locator("#dob").fill("1994-03-18");
    await page.locator("#gender").selectOption("Female");
    await page.locator("#phone").fill("+234 801 555 0199");
    await page.locator("#address").fill("17 Douglas Road, Owerri, Imo State");
    await page.getByRole("button", { name: "Register Patient" }).click();
    await page.getByText("Patient registered", { exact: true }).waitFor();
    await page.getByRole("cell", { name: "P007", exact: true }).waitFor();
    await screenshot(page, "patients-desktop");

    await navigate(page, "/doctors", "Doctor Registration");
    await page.locator("#doctorFirstName").fill("Amina");
    await page.locator("#doctorLastName").fill("Bello");
    await page.locator("#doctorDob").fill("1986-02-11");
    await page.locator("#doctorSpecialization").fill("Neurology");
    await page.locator("#doctorPhone").fill("+234 802 555 0147");
    await page.locator("#doctorEmploymentDate").fill("2020-09-14");
    await page.locator("#doctorAddress").fill("8 Orlu Road, Owerri, Imo State");
    await page.getByRole("button", { name: "Register Doctor" }).click();
    await page.getByText("Doctor registered", { exact: true }).waitFor();
    await page.getByRole("cell", { name: "D05", exact: true }).waitFor();
    assert(
      mockApi.state.doctors.at(-1)?.contact_info === "+234 802 555 0147",
      "Doctor contact information was not sent to the API."
    );
    assert(
      mockApi.state.doctors.at(-1)?.date_of_employment === "2020-09-14",
      "Doctor employment date was not sent to the API."
    );
    await screenshot(page, "doctors-desktop");

    await navigate(page, "/nurses", "Nurse Registration");
    await page.locator("#nurseFirstName").fill("Lydia");
    await page.locator("#nurseLastName").fill("Nnamdi");
    await page.locator("#nurseDob").fill("1990-08-19");
    await page.locator("#nursePhone").fill("+234 809 555 0138");
    await page.locator("#nurseAddress").fill("4 Imo State University Road, Owerri");
    await page.locator("#nurseEmploymentDate").fill("2015-08-19");
    await page.getByRole("button", { name: "Register Nurse" }).click();
    await page.getByText("Nurse registered", { exact: true }).waitFor();
    await page.getByRole("cell", { name: "N03", exact: true }).waitFor();
    assert(
      mockApi.state.nurses.at(-1)?.address === "4 Imo State University Road, Owerri",
      "Nurse address was not sent to the API."
    );
    assert(
      mockApi.state.nurses.at(-1)?.date_of_employment === "2015-08-19",
      "Nurse employment date was not sent to the API."
    );
    await screenshot(page, "nurses-desktop");

    await navigate(page, "/appointments", "Appointment Management");
    await page.locator("#appointmentPatient").selectOption("P007");
    await page.locator("#appointmentDoctor").selectOption("D05");
    await page.locator("#appointmentNurse").selectOption("N03");
    await page.locator("#appointmentTime").fill("17:45");
    await page.locator("#appointmentType").selectOption("Follow-up");
    await page.locator("#appointmentReason").fill("Post-treatment review");
    await page.getByRole("button", { name: "Confirm Appointment" }).click();
    await page.getByText("Appointment booked", { exact: true }).waitFor();
    assert(
      mockApi.state.appointments.at(-1)?.nurse_id === "N03",
      "Optional nurse assignment was not sent to the API."
    );
    assert(
      mockApi.state.appointments.at(-1)?.status === "scheduled",
      "Appointment status was not sent in the backend's accepted format."
    );
    let appointmentRow = page.locator("tbody tr").filter({ hasText: "Zara Mensah" });
    await appointmentRow.waitFor();
    await appointmentRow.getByRole("button", { name: "Complete" }).click();
    await appointmentRow.getByText("Completed", { exact: true }).waitFor();
    await screenshot(page, "appointments-desktop");

    await navigate(page, "/billing", "Billing Management");
    await page.locator("#billingPatient").selectOption("P007");
    await page.locator("#billType").selectOption("Consultation");
    await page.locator("#billAmount").fill("22000");
    await page.locator("#paymentMode").selectOption("Card");
    await page.getByRole("button", { name: "Issue Bill" }).click();
    await page.getByText("Bill issued", { exact: true }).waitFor();
    const billRow = page.locator("tbody tr").filter({ hasText: "Zara Mensah" });
    await billRow.getByRole("button", { name: "Mark paid" }).click();
    await billRow.getByText("Paid", { exact: true }).waitFor();
    await screenshot(page, "billing-desktop");

    await navigate(page, "/reports", "Clinic Attendance Statistics");
    assert(await page.locator(".bar-chart .chart-column").count() === 7, "Weekly report bars did not render.");
    assert(
      await page.locator(".chart-legend .legend-item").count() === mockApi.state.doctors.length,
      "Doctor utilization legend did not render every registered doctor."
    );
    assert(await page.locator(".line-chart svg").isVisible(), "Attendance line chart did not render.");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export" }).click();
    const download = await downloadPromise;
    assert(download.suggestedFilename().endsWith(".csv"), "Report export did not produce a CSV file.");
    await screenshot(page, "reports-desktop");

    await page.setViewportSize({ width: 390, height: 844 });
    await navigate(page, "/", "Dashboard");
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    assert(await page.locator(".sidebar.open").isVisible(), "Mobile navigation did not open.");
    await page.getByRole("link", { name: /Patients/ }).click();
    await page.getByRole("heading", { name: "Patient Registration", exact: true }).waitFor();
    assert(!(await page.locator(".sidebar").evaluate(element => element.classList.contains("open"))), "Mobile navigation did not close after navigation.");
    await assertNoPageOverflow(page, "/patients (mobile)");
    await screenshot(page, "patients-mobile");

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: /Doctors/ }).click();
    await page.getByRole("heading", { name: "Doctor Registration", exact: true }).waitFor();
    assert(!(await page.locator(".sidebar").evaluate(element => element.classList.contains("open"))), "Mobile navigation did not close after Doctors navigation.");
    await assertNoPageOverflow(page, "/doctors (mobile)");
    await screenshot(page, "doctors-mobile");

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: /Nurses/ }).click();
    await page.getByRole("heading", { name: "Nurse Registration", exact: true }).waitFor();
    assert(!(await page.locator(".sidebar").evaluate(element => element.classList.contains("open"))), "Mobile navigation did not close after Nurses navigation.");
    await assertNoPageOverflow(page, "/nurses (mobile)");
    await screenshot(page, "nurses-mobile");

    assert(runtimeErrors.length === 0, `Browser runtime errors:\n${runtimeErrors.join("\n")}`);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => window.localStorage.removeItem("medlink_offline_v1:U001"));
    mockApi.state.dataUnavailable = true;
    await navigate(page, "/nurses", "Nurse Registration");
    await page.getByText("Working with local records", { exact: true }).waitFor();
    assert(await page.locator(".data-state-error").count() === 0, "API failure still replaced the page with a blocking error.");
    await page.getByRole("cell", { name: "N01", exact: true }).waitFor();
    await page.locator("#nurseFirstName").fill("Esther");
    await page.locator("#nurseLastName").fill("Obi");
    await page.locator("#nurseDob").fill("1988-05-27");
    await page.locator("#nursePhone").fill("+234 807 555 0106");
    await page.locator("#nurseAddress").fill("19 Tetlow Road, Owerri, Imo State");
    await page.locator("#nurseEmploymentDate").fill("2014-05-27");
    await page.getByRole("button", { name: "Register Nurse" }).click();
    await page.getByRole("cell", { name: "N03", exact: true }).waitFor();
    await page.waitForTimeout(150);
    await page.reload();
    await page.getByRole("heading", { name: "Nurse Registration", exact: true }).waitFor();
    await page.getByRole("cell", { name: "N03", exact: true }).waitFor();
    await screenshot(page, "nurses-offline-desktop");

    await page.getByRole("button", { name: /Amara Okafor/ }).click();
    await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
    await page.getByRole("heading", { name: "Sign in to MedLink", exact: true }).waitFor();
    mockApi.state.dataUnavailable = false;
    mockApi.state.currentUser = {
      user_id: "U002",
      full_name: "Chinedu Okafor",
      email: "chinedu.okafor@medlink.example",
      avatar_url: null,
      role: "doctor",
      profile_id: "D01"
    };
    await page.locator("#authEmail").fill("chinedu.okafor@medlink.example");
    await page.locator("#authPassword").fill("SecurePass123!");
    await page.locator(".auth-form").getByRole("button", { name: "Sign In", exact: true }).click();
    await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
    await navigate(page, "/doctors", "Doctor Directory");
    assert(
      await page.getByRole("button", { name: "Register Doctor", exact: true }).count() === 0,
      "Doctor accounts can see the doctor registration control."
    );
    await navigate(page, "/nurses", "Nurse Directory");
    assert(
      await page.getByRole("button", { name: "Register Nurse", exact: true }).count() === 0,
      "Doctor accounts can see the nurse registration control."
    );
    assert(
      await page.getByRole("link", { name: /Billing/ }).count() === 0,
      "Doctor accounts can see the billing navigation item."
    );
    mockApi.state.dataUnavailable = true;
    await page.reload();
    await page.getByRole("heading", { name: "Nurse Directory", exact: true }).waitFor();
    await page.getByText("Clinic API unavailable", { exact: true }).waitFor();
    assert(
      await page.getByRole("cell", { name: "N01", exact: true }).count() === 0,
      "Doctor accounts received staff offline fallback records."
    );
    mockApi.state.dataUnavailable = false;
    await page.goto(`${baseUrl}/billing`);
    await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
    await page.getByRole("button", { name: /Chinedu Okafor/ }).click();
    await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
    await page.getByRole("heading", { name: "Sign in to MedLink", exact: true }).waitFor();
    mockApi.state.currentUser = null;
    await page.getByLabel("Authentication method").getByRole("button", { name: "Create Account", exact: true }).click();
    await page.getByRole("heading", { name: "Create your MedLink account", exact: true }).waitFor();
    await page.locator("#authEmail").fill("grace.patient@example.com");
    await page.locator("#authPassword").fill("PatientPass123!");
    await page.locator("#authConfirmPassword").fill("PatientPass123!");
    await page.locator(".auth-form").getByRole("button", { name: "Create Account", exact: true }).click();
    await page.getByRole("heading", { name: "Patient Registration", exact: true }).waitFor();
    assert(
      await page.getByRole("link", { name: /Dashboard/ }).count() === 0,
      "Patient accounts can see dashboard navigation."
    );
    assert(
      await page.getByRole("link", { name: /Appointments/ }).count() === 0,
      "Patient accounts can see appointment navigation."
    );
    assert(
      await page.getByText("Patient Directory", { exact: true }).count() === 0,
      "Patient accounts can see the patient directory."
    );
    await page.locator("#firstName").fill("Grace");
    await page.locator("#lastName").fill("Nwosu");
    await page.locator("#dob").fill("1998-08-14");
    await page.locator("#gender").selectOption("Female");
    await page.locator("#phone").fill("+234 803 555 0142");
    await page.locator("#address").fill("12 Wetheral Road, Owerri, Imo State");
    await page.getByRole("button", { name: "Register Patient", exact: true }).click();
    await page.getByRole("heading", { name: "Registration complete", exact: true }).waitFor();
    await page.getByText("Your patient profile is linked to this account as P008.", { exact: true }).waitFor();
    await page.getByRole("button", { name: /Grace Nwosu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
    await page.getByRole("heading", { name: "Sign in to MedLink", exact: true }).waitFor();
    await page.locator("#authEmail").fill("grace.patient@example.com");
    await page.locator("#authPassword").fill("PatientPass123!");
    await page.locator(".auth-form").getByRole("button", { name: "Sign In", exact: true }).click();
    await page.getByRole("heading", { name: "Patient Registration", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Registration complete", exact: true }).waitFor();
    await page.goto(baseUrl);
    await page.getByRole("heading", { name: "Patient Registration", exact: true }).waitFor();
    await page.getByRole("button", { name: /Grace Nwosu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
    await page.getByRole("heading", { name: "Sign in to MedLink", exact: true }).waitFor();
    await page.goto(`${baseUrl}/patients`);
    await page.getByRole("heading", { name: "Sign in to MedLink", exact: true }).waitFor();

    console.log("Smoke test passed: patient signup, login, role permissions, bearer authentication, protected routes, workflows, staff-only offline records, logout, export, and mobile navigation.");
    console.log(`Screenshots: ${artifactDir}`);
  } catch (error) {
    if (serverLog.trim()) {
      console.error(serverLog.trim());
    }
    throw error;
  } finally {
    await browser?.close();
    if (server.exitCode === null) {
      server.kill();
    }
    await close(mockApi.server);
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
