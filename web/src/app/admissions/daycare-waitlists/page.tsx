import { Metadata } from 'next';
import { fetchSchools, School } from '@/lib/api';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Oakville Daycare Waitlists & Registration | Oakville Schools Directory',
  description: 'Register for licensed daycares in Oakville through OneList Halton. Find infant, toddler, preschool, and before/after school care. Waitlist tips and daycare listings.',
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
        {school.age_range && <span className="admit-badge">👶 {school.age_range}</span>}
        {r != null && !isNaN(r) && <span className="admit-badge admit-badge-gold">⭐ {r.toFixed(1)}</span>}
        {school.phone && <span className="admit-badge">📞 {school.phone}</span>}
      </div>
    </a>
  );
}

export default async function DaycareWaitlistsPage() {
  let schools: School[] = [];
  try {
    const res = await fetchSchools({ type: 'daycare', limit: '500' });
    schools = res.data;
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Admissions', url: '/admissions' },
        { name: 'Daycare Waitlists', url: '/admissions/daycare-waitlists' },
      ]} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span>Admissions</span> <span aria-hidden="true">/</span> <span aria-current="page">Daycare Waitlists</span>
      </nav>

      <div className="admit-page">
        <div className="admit-hero admit-hero-red">
          <span className="admit-tag">👶 Register Early</span>
          <h1>Oakville Daycare Waitlists &amp; Registration</h1>
          <p>Licensed child care in Oakville is in high demand. Register through OneList Halton to join multiple waitlists.</p>
        </div>

        <div className="admit-content">
          <div className="admit-summary">
            <h2>How Daycare Registration Works</h2>
            <div className="admit-info-grid">
              <div className="admit-info-card">
                <h3>📋 OneList Halton</h3>
                <p>Halton Region uses <strong>OneList</strong> — a centralized system to manage child care waitlists. Register once to be placed on waitlists at multiple daycare centres simultaneously.</p>
                <a href="https://onelisthalton.ca" target="_blank" rel="noopener noreferrer" className="news-link">Visit onelisthalton.ca →</a>
              </div>
              <div className="admit-info-card">
                <h3>👶 Age Groups</h3>
                <ul>
                  <li><strong>Infant:</strong> 0 &ndash; 18 months (highest demand)</li>
                  <li><strong>Toddler:</strong> 18 months &ndash; 2.5 years</li>
                  <li><strong>Preschool:</strong> 2.5 &ndash; 5 years</li>
                  <li><strong>School-age:</strong> Before &amp; after school care (4 &ndash; 12 years)</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>💰 Subsidy &amp; Fees</h3>
                <ul>
                  <li>Government fee reduction: $10/day for eligible families (CWELCC)</li>
                  <li>Halton Region child care fee subsidy available based on income</li>
                  <li>Apply through Halton Region Social Services</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>💡 Tips for Parents</h3>
                <ul>
                  <li>Register on OneList as early as possible &mdash; even during pregnancy</li>
                  <li>Select 3&ndash;5 centres to maximize your chances</li>
                  <li>Tour facilities in person before making a decision</li>
                  <li>Check for fee subsidy eligibility to reduce costs</li>
                </ul>
              </div>
            </div>

            <div className="admit-cta-bar">
              <a href="https://onelisthalton.ca" target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-primary">
                📝 Register on OneList Halton
              </a>
              <a href="https://www.halton.ca/For-Residents/Childcare-Parenting/Licensed-Child-Care" target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-outline">
                ℹ️ Halton Region Child Care Info
              </a>
            </div>
          </div>

          <h2 className="admit-schools-title">Oakville Daycares &amp; Child Care ({schools.length})</h2>
          <p className="admit-schools-subtitle">Click any daycare to view details, ratings, and contact information.</p>
          <div className="admit-schools-list" role="list">
            {schools.map((school) => <SchoolRow key={school.id} school={school} />)}
          </div>
        </div>
      </div>
    </>
  );
}
