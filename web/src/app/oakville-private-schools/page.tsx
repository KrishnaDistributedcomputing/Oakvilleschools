import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolListClient from '@/components/SchoolListClient';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Private Schools in Oakville | Oakville Schools Directory',
  description: 'Find private and independent schools in Oakville, Ontario. Compare ratings, reviews, and contact information.',
};

export const dynamic = 'force-dynamic';

export default async function PrivateSchoolsPage() {
  let data = { data: [] as any[], pagination: { total: 0 } };
  try {
    data = await fetchSchools({ type: 'private', limit: '500' });
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Oakville Schools', url: '/oakville-schools' },
          { name: 'Private Schools', url: '/oakville-private-schools' },
        ]}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/oakville-schools">Schools</a> <span aria-hidden="true">/</span> <span aria-current="page">Private Schools</span>
      </nav>
      <h1 className="page-title">Oakville Private Schools</h1>
      <p className="page-subtitle">{data.pagination.total} private and independent schools.</p>
      <SchoolListClient schools={data.data} />
    </>
  );
}
