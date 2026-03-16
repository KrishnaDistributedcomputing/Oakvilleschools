import { Metadata } from 'next';
import { fetchSchools } from '@/lib/api';
import CompareTool from '@/components/CompareTool';

export const metadata: Metadata = {
  title: 'Compare Schools in Oakville | Side-by-Side School Comparison',
  description: 'Compare up to 3 Oakville schools side by side. Ratings, grades, programs, contact info, OSSD credits, accreditation and more.',
};

export const dynamic = 'force-dynamic';

export default async function ComparePage() {
  let schools: any[] = [];
  try {
    const res = await fetchSchools({ limit: '500' });
    schools = res.data;
  } catch {}

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span aria-current="page">Compare Schools</span>
      </nav>
      <h1 className="page-title">Compare Schools</h1>
      <p className="page-subtitle">Select up to 3 schools to compare side by side — ratings, programs, contact info, and more.</p>
      <CompareTool schools={schools} />
    </>
  );
}
