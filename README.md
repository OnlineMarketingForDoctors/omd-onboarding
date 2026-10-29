# OMD Onboarding

An internal page for onboarding a client contact in GHL (LeadConnector):

1. Search for a contact by name, email or phone, then select one.
2. The fields of the onboarding form appear, filled in with whatever the contact
   already has in GHL. Empty fields are marked **Missing**.
3. Every field is required. Submitting writes the changed values back to the
   contact and adds the contact to the onboarding workflow.

No build step and no dependencies. It is a static page (`public/index.html`)
plus two Vercel serverless functions that hold the GHL token, so the token
never reaches the browser.

## Structure

| Path | What it is |
| --- | --- |
| `form.config.js` | **The field list.** Which fields the form shows, in order. |
| `public/index.html` | The page: search, the form, validation. Styles and script inline. |
| `api/search.js` | `GET /api/search?q=` searches contacts in the location. |
| `api/contact.js` | `GET /api/contact?id=` returns fields and current values. `POST` validates, updates the contact and starts the workflow. |
| `lib/ghl.js` | GHL API v2 client. |
| `lib/fields.js` | Maps the config to field definitions, reads values, validates, builds the update. |
| `lib/http.js` | Password check and error handling shared by the routes. |
| `scripts/dev-server.mjs` | Runs the page and API locally without the Vercel CLI. |
| `scripts/extract-form-fields.mjs` | Lists the fields of the GHL form, to help fill in `form.config.js`. |

## Setup

### 1. GHL private integration

In the sub-account go to **Settings → Private Integrations → Create new integration**
and grant these scopes:

- `contacts.readonly`
- `contacts.write` (updating the contact and adding it to a workflow)
- `locations/customFields.readonly`

Copy the token.

### 2. Workflow

The workflow is started with GHL's *Add contact to workflow* endpoint, so it
needs no trigger of its own; the contact is enrolled directly. Open the workflow
and copy its id from the URL (`.../workflow/<id>`). Make sure it is **Published**.

### 3. Fields

`FIELDS` in `form.config.js` already matches the GHL form
`Kjw0PFbJkD8juTSV0IKH` ("Onboarding New Client"). If the form changes, update it
with field keys:

- Standard fields: `first_name`, `last_name`, `email`, `phone`, `company_name`,
  `website`, `address1`, `city`, `state`, `postal_code`, `country`, `date_of_birth`.
- Custom fields: the key shown in **Settings → Custom Fields**, e.g. `contact.practice_name`.
  Label, type and dropdown or checkbox options are read from GHL, so they stay in step
  when the field is edited there.

`npm run extract-fields` lists the form's current fields and keys, ready to paste.

Supported custom field types: text, large text, number, monetary, phone, email,
date, dropdown, radio, multi-select and checkbox. File upload and other types
are shown read-only, with a note to edit them in GHL.

### 4. Environment variables

See `.env.example`:

| Variable | Value |
| --- | --- |
| `GHL_TOKEN` | The private integration token. |
| `GHL_LOCATION_ID` | The sub-account id (Settings → Business Profile, or the `location/<id>` part of the URL). |
| `GHL_WORKFLOW_ID` | The workflow to start. |
| `ACCESS_PASSWORD` | A shared password for the team. The page asks for it once per browser tab. |

## Run locally

```bash
cp .env.example .env   # then fill it in
npm run dev            # http://localhost:3000
```

## Deploy to Vercel

Import the repository as a new project (framework preset **Other**, no build
command), add the four environment variables, and deploy. `vercel.json` serves
`public/` and the `api/` folder becomes the functions.

## Behaviour notes

- Only fields whose value changed are sent to GHL, so an unchanged email or
  phone is never rewritten.
- The server validates again on submit: required fields, email format, numbers,
  dates, and that choices are among the field's options. The browser check is
  only for convenience.
- The contact is added to the workflow on every submit, even when no field
  changed. Whether a contact can go through it twice is decided by the
  workflow's *Allow re-entry* setting in GHL.
- A contact from another location is rejected even if its id is known.
