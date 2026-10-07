const express = require('express');
const router = express.Router();
const store = require('../services/jsonStore');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  try {
    const reports = store.read('reports').filter((report) => req.user.role === 'admin' || report.area === req.user.area);
    const totalReports = reports.length;
    const verifiedReports = reports.filter((report) => report.status === 'Verified').length;
    const pendingReports = reports.filter((report) => report.status === 'Pending').length;
    const rejectedReports = reports.filter((report) => report.status === 'Rejected').length;
    const resolvedReports = reports.filter((report) => report.status === 'Resolved').length;
    const highSeverityReports = reports.filter((report) => report.severity === 'High').length;
    const areas = {};
    reports.forEach((report) => { areas[report.area] = (areas[report.area] || 0) + 1; });

    const severityCounts = {
      Low: reports.filter((report) => report.severity === 'Low').length,
      Medium: reports.filter((report) => report.severity === 'Medium').length,
      High: reports.filter((report) => report.severity === 'High').length
    };

    const problemCounts = {};
    reports.forEach((report) => {
      problemCounts[report.problemType] = (problemCounts[report.problemType] || 0) + 1;
    });

    const riskDistribution = { LOW: 0, MODERATE: 0, HIGH: 0 };

    reports.forEach((report) => {
      const level = String(report.riskLevel || report.severity || 'Low').toUpperCase();
      if (level === 'HIGH') riskDistribution.HIGH += 1;
      else if (level === 'MEDIUM' || level === 'MODERATE') riskDistribution.MODERATE += 1;
      else riskDistribution.LOW += 1;
    });

    res.json({
      success: true,
      analytics: {
        totalReports,
        verifiedReports,
        pendingReports,
        rejectedReports,
        resolvedReports,
        highSeverityReports,
        totalUsers: req.user.role === 'admin' ? store.read('users').length : undefined,
        numberOfHotspots: 0,
        averageRainfall: totalReports ? Math.round(reports.reduce((sum, report) => sum + (Number(report.rainfall) || 0), 0) / totalReports * 10) / 10 : 0,
        areaReports: areas,
        severityCounts,
        problemCounts,
        riskDistribution,
        reportsOverTime: reports.map((report) => ({
          date: report.date,
          count: 1
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch analytics.', error: error.message });
  }
});

module.exports = router;
