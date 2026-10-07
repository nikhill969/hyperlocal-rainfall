const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const net = require('node:net');

const backendRoot = path.join(__dirname, '..');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hyperlocal-access-'));
let serverProcess;
let port;

async function availablePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port: available } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return available;
}

function startServer() {
  serverProcess = spawn(process.execPath, [path.join(backendRoot, 'server.js')], {
    cwd: backendRoot,
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dataDir,
      AUTH_SECRET: 'test-auth-secret-only',
      GOOGLE_CLIENT_ID: '',
      ADMIN_EMAIL: 'admin@test.local',
      ADMIN_PASSWORD: 'TestAdminPass123'
    },
    stdio: 'ignore'
  });
}

async function stopServer() {
  if (!serverProcess || serverProcess.exitCode !== null) return;
  const exited = once(serverProcess, 'exit');
  serverProcess.kill();
  await exited;
}

async function waitForServer() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('Backend did not become ready.');
}

async function request(endpoint, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return { status: response.status, body: await response.json() };
}

test('role access, locality isolation, and JSON persistence', async (t) => {
  port = await availablePort();
  startServer();
  t.after(async () => {
    await stopServer();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });
  await waitForServer();

  const anonymous = await request('/api/reports');
  assert.equal(anonymous.status, 401);

  const adminLogin = await request('/api/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@test.local', password: 'TestAdminPass123' })
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.body.token;

  const registerCitizen = (name, email, area, areaLatitude, areaLongitude) => request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password: 'CitizenPass123', area, areaLatitude, areaLongitude })
  });
  const solapur = await registerCitizen('Solapur Citizen', 'solapur@test.local', 'Solapur', 17.6599, 75.9067);
  const pune = await registerCitizen('Pune Citizen', 'pune@test.local', 'Pune', 18.5204, 73.8567);
  assert.equal(solapur.status, 201);
  assert.equal(pune.status, 201);
  assert.equal(solapur.body.token, undefined);
  assert.equal(solapur.body.message, 'Registration successful. Please login to continue.');
  assert.equal(solapur.body.user.areaLatitude, 17.6599);

  const duplicateRegistration = await registerCitizen('Solapur Duplicate', 'solapur@test.local', 'Solapur', 17.6599, 75.9067);
  assert.equal(duplicateRegistration.status, 409);

  const adminThroughCitizenLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@test.local', password: 'TestAdminPass123' })
  });
  assert.equal(adminThroughCitizenLogin.status, 403);

  const accountNotFound = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'unregistered@test.local', password: 'CitizenPass123' })
  });
  assert.equal(accountNotFound.status, 404);
  assert.match(accountNotFound.body.message, /Account not found/);

  const incorrectPassword = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'solapur@test.local', password: 'WrongPass123' })
  });
  assert.equal(incorrectPassword.status, 401);
  assert.match(incorrectPassword.body.message, /Incorrect password/);

  const solapurLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'solapur@test.local', password: 'CitizenPass123' })
  });
  assert.equal(solapurLogin.status, 200);
  const restoredProfile = await request('/api/auth/me', { headers: { Authorization: `Bearer ${solapurLogin.body.token}` } });
  assert.equal(restoredProfile.body.user.area, 'Solapur');
  assert.equal(restoredProfile.body.user.areaLatitude, 17.6599);

  const googleWithoutConfiguration = await request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential: 'not-a-google-token' })
  });
  assert.equal(googleWithoutConfiguration.status, 503);

  const submit = (token, area, latitude, longitude) => request('/api/reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      location: `${area} test street`,
      latitude,
      longitude,
      problemType: 'Road Waterlogging',
      description: 'Waterlogging reported for role access test.'
    })
  });
  const puneLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'pune@test.local', password: 'CitizenPass123' })
  });
  assert.equal(puneLogin.status, 200);
  const reportA = await submit(solapurLogin.body.token, 'Solapur', 17.6599, 75.9067);
  const reportB = await submit(puneLogin.body.token, 'Pune', 18.5204, 73.8567);
  assert.equal(reportA.status, 201);
  assert.equal(reportB.status, 201);

  const reportsA = await request('/api/reports', { headers: { Authorization: `Bearer ${solapurLogin.body.token}` } });
  const reportsB = await request('/api/reports', { headers: { Authorization: `Bearer ${puneLogin.body.token}` } });
  const allReports = await request('/api/reports', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.deepEqual(reportsA.body.reports.map((report) => report.area), ['Solapur']);
  assert.deepEqual(reportsB.body.reports.map((report) => report.area), ['Pune']);
  assert.equal(allReports.body.count, 2);

  const privateReport = await request(`/api/reports/${reportB.body.report.id}`, {
    headers: { Authorization: `Bearer ${solapurLogin.body.token}` }
  });
  assert.equal(privateReport.status, 403);

  const citizenModeration = await request(`/api/reports/${reportA.body.report.id}/verify`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${solapurLogin.body.token}` },
    body: JSON.stringify({ status: 'Verified' })
  });
  assert.equal(citizenModeration.status, 403);

  const adminModeration = await request(`/api/reports/${reportA.body.report.id}/verify`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'Resolved', resolution: 'Drain cleared and roadway inspected.' })
  });
  assert.equal(adminModeration.status, 200);
  assert.equal(adminModeration.body.report.resolution, 'Drain cleared and roadway inspected.');
  assert.equal(adminModeration.body.report.statusHistory.at(-1).status, 'Resolved');

  const citizens = await request('/api/users', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(citizens.body.totalCitizens, 2);
  assert.equal('passwordHash' in citizens.body.users[0], false);

  const forgot = await request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'solapur@test.local' })
  });
  assert.equal(forgot.status, 200);
  assert.ok(forgot.body.developmentResetToken);
  const reset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: forgot.body.developmentResetToken, password: 'ChangedPass456' })
  });
  assert.equal(reset.status, 200);
  const reusedReset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: forgot.body.developmentResetToken, password: 'ChangedPass789' })
  });
  assert.equal(reusedReset.status, 400);
  const oldPasswordLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'solapur@test.local', password: 'CitizenPass123' })
  });
  assert.equal(oldPasswordLogin.status, 401);
  const newPasswordLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'solapur@test.local', password: 'ChangedPass456' })
  });
  assert.equal(newPasswordLogin.status, 200);

  const storedReports = JSON.parse(fs.readFileSync(path.join(dataDir, 'reports.json'), 'utf8'));
  assert.equal(storedReports.length, 2);
  assert.equal(storedReports.find((report) => report.id === reportA.body.report.id).status, 'Resolved');

  await stopServer();
  startServer();
  await waitForServer();
  const resumedLogin = await request('/api/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@test.local', password: 'TestAdminPass123' })
  });
  assert.equal(resumedLogin.status, 200);
  const adminThroughCitizenEndpoint = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@test.local', password: 'TestAdminPass123' })
  });
  assert.equal(adminThroughCitizenEndpoint.status, 403);
  const persistedReports = await request('/api/reports', { headers: { Authorization: `Bearer ${resumedLogin.body.token}` } });
  assert.equal(persistedReports.body.count, 2);
  assert.equal(persistedReports.body.reports.find((report) => report.id === reportA.body.report.id).status, 'Resolved');
});