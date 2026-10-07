const store = require('../services/jsonStore');
const { verifyToken, publicUser } = require('../services/authService');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : '';
  const userId = verifyToken(token);
  const user = userId && store.read('users').find((entry) => entry.id === userId);

  if (!user) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  req.user = publicUser(user);
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Administrator access is required.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };