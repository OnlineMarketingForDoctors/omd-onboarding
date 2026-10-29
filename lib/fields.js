// Turns form.config.js into field definitions, reads their values off a GHL
// contact, and validates submitted values into a contact update payload.

import { FIELDS } from '../form.config.js';
import { getCustomFields, GhlError } from './ghl.js';

// Standard contact fields: config key -> contact property, label, input type.
const STANDARD = {
  first_name: ['firstName', 'First name', 'text'],
  last_name: ['lastName', 'Last name', 'text'],
  email: ['email', 'Email', 'email'],
  phone: ['phone', 'Phone', 'tel'],
  company_name: ['companyName', 'Business name', 'text'],
  website: ['website', 'Website', 'url'],
  address1: ['address1', 'Street address', 'text'],
  city: ['city', 'City', 'text'],
  state: ['state', 'State', 'text'],
  postal_code: ['postalCode', 'Postcode', 'text'],
  country: ['country', 'Country (2-letter code)', 'text'],
  date_of_birth: ['dateOfBirth', 'Date of birth', 'date'],
};

// GHL custom field dataType -> input type. Anything else cannot be edited here.
const CUSTOM_TYPES = {
  TEXT: 'text',
  LARGE_TEXT: 'textarea',
  NUMERICAL: 'number',
  MONETORY: 'number',
  PHONE: 'tel',
  EMAIL: 'email',
  DATE: 'date',
  SINGLE_OPTIONS: 'select',
  RADIO: 'radio',
  MULTIPLE_OPTIONS: 'multi',
  CHECKBOX: 'multi',
};

const option = (o) => (typeof o === 'string' ? o : o?.label ?? o?.value ?? String(o));

export async function resolveFields() {
  const custom = await getCustomFields();
  return FIELDS.map((entry) => {
    const spec = typeof entry === 'string' ? { key: entry } : entry;
    const name = spec.key.replace(/^contact\./, '');
    const required = spec.required !== false;

    if (STANDARD[name]) {
      const [prop, label, type] = STANDARD[name];
      return { key: spec.key, label: spec.label || label, type, required, standard: prop };
    }

    const def = custom.find((f) => f.fieldKey === `contact.${name}` || f.id === spec.key);
    if (!def) {
      throw new GhlError(500, `form.config.js lists "${spec.key}", which is neither a standard field nor a custom field in this location.`);
    }
    const type = CUSTOM_TYPES[def.dataType] || 'unsupported';
    return {
      key: spec.key,
      label: spec.label || def.name,
      type,
      dataType: def.dataType,
      required: required && type !== 'unsupported',
      placeholder: def.placeholder || '',
      options: (def.picklistOptions || []).map(option),
      customId: def.id,
    };
  });
}

function toDateInput(v) {
  if (v === null || v === undefined || v === '') return '';
  const d = typeof v === 'number' || /^\d+$/.test(String(v)) ? new Date(Number(v)) : new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10);
}

function normalise(field, raw) {
  if (field.type === 'multi') {
    if (Array.isArray(raw)) return raw.map(String);
    return raw ? String(raw).split(',').map((s) => s.trim()).filter(Boolean) : [];
  }
  if (field.type === 'date') return toDateInput(raw);
  if (raw === null || raw === undefined) return '';
  return Array.isArray(raw) ? raw.join(', ') : String(raw);
}

export function readValues(fields, contact) {
  const custom = contact.customFields || [];
  const values = {};
  for (const f of fields) {
    let raw;
    if (f.standard) raw = contact[f.standard];
    else {
      const c = custom.find((x) => x.id === f.customId);
      raw = c?.value ?? c?.fieldValue;
    }
    values[f.key] = normalise(f, raw);
  }
  return values;
}

const isEmpty = (v) => (Array.isArray(v) ? v.length === 0 : String(v ?? '').trim() === '');

function check(field, value) {
  if (isEmpty(value)) return field.required ? 'This field is required.' : null;
  switch (field.type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Enter a valid email address.';
    case 'number':
      return Number.isFinite(Number(value)) ? null : 'Enter a number.';
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(value) ? null : 'Enter a valid date.';
    case 'select':
    case 'radio':
      return field.options.includes(value) ? null : 'Choose one of the listed options.';
    case 'multi':
      return value.every((v) => field.options.includes(v)) ? null : 'Choose from the listed options.';
    default:
      return null;
  }
}

// Validates `submitted` against the field definitions and returns the errors
// plus a PUT /contacts payload holding only the fields whose value changed.
export function buildUpdate(fields, current, submitted) {
  const errors = {};
  const payload = {};
  const customFields = [];

  for (const f of fields) {
    if (f.type === 'unsupported') continue;
    let value = submitted[f.key];
    value = f.type === 'multi'
      ? (Array.isArray(value) ? value.map(String) : [])
      : String(value ?? '').trim();

    const error = check(f, value);
    if (error) { errors[f.key] = error; continue; }

    const unchanged = f.type === 'multi'
      ? [...value].sort().join('\n') === [...current[f.key]].sort().join('\n')
      : value === current[f.key];
    if (unchanged) continue;

    const out = f.type === 'number' && value !== '' ? Number(value) : value;
    if (f.standard) payload[f.standard] = out;
    else customFields.push({ id: f.customId, field_value: out });
  }

  if (customFields.length) payload.customFields = customFields;
  return { errors, payload };
}
