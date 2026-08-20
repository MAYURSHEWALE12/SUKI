// Fail-fast environment assertions. Called from server.js before the app
// boots so a misconfigured deploy never serves traffic with a forgeable
// JWT secret or an obvious default value. Deliberately lives outside
// app.js: the test suite calls createApp() directly with a throwaway
// 'test-secret' and must not trip these checks.
const KNOWN_DEFAULTS = [
  'change_me_in_production',
  'supersecretkey_change_me_in_production',
  'changeme',
  'secret',
];

function assertSafeEnv() {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret) {
    throw new Error('JWT_SECRET is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  }

  const trimmed = secret.trim().toLowerCase();
  if (KNOWN_DEFAULTS.includes(trimmed) || trimmed.includes('change_me')) {
    throw new Error('JWT_SECRET is still a known default value. Set a unique random secret before starting the server.');
  }

  if (isProduction && secret.length < 32) {
    throw new Error(`JWT_SECRET must be at least 32 characters in production (got ${secret.length}).`);
  }
}

module.exports = { assertSafeEnv, KNOWN_DEFAULTS };