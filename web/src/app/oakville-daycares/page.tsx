import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolListClient from '@/components/SchoolListClient';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Daycares in Oakville | Oakville Schools Directory',
  description: 'Find licensed daycares and child care centers in Oakville, Ontario. Compare ratings, hours, and read parent reviews.',
};

export const dynamic = 'force-dynamic';

export default async function DaycaresPage() {
  let data = { data: [] as any[], pagination: { total: 0 } };
  try {
    data = await fetchSchools({ type: 'daycare', limit: '500' });
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Oakville Schools', url: '/oakville-schools' },
          { name: 'Daycares', url: '/oakville-daycares' },
        ]}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/oakville-schools">Schools</a> <span aria-hidden="true">/</span> <span aria-current="page">Daycares</span>
      </nav>
      <h1 className="page-title">Oakville Daycares &amp; Child Care</h1>
      <p className="page-subtitle">{data.pagination.total} daycares and child care centers.</p>
      <SchoolListClient schools={data.data} />
    </>
  );
}
