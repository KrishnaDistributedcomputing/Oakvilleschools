import { Metadata } from 'next';
import { fetchSchoolBySlug } from '@/lib/api';
import { SchoolJsonLd, BreadcrumbJsonLd } from '@/components/StructuredData';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data: school } = await fetchSchoolBySlug(params.slug);
    return {
      title: `${school.name} | Oakville Schools Directory`,
      description: `${school.name} — ${school.school_type} school in ${school.city}, Ontario. ${school.address_line_1 || ''}`,
    };
  } catch {
    return { title: 'School Not Found' };
  }
}

export const dynamic = 'force-dynamic';

export default async function SchoolDetailPage({ params }: Props) {
  let school;
  try {
    const response = await fetchSchoolBySlug(params.slug);
    school = response.data;
  } catch {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h1>School Not Found</h1>
        <p>The school you are looking for could not be found.</p>
        <a href="/oakville-schools">Browse all schools</a>
      </div>
    );
  }

  const typeLabel = school.school_type.charAt(0).toUpperCase() + school.school_type.slice(1);
  const typeUrl = school.school_type === 'daycare'
    ? '/oakville-daycares'
    : `/oakville-${school.school_type}-schools`;

  return (
    <>
      <SchoolJsonLd school={school} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Oakville Schools', url: '/oakville-schools' },
          { name: `${typeLabel} Schools`, url: typeUrl },
          { name: school.name, url: `/schools/${school.slug}` },
        ]}
      />

      <div className="breadcrumbs">
        <a href="/">Home</a> / <a href="/oakville-schools">Schools</a> / <a href={typeUrl}>{typeLabel}</a> / <span>{school.name}</span>
      </div>

      <div className="school-detail">
        <span className="badge">{school.school_type}</span>
        <h1>{school.name}</h1>

        <div className="detail-grid">
          {school.address_line_1 && (
            <div className="detail-item">
              <label>Address</label>
              <span>{school.address_line_1}, {school.city}, {school.province} {school.postal_code}</span>
            </div>
          )}
          {school.phone && (
            <div className="detail-item">
              <label>Phone</label>
              <span>{school.phone}</span>
            </div>
          )}
          {school.website && (
            <div className="detail-item">
              <label>Website</label>
              <span>
                <a href={school.website} target="_blank" rel="noopener noreferrer">
                  {school.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </span>
            </div>
          )}
          {school.grades && (
            <div className="detail-item">
              <label>Grades</label>
              <span>{school.grades}</span>
            </div>
          )}
          {school.age_range && (
            <div className="detail-item">
              <label>Age Range</label>
              <span>{school.age_range}</span>
            </div>
          )}
          {school.operator && (
            <div className="detail-item">
              <label>Operator</label>
              <span>{school.operator}</span>
            </div>
          )}
          {school.licensed !== null && (
            <div className="detail-item">
              <label>Licensed</label>
              <span>{school.licensed ? 'Yes' : 'No'}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
