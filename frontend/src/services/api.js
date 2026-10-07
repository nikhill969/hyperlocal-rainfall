const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'hyperlocal-session-token';

export function saveSession(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed. Please try again.');
  }

  return data;
}

export async function login(payload) {
  return apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export async function adminLogin(payload) {
  return apiRequest('/api/auth/admin-login', { method: 'POST', body: JSON.stringify(payload) });
}

export async function register(payload) {
  return apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function googleAuth(payload) {
  return apiRequest('/api/auth/google', { method: 'POST', body: JSON.stringify(payload) });
}

export async function requestPasswordReset(email) {
  return apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function resetPassword(token, password) {
  return apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
}

export async function getCurrentUser() {
  return apiRequest('/api/auth/me');
}

export async function getLocations() {
  return apiRequest('/api/auth/locations');
}

export async function getUsers() {
  return apiRequest('/api/users');
}

export async function getAreaOverview() {
  return apiRequest('/api/areas');
}

export async function getWeather(lat, lon) {
  return apiRequest(`/api/weather?lat=${lat}&lon=${lon}`);
}

export async function getRisk(lat, lon) {
  return apiRequest(`/api/risk?lat=${lat}&lon=${lon}`);
}

export async function getReports({ mine = false } = {}) {
  return apiRequest(`/api/reports${mine ? '/my' : ''}`);
}

export async function createReport(payload) {
  return apiRequest('/api/reports', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function verifyReport(id, status = 'Verified', resolution) {
  return apiRequest(`/api/reports/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify({ status, ...(resolution !== undefined ? { resolution } : {}) })
  });
}

export async function deleteReport(id) {
  return apiRequest(`/api/reports/${id}`, {
    method: 'DELETE'
  });
}

export async function getHotspots() {
  return apiRequest('/api/hotspots');
}

export async function getAnalytics() {
  return apiRequest('/api/analytics');
}

