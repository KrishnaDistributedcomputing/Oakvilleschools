import { Metadata } from 'next';
import { fetchSchools, School } from '@/lib/api';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'HCDSB Catholic School Registration 2026-2027 | Oakville Schools Directory',
  description: 'Halton Catholic District School Board registration for Catholic elementary and secondary schools in Oakville. Requirements, documents needed, and school listings.',
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
    </a>
  );
}

export default async function HcdsbRegistrationPage() {
  let schools: School[] = [];
  try {
    const res = await fetchSchools({ type: 'catholic', limit: '500' });
    schools = res.data;
  } catch {}

  const elementary = schools.filter(s => s.subtype === 'elementary');
  const secondary = schools.filter(s => s.subtype === 'secondary');

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Admissions', url: '/admissions' },
        { name: 'HCDSB Registration', url: '/admissions/hcdsb-registration' },
      ]} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span>Admissions</span> <span aria-hidden="true">/</span> <span aria-current="page">HCDSB Registration</span>
      </nav>

      <div className="admit-page">
        <div className="admit-hero admit-hero-purple">
          <span className="admit-tag">🔴 Registration Open</span>
          <h1>HCDSB Catholic School Registration</h1>
          <p>Halton Catholic District School Board is accepting registrations for the 2026-2027 school year.</p>
        </div>

        <div className="admit-content">
          <div className="admit-summary">
            <h2>Key Information</h2>
            <div className="admit-info-grid">
              <div className="admit-info-card">
                <h3>⛪ Eligibility</h3>
                <ul>
                  <li>At least one parent/guardian must be a Catholic ratepayer</li>
                  <li>Child&apos;s Catholic Baptismal Certificate required</li>
                  <li>Non-Catholic students may apply where space permits</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>📋 Documents Needed</h3>
                <ul>
                  <li>Catholic Baptismal Certificate</li>
                  <li>Child&apos;s birth certificate</li>
                  <li>Proof of address</li>
                  <li>Immunization records</li>
                  <li>Canadian citizenship or immigration documents</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>📅 French Immersion</h3>
                <ul>
                  <li>French Immersion begins in Grade 1 at select schools</li>
                  <li>Separate application deadlines apply — typically January/February</li>
                  <li>Contact your local school for availability</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>🏫 Grade Levels</h3>
                <ul>
                  <li><strong>Elementary:</strong> JK through Grade 8</li>
                  <li><strong>Secondary:</strong> Grades 9-12</li>
                  <li>Special programs: SHSM, AP, Specialist High Skills</li>
                </ul>
              </div>
            </div>

            <div className="admit-cta-bar">
              <a href="https://www.hcdsb.org" target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-primary">
                📝 Register at HCDSB
              </a>
            </div>
          </div>

          {secondary.length > 0 && (
            <>
              <h2 className="admit-schools-title">Catholic Secondary Schools ({secondary.length})</h2>
              <div className="admit-schools-list" role="list">
                {secondary.map((school) => <SchoolRow key={school.id} school={school} />)}
              </div>
            </>
          )}

          <h2 className="admit-schools-title">Catholic Elementary Schools ({elementary.length})</h2>
          <div className="admit-schools-list" role="list">
            {elementary.map((school) => <SchoolRow key={school.id} school={school} />)}
          </div>
        </div>
      </div>
    </>
  );
}
