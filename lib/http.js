// Shared request handling for the API routes: access check and error responses.

import { timingSafeEqual } from 'node:crypto';

function authorised(req) {
  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) return true;
  const given = Buffer.from(String(req.headers['x-access-key'] || ''));
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want);
}

export function handler(methods, fn) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!methods.includes(req.method)) {
      return res.status(405).json({ error: `Use ${methods.join(' or ')}.` });
    }
    if (!authorised(req)) return res.status(401).json({ error: 'Wrong or missing password.' });
    try {
      await fn(req, res);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
    }
  };
}
