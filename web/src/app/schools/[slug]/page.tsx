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
