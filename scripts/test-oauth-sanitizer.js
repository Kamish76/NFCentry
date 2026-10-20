const assert = require('assert');

// Test the exact sanitizer logic used in src/lib/auth/oauth.ts
function sanitizeNext(next) {
  if (!next) return '/dashboard';
  if (next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/dashboard';
}

module.exports = { sanitizeNext };

if (require.main === module) {
  console.log('Running OAuth next sanitizer self-check...');
  // Required test cases
  assert.strictEqual(sanitizeNext('//evil.com'), '/dashboard', '//evil.com must sanitize to /dashboard');
  assert.strictEqual(sanitizeNext('https://evil.com'), '/dashboard', 'https://evil.com must sanitize to /dashboard');

  // Additional security boundary test cases
  assert.strictEqual(sanitizeNext('http://evil.com'), '/dashboard');
  assert.strictEqual(sanitizeNext('//evil.com/path'), '/dashboard');
  assert.strictEqual(sanitizeNext('///evil.com'), '/dashboard');
  assert.strictEqual(sanitizeNext('javascript:alert(1)'), '/dashboard');
  assert.strictEqual(sanitizeNext(null), '/dashboard');
  assert.strictEqual(sanitizeNext(undefined), '/dashboard');
  assert.strictEqual(sanitizeNext(''), '/dashboard');

  // Valid relative paths
  assert.strictEqual(sanitizeNext('/dashboard'), '/dashboard');
  assert.strictEqual(sanitizeNext('/confirm?next=/dashboard'), '/confirm?next=/dashboard');
  assert.strictEqual(sanitizeNext('/events/123'), '/events/123');

  console.log('✅ All OAuth sanitizer self-checks passed successfully!');
}
