import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolList from '@/components/SchoolList';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'All Schools in Oakville | Oakville Schools Directory',
  description: 'Browse all public, Catholic, private, Montessori schools and daycares in Oakville, Ontario.',
};

export const dynamic = 'force-dynamic';

export default async function OakvilleSchoolsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const params: Record<string, string> = { page: String(page), limit: '20' };
  if (searchParams.search) params.search = searchParams.search;

  let data = { data: [] as any[], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  try {
    data = await fetchSchools(params);
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Oakville Schools', url: '/oakville-schools' },
        ]}
      />
      <div className="breadcrumbs">
        <a href="/">Home</a> / <span>All Schools</span>
      </div>
      <h1 className="page-title">Oakville Schools</h1>
      <p className="page-subtitle">Browse all {data.pagination.total} schools and daycares in Oakville.</p>
      <SchoolList schools={data.data} />
    </>
  );
}
