import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolList from '@/components/SchoolList';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Daycares in Oakville | Oakville Schools Directory',
  description: 'Browse licensed daycares and child care centers in Oakville, Ontario.',
};

export const dynamic = 'force-dynamic';

export default async function DaycaresPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);

  let data = { data: [] as any[], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  try {
    data = await fetchSchools({ type: 'daycare', page: String(page), limit: '20' });
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
      <div className="breadcrumbs">
        <a href="/">Home</a> / <a href="/oakville-schools">Schools</a> / <span>Daycares</span>
      </div>
      <h1 className="page-title">Oakville Daycares &amp; Child Care</h1>
      <p className="page-subtitle">{data.pagination.total} daycares and child care centers.</p>
      <SchoolList schools={data.data} />
    </>
  );
}
