import { School } from '@/lib/api';

function jsonLdSchool(school: School) {
  return {
    '@context': 'https://schema.org',
    '@type': school.school_type === 'daycare' ? 'ChildCare' : 'School',
    name: school.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: school.address_line_1,
      addressLocality: school.city,
      addressRegion: school.province,
      postalCode: school.postal_code,
      addressCountry: 'CA',
    },
    telephone: school.phone,
    url: school.website,
  };
}

export function SchoolJsonLd({ school }: { school: School }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchool(school)) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
