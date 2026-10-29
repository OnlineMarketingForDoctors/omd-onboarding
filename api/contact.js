// GET  /api/contact?id=...  -> the form fields with the contact's current values.
// POST /api/contact?id=...  -> validate, update the contact in GHL, start the workflow.

import { handler } from '../lib/http.js';
import { getContact, updateContact, addToWorkflow, env, GhlError } from '../lib/ghl.js';
import { resolveFields, readValues, buildUpdate } from '../lib/fields.js';

export default handler(['GET', 'POST'], async (req, res) => {
  const id = String(req.query.id || '');
  if (!id) throw new GhlError(400, 'Missing contact id.');

  const [fields, contact] = await Promise.all([resolveFields(), getContact(id)]);
  if (contact.locationId && contact.locationId !== env('GHL_LOCATION_ID')) {
    throw new GhlError(404, 'Contact not found in this location.');
  }
  const current = readValues(fields, contact);

  if (req.method === 'GET') {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    return res.status(200).json({
      contact: { id: contact.id, name: name || contact.email || '(no name)', email: contact.email || '' },
      fields,
      values: current,
    });
  }

  const workflowId = env('GHL_WORKFLOW_ID');
  const { errors, payload } = buildUpdate(fields, current, req.body?.values || {});
  if (Object.keys(errors).length) {
    return res.status(422).json({ error: 'Some fields need attention.', errors });
  }

  const { customFields = [], ...standard } = payload;
  const changed = Object.keys(standard).length + customFields.length;
  if (changed) await updateContact(id, payload);
  await addToWorkflow(id, workflowId);
  res.status(200).json({ ok: true, changed });
});
