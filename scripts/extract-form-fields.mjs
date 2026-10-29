// Lists the fields of the public GHL form, to help fill in form.config.js.
// Usage: npm run extract-fields [formId]
//
// GHL does not publish a form-definition API, so this reads the field data
// embedded in the form's widget page. Check the output against the form.

import { FORM_ID } from '../form.config.js';

const formId = process.argv[2] || FORM_ID;
const res = await fetch(`https://api.leadconnectorhq.com/widget/form/${formId}`);
if (!res.ok) throw new Error(`Could not load the form (${res.status}).`);
const html = (await res.text()).replace(/\\u002F/g, '/').replace(/\\"/g, '"');

const seen = new Set();
const rows = [];
// Field definitions carry a label next to a tag or fieldKey, e.g.
// {"label":"Practice name","tag":"practice_name",...,"fieldKey":"contact.practice_name"}
for (const m of html.matchAll(/\{[^{}]*?"label"\s*:\s*"([^"]*)"[^{}]*?\}/g)) {
  const obj = m[0];
  const key = obj.match(/"fieldKey"\s*:\s*"([^"]+)"/)?.[1] || obj.match(/"tag"\s*:\s*"([^"]+)"/)?.[1];
  if (!key || seen.has(key)) continue;
  seen.add(key);
  const required = /"required"\s*:\s*true/.test(obj);
  const type = obj.match(/"(?:type|dataType)"\s*:\s*"([^"]+)"/)?.[1] || '';
  rows.push({ label: m[1], key, type, required });
}

if (!rows.length) {
  console.log('No field definitions found in the widget page. Open the form in GHL (Sites > Forms > Builder)');
  console.log('and copy each field\'s key from its settings, or from Settings > Custom Fields.');
} else {
  console.table(rows);
  console.log('\nPaste into FIELDS in form.config.js:\n');
  console.log(rows.map((r) => `  '${r.key}',`).join('\n'));
}
