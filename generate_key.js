const SECRET_SALT = 'PHARMA_QC_2024_SECURE';

// Calculate date 3 months from now
const date = new Date();
date.setMonth(date.getMonth() + 3);

const timestamp = date.getTime().toString();
const raw = timestamp + ':' + SECRET_SALT;

// Custom obfuscation: Base64 -> Reverse -> Base64
const b64 = btoa(raw);
const reversed = b64.split('').reverse().join('');
const key = btoa(reversed);

console.log('Expiry Date:', date.toISOString());
console.log('License Key:', key);
