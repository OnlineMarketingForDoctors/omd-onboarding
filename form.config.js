// The fields shown once a contact is selected, in display order.
//
// These mirror the GHL form "Onboarding New Client"
// https://api.leadconnectorhq.com/widget/form/Kjw0PFbJkD8juTSV0IKH
// Run `npm run extract-fields` to list that form's fields and their keys.
//
// Each entry is either a field key or an object with overrides:
//   'email'                                  a standard contact field
//   'contact.clinic_name'                    a custom field, by its GHL key
//   { key: 'contact.notes', label: 'Notes', required: false }
//
// Custom fields take their type and options from GHL, so only the key is
// needed. Every field is required unless it says `required: false`.

export const FORM_ID = 'Kjw0PFbJkD8juTSV0IKH';

export const FIELDS = [
  // General info
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  'email',
  'phone',
  { key: 'contact.clinic_name', label: 'Business Name' },
  { key: 'contact.clinic_type', label: 'Clinic Type' },
  // Address
  { key: 'address1', label: 'Street Address' },
  'city',
  'state',
  'country',
  { key: 'postal_code', label: 'Post/ZIP Code' },
  // Contract details
  { key: 'contact.package_type', label: 'Package Type' },
  { key: 'contact.contract_value', label: 'Contract Value' },
  { key: 'contact.contract_link', label: 'Contract Link' },
  { key: 'contact.renewal_date', label: 'Renewal Date' },
  { key: 'contact.account_manager', label: 'Account Manager' },
];
