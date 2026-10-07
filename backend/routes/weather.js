const express = require('express');
const router = express.Router();
const store = require('../services/jsonStore');
const { getWeatherData } = require('../services/weatherService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

function distanceKm(first, second) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDistance = radians(second.latitude - first.latitude);
  const longitudeDistance = radians(second.longitude - first.longitude);
  const value = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(longitudeDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

router.get('/', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required.' });
    }
    const area = store.read('locations').find((location) => location.name === req.user.area);
    if (req.user.role !== 'admin' && (!area || distanceKm(area, { latitude: lat, longitude: lon }) > 40)) {
      return res.status(403).json({ success: false, message: 'Citizens can only view weather for their registered area.' });
    }

    const result = await getWeatherData(lat, lon);
    return res.json({
      success: true,
      demoMode: result.isDemo,
      message: result.message || '',
      weather: {
        latitude: result.latitude,
        longitude: result.longitude,
        rainfall: result.rainfall,
        temperature: result.temperature,
        condition: result.weatherCondition,
        humidity: result.humidity,
        elevation: result.elevation,
        source: result.isDemo ? 'Demo fallback' : 'Open-Meteo'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch weather data.', error: error.message });
  }
});

module.exports = router;
