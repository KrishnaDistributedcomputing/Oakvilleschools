import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import SchoolListClient from '@/components/SchoolListClient';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Public Schools in Oakville | Oakville Schools Directory',
  description: 'Browse Halton District School Board (HDSB) public schools in Oakville, Ontario. Search, filter by rating, and find the right school for your child.',
};

export const dynamic = 'force-dynamic';

export default async function PublicSchoolsPage() {
  let data = { data: [] as any[], pagination: { total: 0 } };
  try {
    data = await fetchSchools({ type: 'public', limit: '500' });
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
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/oakville-schools">Schools</a> <span aria-hidden="true">/</span> <span aria-current="page">Public Schools</span>
      </nav>
      <h1 className="page-title">Oakville Public Schools</h1>
      <p className="page-subtitle">{data.pagination.total} public schools from the Halton District School Board.</p>
      <SchoolListClient schools={data.data} />
    </>
  );
}
