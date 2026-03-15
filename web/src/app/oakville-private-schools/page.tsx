import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolList from '@/components/SchoolList';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Private Schools in Oakville | Oakville Schools Directory',
  description: 'Browse private and independent schools in Oakville, Ontario.',
};

export const dynamic = 'force-dynamic';

export default async function PrivateSchoolsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);

  let data = { data: [] as any[], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  try {
    data = await fetchSchools({ type: 'private', page: String(page), limit: '20' });
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
      <div className="breadcrumbs">
        <a href="/">Home</a> / <a href="/oakville-schools">Schools</a> / <span>Private Schools</span>
      </div>
      <h1 className="page-title">Oakville Private Schools</h1>
      <p className="page-subtitle">{data.pagination.total} private and independent schools.</p>
      <SchoolList schools={data.data} />
    </>
  );
}
