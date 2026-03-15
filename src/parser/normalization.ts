import { NormalizedSchool, SchoolType } from '../types';

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw.trim();
}

export function normalizePostalCode(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/\s+/g, '').toUpperCase();
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return raw.trim().toUpperCase();
}

export function extractPostalCode(address: string): string {
  const match = address.match(/[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d/);
  return match ? normalizePostalCode(match[0]) : '';
}

export function normalizeAddress(raw: string): {
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
} {
  if (!raw) {
    return { addressLine1: '', city: 'Oakville', province: 'Ontario', postalCode: '' };
  }

  const postalCode = extractPostalCode(raw);

  // Try to split on commas
  const parts = raw.split(',').map((p) => p.trim());
  let addressLine1 = parts[0] || '';
  let city = 'Oakville';
  let province = 'Ontario';

  if (parts.length >= 3) {
    addressLine1 = parts[0];
    city = parts[1] || 'Oakville';
    // Province might be combined with postal code
    const provPart = parts[2] || '';
    if (provPart.toLowerCase().includes('ontario') || provPart.toLowerCase().startsWith('on')) {
      province = 'Ontario';
    }
  } else if (parts.length === 2) {
    addressLine1 = parts[0];
    city = parts[1].replace(/[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d/, '').trim() || 'Oakville';
  }

  // Remove postal code from address line
  addressLine1 = addressLine1.replace(/[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d/, '').trim();

  return { addressLine1, city, province, postalCode };
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeWebsite(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  try {
    new URL(url);
    return url;
  } catch {
    return '';
  }
}

export function normalizeGrades(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/kindergarten/gi, 'K')
    .replace(/junior kindergarten/gi, 'JK')
    .replace(/senior kindergarten/gi, 'SK')
    .replace(/grade\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildNormalizedSchool(
  rawName: string,
  rawAddress: string,
  schoolType: SchoolType,
  options?: {
    rawPhone?: string;
    rawWebsite?: string;
    rawGrades?: string;
    operator?: string;
    ageRange?: string;
    licensed?: boolean;
  }
): NormalizedSchool {
  const address = normalizeAddress(rawAddress);

  return {
    name: rawName.trim(),
    slug: generateSlug(rawName),
    schoolType,
    operator: options?.operator,
    addressLine1: address.addressLine1,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    phone: options?.rawPhone ? normalizePhone(options.rawPhone) : undefined,
    website: options?.rawWebsite ? normalizeWebsite(options.rawWebsite) : undefined,
    grades: options?.rawGrades ? normalizeGrades(options.rawGrades) : undefined,
    ageRange: options?.ageRange,
    licensed: options?.licensed,
  };
}
