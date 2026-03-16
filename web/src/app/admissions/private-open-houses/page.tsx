import { Metadata } from 'next';
import { fetchSchools, School } from '@/lib/api';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Private School Open Houses Spring 2026 | Oakville Schools Directory',
  description: 'Oakville private school open houses and tours for Spring 2026. Appleby College, MacLachlan, Fern Hill, St. Mildred\'s and more. Dates, details, and school links.',
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
      </div>
    </a>
  );
}

export default async function PrivateOpenHousesPage() {
  let schools: School[] = [];
  try {
    const res = await fetchSchools({ type: 'private', limit: '500' });
    schools = res.data;
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Admissions', url: '/admissions' },
        { name: 'Private School Open Houses', url: '/admissions/private-open-houses' },
      ]} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span>Admissions</span> <span aria-hidden="true">/</span> <span aria-current="page">Private Open Houses</span>
      </nav>

      <div className="admit-page">
        <div className="admit-hero admit-hero-orange">
          <span className="admit-tag">📅 Spring 2026</span>
          <h1>Private School Open Houses</h1>
          <p>Tour Oakville&apos;s top private and independent schools. March through May 2026.</p>
        </div>

        <div className="admit-content">
          <div className="admit-summary">
            <h2>What to Expect at an Open House</h2>
            <div className="admit-info-grid">
              <div className="admit-info-card">
                <h3>🏫 Campus Tours</h3>
                <p>Walk through classrooms, science labs, libraries, gymnasiums, and outdoor spaces. Many schools offer student-led tours for an authentic perspective.</p>
              </div>
              <div className="admit-info-card">
                <h3>👩‍🏫 Meet Faculty</h3>
                <p>Speak directly with teachers, department heads, and school administrators. Ask about curriculum, class sizes, and teaching philosophy.</p>
              </div>
              <div className="admit-info-card">
                <h3>📝 Admissions Info</h3>
                <p>Learn about application deadlines, entrance assessments, tuition fees, financial aid, and scholarship opportunities.</p>
              </div>
              <div className="admit-info-card">
                <h3>💡 Tips for Parents</h3>
                <ul>
                  <li>Register on the school&apos;s website in advance</li>
                  <li>Bring your child along — student interaction matters</li>
                  <li>Prepare questions about class sizes, homework, and support services</li>
                  <li>Ask about transportation options</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="admit-schools-title">Oakville Private &amp; Independent Schools ({schools.length})</h2>
          <p className="admit-schools-subtitle">Click any school to view details, then visit their website for open house dates.</p>
          <div className="admit-schools-list" role="list">
            {schools.map((school) => <SchoolRow key={school.id} school={school} />)}
          </div>
        </div>
      </div>
    </>
  );
}
