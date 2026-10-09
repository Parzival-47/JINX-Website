import http from 'node:http';
import { createReadStream, existsSync, realpathSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

const directory = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = realpathSync(path.join(directory, 'public'));
if (process.env.NODE_ENV !== 'production' && existsSync(path.join(directory, '.env'))) {
  process.loadEnvFile(path.join(directory, '.env'));
}

export const reasons = Object.freeze({
  booking: 'Booking / performance',
  collaboration: 'Collaboration',
  press: 'Press / media',
  objects: 'J!NX Objects inquiry',
  general: 'General inquiry'
});

const clean = value => typeof value === 'string' ? value.trim() : '';
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const hasControls = value => /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
const escape = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

export function validateInquiry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: { form: 'Please complete the inquiry form.' } };
  }
  const data = {
    name: clean(input.name), email: clean(input.email), reason: clean(input.reason),
    explanation: clean(input.explanation), interest: clean(input.interest), website: clean(input.website)
  };
  const errors = {};
  if (data.name.length < 2 || data.name.length > 100 || /[\r\n]/.test(data.name) || hasControls(data.name)) {
    errors.name = 'Enter your name using 2–100 characters.';
  }
  if (data.email.length > 254 || !emailPattern.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!Object.hasOwn(reasons, data.reason)) errors.reason = 'Choose your reason for contacting J!NX.';
  // The server enforces the explanation even when browser checks are bypassed.
  if (data.explanation.replace(/\s+/g, ' ').length < 20 || data.explanation.length > 3000 || hasControls(data.explanation)) {
    errors.explanation = 'Explain your reason for contacting J!NX in 20–3,000 characters.';
  }
  if (data.interest.length > 100 || /[\r\n]/.test(data.interest) || hasControls(data.interest)) {
    errors.interest = 'Please keep your object interest under 100 characters.';
  }
  if (data.website) errors.form = 'We could not accept this inquiry.';
  return { data, errors };
}

export function makeEmail(data, config) {
  const label = reasons[data.reason];
  const rows = [['Name', data.name], ['Email', data.email], ['Reason', label]];
  if (data.interest) rows.push(['Object interest', data.interest]);
  return {
    sender: { name: 'J!NX Website', email: config.senderEmail },
    to: [{ email: config.contactEmail, name: 'J!NX' }],
    replyTo: { email: data.email, name: data.name },
    subject: `J!NX inquiry — ${label}`,
    textContent: `${rows.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nExplanation:\n${data.explanation}`,
    htmlContent: `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#fafafa;color:#141414;padding:24px"><h1 style="font-size:24px">J!NX — new inquiry</h1>${rows.map(([key, value]) => `<p><strong>${key}:</strong> ${escape(value)}</p>`).join('')}<h2 style="font-size:16px">Reason explained</h2><p style="white-space:pre-wrap">${escape(data.explanation)}</p><p style="color:#777;font-size:12px">Reply to this email to respond to the sender.</p></body></html>`,
    tags: ['jinx-website-inquiry']
  };
}

