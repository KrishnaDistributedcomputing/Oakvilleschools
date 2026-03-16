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
        {school.image_url && (
          <div className="school-detail-hero">
            <img src={school.image_url} alt={school.name} />
          </div>
        )}

        <div className="school-detail-header">
          <span className="badge">{school.school_type}</span>
          {school.subtype && school.subtype !== school.school_type && (
            <span className="badge badge-outline">{school.subtype}</span>
          )}
          <h1>{school.name}</h1>
          {school.categories && (
            <p className="school-categories">{school.categories}</p>
          )}
        </div>

        {/* Rating & Reviews */}
        {school.rating && (() => {
          const r = typeof school.rating === 'string' ? parseFloat(school.rating) : school.rating;
          if (!r || isNaN(r)) return null;
          return (
            <div className="rating-block">
              <span className="rating-stars">
                {'★'.repeat(Math.floor(r))}
                {r % 1 >= 0.5 ? '½' : ''}
                {'☆'.repeat(5 - Math.floor(r) - (r % 1 >= 0.5 ? 1 : 0))}
              </span>
              <span className="rating-score">{r.toFixed(1)}</span>
              {school.reviews_count != null && school.reviews_count > 0 && (
                <span className="rating-count">({school.reviews_count} reviews)</span>
              )}
            </div>
          );
        })()}

        {/* Description */}
        {school.description && (
          <div className="school-description">
            <h2>About</h2>
            <p>{school.description}</p>
          </div>
        )}

        <div className="detail-grid">
          {school.address_line_1 && (
            <div className="detail-item">
              <label>📍 Address</label>
              <span>{school.address_line_1}, {school.city}, {school.province} {school.postal_code}</span>
            </div>
          )}
          {school.phone && (
            <div className="detail-item">
              <label>📞 Phone</label>
              <span><a href={`tel:${school.phone}`}>{school.phone}</a></span>
            </div>
          )}
          {school.website && (
            <div className="detail-item">
              <label>🌐 Website</label>
              <span>
                <a href={school.website} target="_blank" rel="noopener noreferrer">
                  {school.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
                </a>
              </span>
            </div>
          )}
          {school.grades && (
            <div className="detail-item">
              <label>🎓 Grades</label>
              <span>{school.grades}</span>
            </div>
          )}
          {school.age_range && (
            <div className="detail-item">
              <label>👶 Age Range</label>
              <span>{school.age_range}</span>
            </div>
          )}
          {school.operator && (
            <div className="detail-item">
              <label>🏫 Operator / Board</label>
              <span>{school.operator}</span>
            </div>
          )}
          {school.licensed !== null && (
            <div className="detail-item">
              <label>✅ Licensed</label>
              <span>{school.licensed ? 'Yes' : 'No'}</span>
            </div>
          )}
          {school.google_maps_url && (
            <div className="detail-item">
              <label>🗺️ Google Maps</label>
              <span>
                <a href={school.google_maps_url} target="_blank" rel="noopener noreferrer">
                  View on Google Maps
                </a>
              </span>
            </div>
          )}
        </div>

        {/* Opening Hours */}
        {school.opening_hours && (
          <div className="opening-hours">
            <h2>Opening Hours</h2>
            <table>
              <tbody>
                {Array.isArray(school.opening_hours) ? (
                  school.opening_hours.map((entry: any, i: number) => (
                    <tr key={i}>
                      <td className="day-name">{typeof entry === 'string' ? entry : (entry.day || Object.keys(entry)[0])}</td>
                      <td className="day-hours">{typeof entry === 'string' ? '' : (entry.hours || Object.values(entry)[0])}</td>
                    </tr>
                  ))
                ) : typeof school.opening_hours === 'object' ? (
                  Object.entries(school.opening_hours).map(([day, hours]: [string, any]) => (
                    <tr key={day}>
                      <td className="day-name">{day}</td>
                      <td className="day-hours">{String(hours)}</td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
