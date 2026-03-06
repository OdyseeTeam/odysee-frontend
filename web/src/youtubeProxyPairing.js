const crypto = require('crypto');

const PAIR_TTL_MS = 10 * 60 * 1000;
const MAX_DETECTED_ADDRESSES = 8;
const pairSessions = new Map();
const pairIdByCode = new Map();

function now() {
  return Date.now();
}

function randomId(size = 12) {
  return crypto.randomBytes(size).toString('hex');
}

function randomCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function cleanupExpiredSessions() {
  const timestamp = now();

  pairSessions.forEach((session, pairId) => {
    if (session.expiresAt <= timestamp) {
      pairSessions.delete(pairId);
      pairIdByCode.delete(session.code);
    }
  });
}

function createPairSession() {
  cleanupExpiredSessions();

  let pairId = randomId();
  while (pairSessions.has(pairId)) {
    pairId = randomId();
  }

  let code = randomCode();
  while (pairIdByCode.has(code)) {
    code = randomCode();
  }

  const createdAt = now();
  const session = {
    pairId,
    code,
    createdAt,
    expiresAt: createdAt + PAIR_TTL_MS,
    status: 'pending',
    endpoint: null,
    secureEndpoint: null,
    bindAddress: null,
    detectedAddresses: [],
    metadata: null,
    pairedAt: null,
  };

  pairSessions.set(pairId, session);
  pairIdByCode.set(code, pairId);

  return serializePairSession(session);
}

function getPairSession(pairId) {
  cleanupExpiredSessions();
  const session = pairSessions.get(String(pairId || '').trim());
  return session ? serializePairSession(session) : null;
}

function registerPairSession({ code, endpoint, secureEndpoint, bindAddress, detectedAddresses, metadata }) {
  cleanupExpiredSessions();

  const normalizedCode = String(code || '').trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    const error = new Error('Pair code must be a 6-digit string.');
    error.status = 400;
    throw error;
  }

  const pairId = pairIdByCode.get(normalizedCode);
  if (!pairId) {
    const error = new Error('Pair code was not found or has expired.');
    error.status = 404;
    throw error;
  }

  const session = pairSessions.get(pairId);
  if (!session) {
    pairIdByCode.delete(normalizedCode);
    const error = new Error('Pair session was not found or has expired.');
    error.status = 404;
    throw error;
  }

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  if (!normalizedEndpoint) {
    const error = new Error('A valid proxy endpoint is required.');
    error.status = 400;
    throw error;
  }

  const normalizedSecureEndpoint = normalizeEndpoint(secureEndpoint, ['https:']);
  const normalizedBindAddress = normalizeString(bindAddress, 120);
  const normalizedDetectedAddresses = Array.isArray(detectedAddresses)
    ? detectedAddresses
        .map((address) => normalizeString(address, 120))
        .filter(Boolean)
        .slice(0, MAX_DETECTED_ADDRESSES)
    : [];

  session.status = 'ready';
  session.endpoint = normalizedEndpoint;
  session.secureEndpoint = normalizedSecureEndpoint;
  session.bindAddress = normalizedBindAddress;
  session.detectedAddresses = normalizedDetectedAddresses;
  session.metadata = metadata && typeof metadata === 'object' ? metadata : null;
  session.pairedAt = now();

  return serializePairSession(session);
}

function serializePairSession(session) {
  return {
    pairId: session.pairId,
    code: session.code,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    status: session.status,
    endpoint: session.endpoint,
    secureEndpoint: session.secureEndpoint,
    bindAddress: session.bindAddress,
    detectedAddresses: session.detectedAddresses,
    metadata: session.metadata,
    pairedAt: session.pairedAt,
  };
}

function normalizeString(value, maxLength = 512) {
  const normalized = String(value || '').trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeEndpoint(rawEndpoint, allowedProtocols = ['http:', 'https:']) {
  const normalized = normalizeString(rawEndpoint);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }

    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

module.exports = {
  createPairSession,
  getPairSession,
  registerPairSession,
};