function respond(res, status, data, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  const parts = [];
  let bytes = 0;
  for await (const part of req) {
    bytes += part.length;
    if (bytes > 16_384) throw Object.assign(new Error('Request too large'), { status: 413 });
    parts.push(part);
  }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

export function createApp(options = {}) {
  const config = {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'vandalenzan102@gmail.com',
    contactEmail: process.env.CONTACT_EMAIL || 'vandalenzan102@gmail.com',
    appOrigin: process.env.APP_ORIGIN || 'https://zanepierre.onrender.com',
    ...options.config
  };
  const emailFetch = options.emailFetch || fetch;
  const attempts = new Map();

  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://open.spotify.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { return respond(res, 400, { ok: false, message: 'Invalid request.' }); }

    if (pathname === '/api/health' && req.method === 'GET') return respond(res, 200, { ok: true });

    if (pathname === '/api/contact') {
      if (req.method !== 'POST') return respond(res, 405, { ok: false, message: 'Use the inquiry form to send a message.' }, { Allow: 'POST' });
      const origin = req.headers.origin;
      const allowed = new Set([config.appOrigin, `http://${req.headers.host}`, `https://${req.headers.host}`]);
      if ((origin && !allowed.has(origin)) || req.headers['sec-fetch-site'] === 'cross-site') {
        return respond(res, 403, { ok: false, message: 'Please submit the inquiry from the J!NX website.' });
      }
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
        return respond(res, 415, { ok: false, message: 'Please use the inquiry form.' });
      }
      const now = Date.now();
      for (const [key, value] of attempts) if (now - value.start >= 900_000) attempts.delete(key);
      const forwarded = String(req.headers['x-forwarded-for'] || '').split(',').map(value => value.trim()).filter(Boolean);
      const client = process.env.NODE_ENV === 'production' && forwarded.length ? forwarded.at(-1) : req.socket.remoteAddress;
      const record = attempts.get(client) || { start: now, count: 0 };
      if (record.count >= 5 || attempts.size > 5000) {
        return respond(res, 429, { ok: false, message: 'Please wait a little before sending another inquiry.' }, { 'Retry-After': '900' });
      }
      record.count += 1;
      attempts.set(client, record);
      let input;
      try { input = await readJson(req); }
      catch (error) { return respond(res, error.status || 400, { ok: false, message: 'Please check your inquiry and try again.' }); }
      const { data, errors } = validateInquiry(input);
      if (Object.keys(errors).length) return respond(res, 422, { ok: false, message: 'Please complete the required details.', errors });
      if (!config.apiKey || !emailPattern.test(config.senderEmail) || !emailPattern.test(config.contactEmail)) {
        return respond(res, 503, { ok: false, message: `Your inquiry could not be sent. Please email ${config.contactEmail} directly.` });
      }
      const reference = randomUUID();
      try {
        const response = await emailFetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': config.apiKey, 'Idempotency-Key': reference },
          body: JSON.stringify(makeEmail(data, config)),
          signal: AbortSignal.timeout(15_000)
        });
        if (!response.ok) throw new Error(`Email provider returned status ${response.status}`);
        const result = await response.json();
        if (!result.messageId && !result.messageIds?.length) throw new Error('Email provider did not accept the message');
        return respond(res, 201, { ok: true, message: 'Your inquiry has been submitted. J!NX will reply by email.' });
      } catch (error) {
        console.error(`[J!NX contact ${reference}] ${error.message}`);
        return respond(res, 502, { ok: false, message: `Your inquiry could not be sent. Please try again or email ${config.contactEmail} directly.` });
      }
    }

    if (!['GET', 'HEAD'].includes(req.method)) return respond(res, 405, { ok: false }, { Allow: 'GET, HEAD' });
    if (pathname === '/home.html') { res.writeHead(302, { Location: '/index.html#world' }); return res.end(); }
    if (pathname === '/') pathname = '/index.html';
    if (['/music', '/visuals', '/about', '/shop', '/contact', '/privacy'].includes(pathname)) {
      res.writeHead(302, { Location: `${pathname}.html` }); return res.end();
    }
    const candidate = path.resolve(publicRoot, `.${pathname}`);
    if (!candidate.startsWith(`${publicRoot}${path.sep}`) || pathname.split('/').some(part => part.startsWith('.')) || pathname.includes('\0')) {
      return respond(res, 404, { ok: false, message: 'Page not found.' });
    }
    try {
      const info = await stat(candidate);
      const real = realpathSync(candidate);
      if (!info.isFile() || !real.startsWith(`${publicRoot}${path.sep}`)) throw new Error('Not a public file');
      res.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(candidate)] || 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': path.extname(candidate) === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      if (req.method === 'HEAD') return res.end();
      createReadStream(candidate).on('error', () => res.destroy()).pipe(res);
    } catch {
      try {
        const errorPage = path.join(publicRoot, '404.html');
        const info = await stat(errorPage);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': info.size });
        if (req.method === 'HEAD') return res.end();
        createReadStream(errorPage).pipe(res);
      } catch { respond(res, 404, { ok: false, message: 'Page not found.' }); }
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3000;
  const app = createApp();
  app.listen(port, '0.0.0.0', () => {
    console.log(`J!NX website: http://localhost:${port}`);
    if (!process.env.BREVO_API_KEY) console.log('Email delivery needs BREVO_API_KEY and a verified sender. The site is ready for preview.');
  });
}
