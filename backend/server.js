require('dotenv').config();
const express = require('express');
const cors = require('cors');
const store = require('./services/jsonStore');
require('./services/authService');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const areasRouter = require('./routes/areas');
const reportsRouter = require('./routes/reports');
const weatherRouter = require('./routes/weather');
const riskRouter = require('./routes/risk');
const hotspotsRouter = require('./routes/hotspots');
const analyticsRouter = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    title: 'Hyperlocal Rainfall-Induced Waterlogging & Environmental Risk Mapping System',
    mode: 'JSON file storage',
    description: 'Localized Environmental Risk Assessment prototype.'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    storage: 'JSON files',
    users: store.read('users').length,
    reports: store.read('reports').length
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/areas', areasRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/risk', riskRouter);
app.use('/api/hotspots', hotspotsRouter);
app.use('/api/analytics', analyticsRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `API endpoint '${req.originalUrl}' not found.` });
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({ success: false, message: 'Internal server error occurred.', error: error.message });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log('Persistent storage: backend/data/*.json');
});
