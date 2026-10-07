const express = require('express');
const store = require('../services/jsonStore');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { publicUser } = require('../services/authService');

const router = express.Router();

router.get('/', authenticate, requireAdmin, (req, res) => {
  const users = store.read('users').map(publicUser);
  res.json({ users, totalCitizens: users.filter((user) => user.role === 'citizen').length });
});

module.exports = router;