import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolListClient from '@/components/SchoolListClient';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'All Schools in Oakville | Oakville Schools Directory',
  description: 'Search and compare all 259+ schools in Oakville, Ontario. Filter by type, rating, and sort by name or reviews.',
};

export const dynamic = 'force-dynamic';

export default async function OakvilleSchoolsPage() {
  let data = { data: [] as any[], pagination: { total: 0 } };
  try {
    data = await fetchSchools({ limit: '500' });
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Oakville Schools', url: '/oakville-schools' },
        ]}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span aria-current="page">All Schools</span>
      </nav>
      <h1 className="page-title">Oakville Schools</h1>
      <p className="page-subtitle">Browse all {data.pagination.total} schools and daycares in Oakville.</p>
      <SchoolListClient schools={data.data} showTypeFilter={true} />
    </>
  );
}
