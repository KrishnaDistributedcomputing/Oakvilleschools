import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolList from '@/components/SchoolList';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Public Schools in Oakville | Oakville Schools Directory',
  description: 'Browse Halton District School Board (HDSB) public schools in Oakville, Ontario.',
};

export const dynamic = 'force-dynamic';

export default async function PublicSchoolsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);

  let data = { data: [] as any[], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  try {
    data = await fetchSchools({ type: 'public', page: String(page), limit: '20' });
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Oakville Schools', url: '/oakville-schools' },
          { name: 'Public Schools', url: '/oakville-public-schools' },
        ]}
      />
      <div className="breadcrumbs">
        <a href="/">Home</a> / <a href="/oakville-schools">Schools</a> / <span>Public Schools</span>
      </div>
      <h1 className="page-title">Oakville Public Schools</h1>
      <p className="page-subtitle">{data.pagination.total} public schools from the Halton District School Board.</p>
      <SchoolList schools={data.data} />
    </>
  );
}
