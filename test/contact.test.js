import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, validateInquiry } from '../server.js';

const valid = { name: 'Website visitor', email: 'visitor@example.com', reason: 'booking', explanation: 'I would like to discuss a performance booking.', website: '' };
const config = { apiKey: 'test-key-not-a-real-credential', senderEmail: 'sender@example.com', contactEmail: 'vandalenzan102@gmail.com' };

async function withApp(options, action) {
  const app = createApp(options);
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.address().port}`;
  try { await action(base); }
  finally { await new Promise(resolve => app.close(resolve)); }
}
function submit(base, data, headers = {}) {
  return fetch(`${base}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, ...headers }, body: JSON.stringify(data) });
}

test('blank, whitespace-only and missing explanations are rejected on the server', async () => {
  let calls = 0;
  await withApp({ config, emailFetch: async () => { calls++; } }, async base => {
    for (const explanation of ['', '    \n\t', undefined, 'Too short']) {
      const response = await submit(base, { ...valid, explanation });
      assert.equal(response.status, 422);
      assert.ok((await response.json()).errors.explanation);
    }
  });
  assert.equal(calls, 0);
});

test('accepted inquiries go only to the artist with visitor reply-to and escaped content', async () => {
  let message;
  await withApp({ config, emailFetch: async (url, request) => {
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    message = JSON.parse(request.body);
    return new Response(JSON.stringify({ messageId: 'test-accepted' }), { status: 201 });
  } }, async base => {
    const response = await submit(base, { ...valid, explanation: 'Please discuss this <script>alert(1)</script> proposal.', to: 'other@example.com' });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).ok, true);
  });
  assert.deepEqual(message.to, [{ email: 'vandalenzan102@gmail.com', name: 'J!NX' }]);
  assert.equal(message.replyTo.email, valid.email);
  assert.ok(message.htmlContent.includes('&lt;script&gt;'));
  assert.ok(!message.htmlContent.includes('<script>'));
});

test('an email provider failure never produces a success response', async () => {
  await withApp({ config, emailFetch: async () => new Response('{}', { status: 401 }) }, async base => {
    const response = await submit(base, valid);
    assert.equal(response.status, 502);
    assert.equal((await response.json()).ok, false);
  });
});

test('an unconfigured email service does not claim delivery', async () => {
  await withApp({ config: { ...config, apiKey: '' } }, async base => {
    const response = await submit(base, valid);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  });
});

test('reason, email, object interest and honeypot are independently validated', () => {
  for (const changes of [{ reason: '' }, { reason: 'toString' }, { email: 'not-an-email' }, { website: 'spam' }, { interest: 'a'.repeat(101) }, { name: ['unexpected'] }]) {
    assert.ok(Object.keys(validateInquiry({ ...valid, ...changes }).errors).length);
  }
});

test('cross-site requests are blocked before email delivery', async () => {
  let calls = 0;
  await withApp({ config, emailFetch: async () => { calls++; } }, async base => {
    const response = await submit(base, valid, { Origin: 'https://unrelated.example' });
    assert.equal(response.status, 403);
  });
  assert.equal(calls, 0);
});

test('server files are inaccessible and rate limits protect the email endpoint', async () => {
  await withApp({ config, emailFetch: async () => new Response('{"messageId":"test"}', { status: 201 }) }, async base => {
    assert.equal((await fetch(`${base}/server.js`)).status, 404);
    assert.equal((await fetch(`${base}/.env`)).status, 404);
    for (let i = 0; i < 5; i++) assert.equal((await submit(base, valid)).status, 201);
    assert.equal((await submit(base, valid)).status, 429);
  });
});
