// GET /api/search?q=... -> contacts matching a name, email or phone.

import { handler } from '../lib/http.js';
import { searchContacts } from '../lib/ghl.js';

export default handler(['GET'], async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.status(200).json({ contacts: [] });
  const contacts = await searchContacts(q);
  res.status(200).json({
    contacts: contacts.map((c) => ({
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.contactName || c.companyName || '(no name)',
      email: c.email || '',
      phone: c.phone || '',
      company: c.companyName || '',
    })),
  });
});
