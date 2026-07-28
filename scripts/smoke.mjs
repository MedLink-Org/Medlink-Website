import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactDir = path.join(projectRoot, ".smoke-artifacts");
const baseUrl = "http://127.0.0.1:5173";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

  const vitePath = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
  const server = spawn(
    process.execPath,
    [vitePath, "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
    {
      cwd: projectRoot,
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
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto(baseUrl);
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
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
    await page.locator("#email").fill("zara.mensah@example.com");
    await page.locator("#address").fill("17 Douglas Road, Owerri, Imo State");
    await page.locator("#bloodType").selectOption("A+");
    await page.locator("#genotype").selectOption("AA");
    await page.getByRole("button", { name: "Register Patient" }).click();
    await page.getByText("Patient registered", { exact: true }).waitFor();
    await page.getByRole("cell", { name: "P007", exact: true }).waitFor();
    await screenshot(page, "patients-desktop");

    await navigate(page, "/appointments", "Appointment Management");
    await page.locator("#appointmentPatient").selectOption("P007");
    await page.locator("#appointmentDoctor").selectOption("D04");
    await page.locator("#appointmentTime").fill("17:45");
    await page.locator("#appointmentType").selectOption("Follow-up");
    await page.locator("#appointmentReason").fill("Post-treatment review");
    await page.getByRole("button", { name: "Confirm Appointment" }).click();
    await page.getByText("Appointment booked", { exact: true }).waitFor();
    let appointmentRow = page.locator("tbody tr").filter({ hasText: "Zara Mensah" });
    await appointmentRow.waitFor();
    await appointmentRow.getByRole("button", { name: "Check in" }).click();
    appointmentRow = page.locator("tbody tr").filter({ hasText: "Zara Mensah" });
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
    assert(await page.locator(".chart-legend .legend-item").count() === 4, "Doctor utilization legend did not render.");
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

    assert(runtimeErrors.length === 0, `Browser runtime errors:\n${runtimeErrors.join("\n")}`);
    console.log("Smoke test passed: dashboard, patients, appointments, billing, reports, export, and mobile navigation.");
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
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
