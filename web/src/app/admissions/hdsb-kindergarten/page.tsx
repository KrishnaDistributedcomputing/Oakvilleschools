import { Metadata } from 'next';
import { fetchSchools, School } from '@/lib/api';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'HDSB Kindergarten Registration 2026-2027 | Oakville Schools Directory',
  description: 'Junior Kindergarten (JK) and Senior Kindergarten (SK) registration is now open for the 2026-2027 school year. Find HDSB elementary schools in Oakville accepting registrations.',
};

export const dynamic = 'force-dynamic';

function SchoolRow({ school }: { school: School }) {
  const r = typeof school.rating === 'string' ? parseFloat(school.rating) : school.rating;
  return (
    <a href={`/schools/${school.slug}`} className="admit-school-row">
      <div className="admit-school-info">
        <h3>{school.name}</h3>
        <p>{school.address_line_1 && school.address_line_1 !== 'Oakville, Ontario' ? school.address_line_1 : ''}</p>
      </div>
      <div className="admit-school-meta">
        {school.grades && <span className="admit-badge">🎓 {school.grades}</span>}
        {r != null && !isNaN(r) && <span className="admit-badge admit-badge-gold">⭐ {r.toFixed(1)}</span>}
        {school.phone && <span className="admit-badge">📞 {school.phone}</span>}
      </div>
      <div className="admit-school-actions">
        {school.website && (
          <span className="admit-link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(school.website!, '_blank'); }}>
            Visit Website →
          </span>
        )}
      </div>
    </a>
  );
}

export default async function HdsbKindergartenPage() {
  let schools: School[] = [];
  try {
    const res = await fetchSchools({ type: 'public', limit: '500' });
    schools = res.data.filter((s: School) =>
      s.subtype === 'elementary' || (s.grades && (s.grades.includes('JK') || s.grades.includes('SK') || s.grades.includes('K-')))
    );
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Admissions', url: '/admissions' },
        { name: 'HDSB Kindergarten', url: '/admissions/hdsb-kindergarten' },
      ]} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span>Admissions</span> <span aria-hidden="true">/</span> <span aria-current="page">HDSB Kindergarten</span>
      </nav>

      <div className="admit-page">
        <div className="admit-hero admit-hero-green">
          <span className="admit-tag">🔴 Registration Open</span>
          <h1>HDSB Kindergarten Registration 2026-2027</h1>
          <p>Junior Kindergarten (JK) and Senior Kindergarten (SK) registration is now open for the Halton District School Board.</p>
        </div>

        <div className="admit-content">
          <div className="admit-summary">
            <h2>Key Information</h2>
            <div className="admit-info-grid">
              <div className="admit-info-card">
                <h3>👧 Who Can Register?</h3>
                <ul>
                  <li><strong>Junior Kindergarten (JK):</strong> Children born in 2022</li>
                  <li><strong>Senior Kindergarten (SK):</strong> Children born in 2021</li>
                  <li>Must live in the Halton District School Board catchment area</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>📋 What You Need</h3>
                <ul>
                  <li>Child&apos;s birth certificate or proof of age</li>
                  <li>Proof of address (utility bill, lease, or tax bill)</li>
                  <li>Immunization records</li>
                  <li>Custody documents (if applicable)</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>📅 How to Register</h3>
                <ul>
                  <li>Register online at <a href="https://www.hdsb.ca/schools/Pages/Registration.aspx" target="_blank" rel="noopener noreferrer">hdsb.ca</a></li>
                  <li>Or visit your neighbourhood school in person</li>
                  <li>French Immersion: check your school for separate application dates</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>🏫 Programs Available</h3>
                <ul>
                  <li>Full-day Kindergarten (every day)</li>
                  <li>English program</li>
                  <li>French Immersion (select schools)</li>
                  <li>Before &amp; after school care available at most locations</li>
                </ul>
              </div>
            </div>

            <div className="admit-cta-bar">
              <a href="https://www.hdsb.ca/schools/Pages/Registration.aspx" target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-primary">
                📝 Register Online at HDSB
              </a>
              <a href="https://www.hdsb.ca/schools/school-directory/" target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-outline">
                📍 Find Your Neighbourhood School
              </a>
            </div>
          </div>

          <h2 className="admit-schools-title">Oakville HDSB Elementary Schools ({schools.length})</h2>
          <p className="admit-schools-subtitle">Click any school to view details, ratings, and contact information.</p>
          <div className="admit-schools-list" role="list">
            {schools.map((school) => (
              <SchoolRow key={school.id} school={school} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
