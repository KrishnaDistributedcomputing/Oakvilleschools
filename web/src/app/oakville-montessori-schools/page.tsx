import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolListClient from '@/components/SchoolListClient';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Montessori Schools in Oakville | Oakville Schools Directory',
  description: 'Find Montessori schools and programs in Oakville, Ontario. Compare ratings, read reviews, and find the perfect Montessori education.',
};

export const dynamic = 'force-dynamic';

export default async function MontessoriSchoolsPage() {
  let data = { data: [] as any[], pagination: { total: 0 } };
  try {
    data = await fetchSchools({ type: 'montessori', limit: '500' });
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
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/oakville-schools">Schools</a> <span aria-hidden="true">/</span> <span aria-current="page">Montessori Schools</span>
      </nav>
      <h1 className="page-title">Oakville Montessori Schools</h1>
      <p className="page-subtitle">{data.pagination.total} Montessori schools and programs.</p>
      <SchoolListClient schools={data.data} />
    </>
  );
}
