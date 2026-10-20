const assert = require('assert');

// Simulate the logic of start route with credentials
function buildGoogleAuthRedirect({ clientId, clientSecret, appUrl, nextUrl }) {
  const { sanitizeNext } = require('./test-oauth-sanitizer');
  const safeNext = sanitizeNext(nextUrl);
  const state = 'mock-random-uuid';
  const redirectUri = `${appUrl || 'http://localhost:3000'}/api/auth/oauth/google/callback`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(state)}`;

  const cookiePayload = JSON.stringify({ state, next: safeNext });
  return { googleAuthUrl, cookiePayload, safeNext };
}

console.log('Testing Google OAuth URL and State creation...');
const res = buildGoogleAuthRedirect({
  clientId: 'mock-client-id',
  clientSecret: 'mock-client-secret',
  appUrl: 'https://nfcentry76.vercel.app',
  nextUrl: '/confirm?next=/dashboard'
});

assert(res.googleAuthUrl.includes('client_id=mock-client-id'), 'Must include client_id');
assert(res.googleAuthUrl.includes('redirect_uri=https%3A%2F%2Fnfcentry76.vercel.app%2Fapi%2Fauth%2Foauth%2Fgoogle%2Fcallback'), 'Must encode callback URI');
assert(res.googleAuthUrl.includes('state=mock-random-uuid'), 'Must pass only state to Google, not next URL');
assert(!res.googleAuthUrl.includes('/confirm'), 'Must not pass next URL directly in Google state');

const cookieData = JSON.parse(res.cookiePayload);
assert.strictEqual(cookieData.state, 'mock-random-uuid');
assert.strictEqual(cookieData.next, '/confirm?next=/dashboard');

console.log('✅ Google OAuth start flow verified successfully!');
