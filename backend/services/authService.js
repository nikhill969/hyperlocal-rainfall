const crypto = require('crypto');
const store = require('./jsonStore');

const TOKEN_SECRET = process.env.AUTH_SECRET || 'local-development-secret-change-before-deployment';
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 12;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, expectedHex] = String(storedHash).split(':');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function publicUser(user) {
  const { passwordHash, googleSub, passwordReset, ...safeUser } = user;
  return safeUser;
}

function issueToken(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.exp > Math.floor(Date.now() / 1000) ? decoded.sub : null;
  } catch {
    return null;
  }
}

function ensureAdmin() {
  if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_PASSWORD || !process.env.AUTH_SECRET)) {
    throw new Error('Set ADMIN_PASSWORD and AUTH_SECRET before running in production.');
  }
  const email = (process.env.ADMIN_EMAIL || 'admin@hyperlocal.local').trim().toLowerCase();
  const users = store.read('users');
  if (!users.some((user) => user.role === 'admin')) {
    users.push({
      id: crypto.randomUUID(),
      name: 'System Administrator',
      email,
      area: 'All areas',
      role: 'admin',
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'RainfallAdmin!2026'),
      createdAt: new Date().toISOString()
    });
    store.write('users', users);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Demo admin login: ${email} / ${process.env.ADMIN_PASSWORD || 'RainfallAdmin!2026'}`);
    }
  }
}

ensureAdmin();

module.exports = { hashPassword, verifyPassword, publicUser, issueToken, verifyToken };