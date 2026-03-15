import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolList from '@/components/SchoolList';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Montessori Schools in Oakville | Oakville Schools Directory',
  description: 'Browse Montessori schools and programs in Oakville, Ontario.',
};

export const dynamic = 'force-dynamic';

export default async function MontessoriSchoolsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);

  let data = { data: [] as any[], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  try {
    data = await fetchSchools({ type: 'montessori', page: String(page), limit: '20' });
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Oakville Schools', url: '/oakville-schools' },
          { name: 'Montessori Schools', url: '/oakville-montessori-schools' },
        ]}
      />
      <div className="breadcrumbs">
        <a href="/">Home</a> / <a href="/oakville-schools">Schools</a> / <span>Montessori Schools</span>
      </div>
      <h1 className="page-title">Oakville Montessori Schools</h1>
      <p className="page-subtitle">{data.pagination.total} Montessori schools and programs.</p>
      <SchoolList schools={data.data} />
    </>
  );
}
