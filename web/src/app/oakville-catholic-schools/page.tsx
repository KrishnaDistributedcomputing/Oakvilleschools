import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolList from '@/components/SchoolList';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Catholic Schools in Oakville | Oakville Schools Directory',
  description: 'Browse Halton Catholic District School Board (HCDSB) schools in Oakville, Ontario.',
};

export const dynamic = 'force-dynamic';

export default async function CatholicSchoolsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);

  let data = { data: [] as any[], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  try {
    data = await fetchSchools({ type: 'catholic', page: String(page), limit: '20' });
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Oakville Schools', url: '/oakville-schools' },
          { name: 'Catholic Schools', url: '/oakville-catholic-schools' },
        ]}
      />
      <div className="breadcrumbs">
        <a href="/">Home</a> / <a href="/oakville-schools">Schools</a> / <span>Catholic Schools</span>
      </div>
      <h1 className="page-title">Oakville Catholic Schools</h1>
      <p className="page-subtitle">{data.pagination.total} Catholic schools from HCDSB.</p>
      <SchoolList schools={data.data} />
    </>
  );
}
