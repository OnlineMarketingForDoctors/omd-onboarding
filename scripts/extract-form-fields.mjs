// Lists the fields of the public GHL form, to help fill in form.config.js.
// Usage: npm run extract-fields [formId]
//
// GHL does not publish a form-definition API, so this reads the form data the
// widget page embeds as a Nuxt payload (a flat array where objects refer to
// their values by index). Check the output against the form.

import { FORM_ID } from '../form.config.js';

const formId = process.argv[2] || FORM_ID;
const res = await fetch(`https://api.leadconnectorhq.com/widget/form/${formId}`);
if (!res.ok) throw new Error(`Could not load the form (${res.status}).`);
const html = await res.text();

const payload = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!payload) throw new Error('The widget page has no Nuxt payload; GHL may have changed the page.');
const table = JSON.parse(payload[1]);

const WRAPPERS = new Set(['Reactive', 'ShallowReactive', 'Ref', 'ShallowRef', 'EmptyRef']);
const memo = new Map();
function hydrate(i) {
  if (typeof i !== 'number' || i < 0) return undefined;
  if (memo.has(i)) return memo.get(i);
  const v = table[i];
  if (Array.isArray(v) && WRAPPERS.has(v[0])) {
    const out = hydrate(v[1]);
    memo.set(i, out);
    return out;
  }
  if (v && typeof v === 'object') {
    const out = Array.isArray(v) ? [] : {};
    memo.set(i, out);
    for (const [k, x] of Object.entries(v)) out[k] = hydrate(x);
    return out;
  }
  memo.set(i, v);
  return v;
}

const fields = hydrate(0)?.data?.formData?.formPayload?.form?.fields;
if (!Array.isArray(fields)) throw new Error('No form fields found in the payload.');

// Layout elements (headings, images, the address group wrapper, captcha, button) are not inputs.
const SKIP = new Set(['header', 'image', 'group_address', 'captcha', 'button']);
// Form builder tags whose contact field key differs.
const STANDARD_KEYS = { address: 'address1', organization: 'company_name' };

const rows = fields
  .filter((f) => !SKIP.has(f.tag) && !f.hidden)
  .map((f) => ({
    label: f.label,
    key: f.standard ? STANDARD_KEYS[f.tag] || f.tag : f.fieldKey,
    type: f.dataType || f.type,
    required: !!f.required,
  }));

console.table(rows);
console.log('\nPaste into FIELDS in form.config.js:\n');
console.log(rows.map((r) => `  { key: '${r.key}', label: ${JSON.stringify(r.label)} },`).join('\n'));
