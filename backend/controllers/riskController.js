const store = require('../services/jsonStore');
const { getWeatherData } = require('../services/weatherService');
const { authenticate } = require('../middleware/auth');

const distanceKm = (first, second) => {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latDelta = radians(second.latitude - first.latitude);
  const lonDelta = radians(second.longitude - first.longitude);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getRisk = [authenticate, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required.' });
    }
    const area = store.read('locations').find((location) => location.name === req.user.area);
    if (req.user.role !== 'admin' && (!area || distanceKm(area, { latitude: lat, longitude: lon }) > 40)) {
      return res.status(403).json({ success: false, message: 'Citizens can only assess their registered area.' });
    }
    const weather = await getWeatherData(lat, lon);
    const reports = store.read('reports').filter((report) => report.area === req.user.area && report.status !== 'Rejected');
    const nearbyReports = reports.filter((report) => distanceKm(report, { latitude: lat, longitude: lon }) <= 2);
    const citizenReports = nearbyReports.length;
    const drainageReports = nearbyReports.filter((report) => ['Blocked Drain', 'Drain Overflow'].includes(report.problemType)).length;
    const elevation = weather.elevation || 0;
    const score = Math.min(100, Math.round(
      Math.min(weather.rainfall || 0, 80) * 0.9
      + Math.min(citizenReports, 8) * 7
      + Math.min(drainageReports, 2) * 5
      + (elevation < 30 ? 12 : elevation < 100 ? 6 : 0)
    ));
    const level = score >= 65 ? 'HIGH' : score >= 35 ? 'MODERATE' : 'LOW';
    const risk = { score, level, note: 'Prototype rule-based calculation.' };

    res.json({
      success: true,
      demoMode: weather.isDemo,
      message: weather.message || '',
      weather: { rainfall: weather.rainfall, temperature: weather.temperature, condition: weather.weatherCondition },
      rainfall: weather.rainfall,
      location: { elevation, terrain: elevation < 30 ? 'Low-lying' : 'Moderate' },
      citizenReports,
      risk
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to calculate risk.',
      error: error.message
    });
  }
}];

module.exports = {
  getRisk,
  getRiskForLocation: getRisk
};

