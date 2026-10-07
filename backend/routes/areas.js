const express = require('express');
const store = require('../services/jsonStore');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getWeatherData } = require('../services/weatherService');

const router = express.Router();

router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const reports = store.read('reports');
    const areas = await Promise.all(store.read('locations').map(async (location) => {
      const [weather, areaReports] = await Promise.all([
        getWeatherData(location.latitude, location.longitude),
        Promise.resolve(reports.filter((report) => report.area === location.name && report.status !== 'Rejected'))
      ]);
      const drainageReports = areaReports.filter((report) => ['Blocked Drain', 'Drain Overflow'].includes(report.problemType)).length;
      const score = Math.min(100, Math.round(
        Math.min(weather.rainfall || 0, 80) * 0.9
        + Math.min(areaReports.length, 8) * 7
        + Math.min(drainageReports, 2) * 5
        + (weather.elevation < 30 ? 12 : weather.elevation < 100 ? 6 : 0)
      ));
      return {
        ...location,
        rainfall: Number(weather.rainfall) || 0,
        riskScore: score,
        riskLevel: score >= 65 ? 'High' : score >= 35 ? 'Medium' : 'Low',
        reports: areaReports.length,
        source: weather.isDemo ? 'Demo fallback' : 'Open-Meteo'
      };
    }));
    res.json({ areas });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load locality summaries.' });
  }
});

module.exports = router;