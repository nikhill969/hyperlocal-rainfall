const express = require('express');
const router = express.Router();
const store = require('../services/jsonStore');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  try {
    const reports = store.read('reports').filter((report) => report.status !== 'Rejected'
      && (req.user.role === 'admin' || report.area === req.user.area));
    const clusters = [];
    reports.forEach((report) => {
      let cluster = clusters.find((entry) => entry.area === report.area
        && Math.hypot((entry.latitude - report.latitude) * 111, (entry.longitude - report.longitude) * 85) <= 0.8);
      if (!cluster) {
        cluster = { id: report.id, name: report.location, area: report.area, latitude: report.latitude, longitude: report.longitude, reports: 0, high: 0 };
        clusters.push(cluster);
      }
      cluster.reports += 1;
      if (report.severity === 'High' || report.riskLevel === 'High') cluster.high += 1;
    });
    const hotspots = clusters.filter((entry) => entry.reports >= 2).map((entry) => ({
      ...entry,
      risk: entry.high > 1 ? 'High' : 'Moderate'
    })).sort((first, second) => second.reports - first.reports);
    res.json({
      success: true,
      count: hotspots.length,
      hotspots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to detect hotspots.', error: error.message });
  }
});

module.exports = router;
