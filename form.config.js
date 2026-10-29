// The fields shown once a contact is selected, in display order.
//
// Mirror the fields of the GHL form
// https://api.leadconnectorhq.com/widget/form/Kjw0PFbJkD8juTSV0IKH here.
// Run `npm run extract-fields` to list that form's fields and their keys.
//
// Each entry is either a field key or an object with overrides:
//   'email'                                  a standard contact field
//   'contact.practice_name'                  a custom field, by its GHL key
//   { key: 'contact.notes', label: 'Notes', required: false }
//
// Custom fields take their label, type and options from GHL, so only the key
// is needed. Every field is required unless it says `required: false`.

export const FORM_ID = 'Kjw0PFbJkD8juTSV0IKH';

export const FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company_name',
  'website',
  'address1',
  'city',
  'state',
  'postal_code',
  'country',
];
