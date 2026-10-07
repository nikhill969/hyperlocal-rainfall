const crypto = require('crypto');
const store = require('../services/jsonStore');
const { getWeatherData } = require('../services/weatherService');

const PROBLEM_TYPES = ['Road Waterlogging', 'Blocked Drain', 'Drain Overflow', 'Flooded Street', 'Heavy Rainfall', 'Other'];
const STATUSES = ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'];

function distanceKm(first, second) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDistance = radians(second.latitude - first.latitude);
  const longitudeDistance = radians(second.longitude - first.longitude);
  const value = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(longitudeDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function reportRisk(rainfall, nearbyReports, elevation) {
  const drainageIssues = nearbyReports.filter((report) => ['Blocked Drain', 'Drain Overflow'].includes(report.problemType)).length;
  const elevationPoints = elevation < 30 ? 12 : elevation < 100 ? 6 : 0;
  const score = Math.min(100, Math.round(
    Math.min(rainfall, 80) * 0.9
    + Math.min(nearbyReports.length, 8) * 7
    + Math.min(drainageIssues, 2) * 5
    + elevationPoints
  ));
  return { score, level: score >= 65 ? 'High' : score >= 35 ? 'Medium' : 'Low' };
}

function authorizedForArea(user, report) {
  return user.role === 'admin' || report.area === user.area;
}

async function listReports(req, res) {
  let reports = store.read('reports');
  if (req.user.role !== 'admin') reports = reports.filter((report) => report.area === req.user.area);
  if (req.query.mine === 'true') reports = reports.filter((report) => report.userId === req.user.id);
  if (req.query.status) reports = reports.filter((report) => report.status === req.query.status);
  if (req.query.risk) reports = reports.filter((report) => report.riskLevel === req.query.risk);
  if (req.query.from) reports = reports.filter((report) => new Date(report.date) >= new Date(req.query.from));
  if (req.query.to) reports = reports.filter((report) => new Date(report.date) <= new Date(`${req.query.to}T23:59:59`));
  reports.sort((first, second) => new Date(second.date) - new Date(first.date));
  res.json({ success: true, count: reports.length, reports });
}

async function createReport(req, res) {
  if (req.user.role !== 'citizen') {
    return res.status(403).json({ success: false, message: 'Only citizen accounts can submit reports.' });
  }
  const { location, latitude, longitude, problemType, description, image } = req.body;
  if (latitude === undefined || latitude === null || latitude === '' || longitude === undefined || longitude === null || longitude === '') {
    return res.status(400).json({ success: false, message: 'Select an exact location before submitting.' });
  }
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!location || typeof location !== 'string' || location.trim().length > 160
    || !Number.isFinite(lat) || lat < -90 || lat > 90
    || !Number.isFinite(lon) || lon < -180 || lon > 180
    || !PROBLEM_TYPES.includes(problemType)
    || typeof description !== 'string' || description.trim().length < 5 || description.trim().length > 1000) {
    return res.status(400).json({ success: false, message: 'Check the location, coordinates, problem type, and description.' });
  }
  if (image && (typeof image !== 'string' || image.length > 3_000_000 || !image.startsWith('data:image/'))) {
    return res.status(400).json({ success: false, message: 'Photo must be an image smaller than 2 MB.' });
  }

  const areaLocation = store.read('locations').find((entry) => entry.name === req.user.area);
  if (!areaLocation || distanceKm(areaLocation, { latitude: lat, longitude: lon }) > 40) {
    return res.status(403).json({ success: false, message: 'Choose a report location within your registered area.' });
  }
  const rainfallData = areaLocation ? await getWeatherData(areaLocation.latitude, areaLocation.longitude) : { rainfall: 0 };
  const reports = store.read('reports');
  const nearbyReports = reports.filter((report) => report.area === req.user.area
    && report.status !== 'Rejected' && distanceKm(report, { latitude: lat, longitude: lon }) <= 1);
  const risk = reportRisk(Number(rainfallData.rainfall) || 0, nearbyReports, Number(rainfallData.elevation) || 0);
  const now = new Date();
  const report = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    userName: req.user.name,
    name: req.user.name,
    area: req.user.area,
    location: location.trim(),
    latitude: lat,
    longitude: lon,
    problemType,
    description: description.trim(),
    image: image || '',
    date: now.toISOString(),
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    rainfall: Number(rainfallData.rainfall) || 0,
    riskScore: risk.score,
    riskLevel: risk.level,
    severity: risk.level,
    status: 'Pending',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  reports.unshift(report);
  store.write('reports', reports);
  res.status(201).json({ success: true, message: 'Report submitted successfully.', report });
}

function getReport(req, res) {
  const report = store.read('reports').find((entry) => entry.id === req.params.id || entry._id === req.params.id);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
  if (!authorizedForArea(req.user, report)) return res.status(403).json({ success: false, message: 'This report belongs to another area.' });
  return res.json({ success: true, report });
}

function setStatus(req, res) {
  const reports = store.read('reports');
  const index = reports.findIndex((entry) => entry.id === req.params.id || entry._id === req.params.id);
  if (index < 0) return res.status(404).json({ success: false, message: 'Report not found.' });
  const current = reports[index];
  const status = String(req.body.status || current.status || 'Pending');
  if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Choose a valid report status.' });
  if (req.body.resolution !== undefined && (typeof req.body.resolution !== 'string' || req.body.resolution.trim().length > 1000)) {
    return res.status(400).json({ success: false, message: 'Resolution notes must be 1000 characters or fewer.' });
  }
  const now = new Date().toISOString();
  const statusHistory = current.statusHistory || [];
  if (status !== current.status) statusHistory.push({ status, at: now, updatedBy: req.user.id });
  reports[index] = {
    ...current,
    status,
    statusHistory,
    ...(req.body.resolution !== undefined ? { resolution: req.body.resolution.trim() } : {}),
    updatedAt: now
  };
  store.write('reports', reports);
  return res.json({ success: true, report: reports[index] });
}

function deleteReport(req, res) {
  const reports = store.read('reports');
  const report = reports.find((entry) => entry.id === req.params.id || entry._id === req.params.id);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
  if (req.user.role !== 'admin' && (report.userId !== req.user.id || report.status !== 'Pending')) {
    return res.status(403).json({ success: false, message: 'You can only delete your own pending reports.' });
  }
  store.write('reports', reports.filter((entry) => entry !== report));
  return res.json({ success: true, message: 'Report deleted.' });
}

module.exports = { listReports, createReport, getReport, setStatus, deleteReport, STATUSES };