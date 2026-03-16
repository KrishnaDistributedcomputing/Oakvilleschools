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

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/oakville-schools">Schools</a> <span aria-hidden="true">/</span> <a href={typeUrl}>{typeLabel}</a> <span aria-hidden="true">/</span> <span aria-current="page">{school.name}</span>
      </nav>

      <div className="school-detail" role="article" aria-label={school.name}>
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
          const reviewsUrl = school.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.name + ' Oakville Ontario')}`;
          return (
            <div className="rating-block">
              <div className="rating-main">
                <span className="rating-stars" aria-hidden="true">
                  {'★'.repeat(Math.floor(r))}
                  {r % 1 >= 0.5 ? '½' : ''}
                  {'☆'.repeat(5 - Math.floor(r) - (r % 1 >= 0.5 ? 1 : 0))}
                </span>
                <span className="rating-score">{r.toFixed(1)}</span>
                {school.reviews_count != null && school.reviews_count > 0 && (
                  <a href={reviewsUrl} target="_blank" rel="noopener noreferrer" className="rating-reviews-link">
                    ({school.reviews_count} reviews)
                  </a>
                )}
              </div>
              <div className="rating-source">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Source: <a href={reviewsUrl} target="_blank" rel="noopener noreferrer">Google Reviews</a></span>
              </div>
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

        {/* CTA Buttons */}
        <div className="cta-buttons" role="group" aria-label="Contact actions">
          {school.phone && (
            <a href={`tel:${school.phone}`} className="cta-btn cta-btn-primary" aria-label={`Call ${school.name}`}>
              📞 Call Now
            </a>
          )}
          {school.website && (
            <a href={school.website} target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-primary" aria-label={`Visit ${school.name} website`}>
              🌐 Visit Website
            </a>
          )}
          {school.school_email && (
            <a href={`mailto:${school.school_email}`} className="cta-btn cta-btn-outline" aria-label={`Email ${school.name}`}>
              📧 Send Email
            </a>
          )}
          {school.google_maps_url && (
            <a href={school.google_maps_url} target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-outline" aria-label={`Get directions to ${school.name}`}>
              🗺️ Get Directions
            </a>
          )}
          {school.address_line_1 && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.address_line_1 + ', ' + school.city)}`} target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-outline" aria-label={`View ${school.name} on map`}>
              📍 View on Map
            </a>
          )}
        </div>

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
          {school.principal_name && (
            <div className="detail-item">
              <label>👤 Principal</label>
              <span>{school.principal_name}</span>
            </div>
          )}
          {school.school_email && (
            <div className="detail-item">
              <label>📧 Email</label>
              <span><a href={`mailto:${school.school_email}`}>{school.school_email}</a></span>
            </div>
          )}
          {school.fax && (
            <div className="detail-item">
              <label>📠 Fax</label>
              <span>{school.fax}</span>
            </div>
          )}
          {school.ossd_credits && (
            <div className="detail-item">
              <label>📜 OSSD Credits</label>
              <span>{school.ossd_credits}</span>
            </div>
          )}
          {school.program_type && (
            <div className="detail-item">
              <label>💻 Program Type</label>
              <span>{school.program_type}</span>
            </div>
          )}
          {school.school_level && (
            <div className="detail-item">
              <label>📊 School Level</label>
              <span>{school.school_level}</span>
            </div>
          )}
          {school.association_membership && school.association_membership !== 'No Association Membership' && (
            <div className="detail-item">
              <label>🤝 Accreditation</label>
              <span>{school.association_membership}</span>
            </div>
          )}
          {school.school_number && (
            <div className="detail-item">
              <label>🔢 School Number</label>
              <span>{school.school_number}</span>
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
