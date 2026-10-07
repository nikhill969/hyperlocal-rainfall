const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const store = require('../services/jsonStore');
const { authenticate } = require('../middleware/auth');
const { hashPassword, verifyPassword, issueToken, publicUser } = require('../services/authService');

const router = express.Router();
const googleClient = new OAuth2Client();
const RESET_LIFETIME_MS = 30 * 60 * 1000;

function resolveArea(areaName, latitude, longitude) {
  const name = String(areaName || '').trim();
  if (latitude === undefined || latitude === null || latitude === '' || longitude === undefined || longitude === null || longitude === '') {
    return { error: 'Choose an area search result or use current location.' };
  }
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (name.length < 2 || name.length > 160 || !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { error: 'Search for an area or use current location, then select a result.' };
  }

  const locations = store.read('locations');
  let location = locations.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  if (!location) {
    location = { id: crypto.randomUUID(), name, latitude: lat, longitude: lon };
    locations.push(location);
    store.write('locations', locations);
  }
  return { area: location.name, areaLatitude: lat, areaLongitude: lon };
}

function createCitizen({ name, email, password, googleSub, area, areaLatitude, areaLongitude }) {
  const users = store.read('users');
  if (users.some((user) => user.email === email)) return { duplicate: true };
  const areaDetails = resolveArea(area, areaLatitude, areaLongitude);
  if (areaDetails.error) return { error: areaDetails.error };

  const cleanName = String(name || '').trim();
  if (cleanName.length < 2 || cleanName.length > 80) return { error: 'Enter a valid name.' };
  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email,
    ...areaDetails,
    role: 'citizen',
    ...(password ? { passwordHash: hashPassword(password) } : {}),
    ...(googleSub ? { googleSub } : {}),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  store.write('users', users);
  return { user };
}

async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw Object.assign(new Error('Google sign-in is not configured. Use email and password or contact the administrator.'), { status: 503 });
  if (!credential) throw Object.assign(new Error('Google did not return an authentication credential.'), { status: 400 });

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new Error('Google could not verify this account email.');
    }
    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.given_name || ''
    };
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error('Google sign-in could not be verified. Please try again.'), { status: 401 });
  }
}

router.get('/locations', (req, res) => {
  res.json({ locations: store.read('locations') });
});

router.post('/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid name and email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const created = createCitizen({
    name,
    email,
    password,
    area: req.body.area,
    areaLatitude: req.body.areaLatitude,
    areaLongitude: req.body.areaLongitude
  });
  if (created.duplicate) return res.status(409).json({ success: false, message: 'An account with this email already exists. Sign in with that account instead.' });
  if (created.error) return res.status(400).json({ success: false, message: created.error });
  return res.status(201).json({ success: true, message: 'Registration successful. Please login to continue.', user: publicUser(created.user) });
});

function passwordLogin(req, res, role) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = store.read('users').find((entry) => entry.email === email);
  if (!user) return res.status(404).json({ success: false, message: 'Account not found. Please register first.' });
  if (user.role !== role) {
    return res.status(403).json({ success: false, message: role === 'admin' ? 'Administrator account not found.' : 'This is an administrator account. Use administrator sign-in.' });
  }
  if (!user.passwordHash) return res.status(401).json({ success: false, message: 'This account uses Google sign-in. Continue with Google to log in.' });
  if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
  return res.json({ success: true, token: issueToken(user), user: publicUser(user) });
}

router.post('/login', (req, res) => passwordLogin(req, res, 'citizen'));
router.post('/admin-login', (req, res) => passwordLogin(req, res, 'admin'));

router.post('/google', async (req, res) => {
  let profile;
  try {
    profile = await verifyGoogleCredential(String(req.body.credential || ''));
  } catch (error) {
    return res.status(error.status || 401).json({ success: false, message: error.message });
  }

  const users = store.read('users');
  const existingGoogleUser = users.find((user) => user.googleSub === profile.sub);
  if (existingGoogleUser) {
    return res.json({ success: true, token: issueToken(existingGoogleUser), user: publicUser(existingGoogleUser) });
  }
  if (users.some((user) => user.email === profile.email)) {
    return res.status(409).json({ success: false, message: 'An account already uses this email. Sign in with its existing method to avoid creating a duplicate.' });
  }
  if (!req.body.area) {
    return res.json({ success: true, needsRegistration: true, googleProfile: { name: profile.name, email: profile.email } });
  }

  const created = createCitizen({
    name: req.body.name || profile.name,
    email: profile.email,
    googleSub: profile.sub,
    area: req.body.area,
    areaLatitude: req.body.areaLatitude,
    areaLongitude: req.body.areaLongitude
  });
  if (created.duplicate) return res.status(409).json({ success: false, message: 'An account with this email already exists. Sign in with its existing method.' });
  if (created.error) return res.status(400).json({ success: false, message: created.error });
  return res.status(201).json({ success: true, token: issueToken(created.user), user: publicUser(created.user) });
});

router.post('/forgot-password', async (req, res) => {
  const mailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
  if (process.env.NODE_ENV === 'production' && !mailConfigured) {
    return res.status(503).json({ success: false, message: 'Password recovery email is not configured. Contact the administrator.' });
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const users = store.read('users');
  const user = users.find((entry) => entry.email === email);
  const message = 'If an account exists for that email, password reset instructions are ready.';
  if (!user) return res.json({ success: true, message });

  const token = crypto.randomBytes(32).toString('base64url');
  user.passwordReset = {
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + RESET_LIFETIME_MS).toISOString()
  };
  store.write('users', users);

  if (mailConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Reset your Hyperlocal Rainfall password',
        text: `Use this link to reset your password within 30 minutes: ${resetUrl}`
      });
      return res.json({ success: true, message });
    } catch (error) {
      console.error('Password reset email failed:', error.message);
      return res.status(503).json({ success: false, message: 'Password reset email could not be sent. Please try again later.' });
    }
  }

  return res.json({
    success: true,
    message,
    ...(process.env.NODE_ENV === 'production' ? {} : { developmentResetToken: token })
  });
});

router.post('/reset-password', (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const users = store.read('users');
  const user = users.find((entry) => entry.passwordReset?.tokenHash === tokenHash);
  if (!user || new Date(user.passwordReset.expiresAt).getTime() <= Date.now()) {
    return res.status(400).json({ success: false, message: 'This password reset link is invalid or expired. Request a new link.' });
  }
  user.passwordHash = hashPassword(password);
  delete user.passwordReset;
  store.write('users', users);
  return res.json({ success: true, message: 'Password updated. Sign in with your new password.' });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;