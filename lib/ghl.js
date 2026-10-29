// Minimal client for the GHL (LeadConnector) API v2.

const BASE = process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com';

export class GhlError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function env(name) {
  const value = process.env[name];
  if (!value) throw new GhlError(500, `${name} is not set on the server.`);
  return value;
}

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${env('GHL_TOKEN')}`,
      Version: '2021-07-28',
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON error page */ }
  if (!res.ok) {
    const detail = data?.message || text || res.statusText;
    throw new GhlError(res.status === 404 ? 404 : 502,
      `GHL ${method} ${path.split('?')[0]} failed (${res.status}): ${Array.isArray(detail) ? detail.join('; ') : detail}`);
  }
  return data;
}

export async function searchContacts(query) {
  const data = await request('POST', '/contacts/search', {
    locationId: env('GHL_LOCATION_ID'),
    pageLimit: 20,
    query,
  });
  return data?.contacts || [];
}

export async function getContact(id) {
  const data = await request('GET', `/contacts/${encodeURIComponent(id)}`);
  return data.contact;
}

export async function updateContact(id, payload) {
  const data = await request('PUT', `/contacts/${encodeURIComponent(id)}`, payload);
  return data.contact;
}

// Custom field definitions change rarely; cache them for the life of the instance.
let customFieldsCache = null;
let customFieldsAt = 0;

export async function getCustomFields() {
  if (customFieldsCache && Date.now() - customFieldsAt < 5 * 60 * 1000) return customFieldsCache;
  const data = await request('GET',
    `/locations/${encodeURIComponent(env('GHL_LOCATION_ID'))}/customFields?model=contact`);
  customFieldsCache = data?.customFields || [];
  customFieldsAt = Date.now();
  return customFieldsCache;
}

export async function addToWorkflow(contactId, workflowId) {
  return request('POST',
    `/contacts/${encodeURIComponent(contactId)}/workflow/${encodeURIComponent(workflowId)}`, {});
}
