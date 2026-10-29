// Shared request handling for the API routes: method check and error responses.

export function handler(methods, fn) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!methods.includes(req.method)) {
      return res.status(405).json({ error: `Use ${methods.join(' or ')}.` });
    }
    try {
      await fn(req, res);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
    }
  };
}
