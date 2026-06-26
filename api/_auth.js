const crypto = require('crypto');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'dewydazeadmin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Magic@20262005';
const AUTH_SECRET = process.env.AUTH_SECRET || 'change-this-to-a-long-random-secret';
const COOKIE_NAME = 'dewydaze_admin_auth';
const COOKIE_MAX_AGE = 60 * 60; // seconds

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value) {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function sign(payload) {
  const payloadJson = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadJson)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${toBase64Url(payloadJson)}.${signature}`;
}

function verify(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadEncoded, signature] = parts;
  let payloadJson;
  try {
    payloadJson = fromBase64Url(payloadEncoded);
  } catch (err) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadJson)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch (err) {
    return null;
  }

  if (!payload.exp || Date.now() > payload.exp) {
    return null;
  }

  return payload;
}

function parseCookies(req) {
  const cookieHeader = req.headers?.cookie || '';
  return cookieHeader.split(';').reduce((acc, pair) => {
    const [key, ...rest] = pair.split('=');
    if (!key || rest.length === 0) return acc;
    acc[key.trim()] = decodeURIComponent(rest.join('=').trim());
    return acc;
  }, {});
}

function getAuthToken(req) {
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME];
}

function createAuthCookie(token) {
  const secure = process.env.NODE_ENV === 'production';
  const secureFlag = secure ? 'Secure; ' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}; ${secureFlag}`;
}

function clearAuthCookie() {
  return `${COOKIE_NAME}=deleted; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;`;
}

function isValidCredentials(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

function getAuthenticatedUser(req) {
  const token = getAuthToken(req);
  return token ? verify(token) : null;
}

module.exports = {
  isValidCredentials,
  sign,
  getAuthenticatedUser,
  createAuthCookie,
  clearAuthCookie,
};
