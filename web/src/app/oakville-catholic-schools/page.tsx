import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolListClient from '@/components/SchoolListClient';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Catholic Schools in Oakville | Oakville Schools Directory',
  description: 'Find Halton Catholic District School Board (HCDSB) schools in Oakville, Ontario. Search, compare ratings and reviews.',
};

export const dynamic = 'force-dynamic';

export default async function CatholicSchoolsPage() {
  let data = { data: [] as any[], pagination: { total: 0 } };
  try {
    data = await fetchSchools({ type: 'catholic', limit: '500' });
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
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/oakville-schools">Schools</a> <span aria-hidden="true">/</span> <span aria-current="page">Catholic Schools</span>
      </nav>
      <h1 className="page-title">Oakville Catholic Schools</h1>
      <p className="page-subtitle">{data.pagination.total} Catholic schools from HCDSB.</p>
      <SchoolListClient schools={data.data} />
    </>
  );
}
