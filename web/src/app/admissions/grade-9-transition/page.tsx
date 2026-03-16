import { Metadata } from 'next';
import { fetchSchools, School } from '@/lib/api';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Grade 9 Transition & Course Selection — Oakville Secondary Schools',
  description: 'Information for Oakville Grade 8 students transitioning to secondary school. Course selection, IB/AP programs, and Oakville high school listings.',
};

export const dynamic = 'force-dynamic';

function SchoolRow({ school }: { school: School }) {
  const r = typeof school.rating === 'string' ? parseFloat(school.rating) : school.rating;
  return (
    <a href={`/schools/${school.slug}`} className="admit-school-row">
      <div className="admit-school-info">
        <h3>{school.name}</h3>
        <p>{school.address_line_1 && school.address_line_1 !== 'Oakville, Ontario' ? school.address_line_1 : ''} {school.operator ? `• ${school.operator}` : ''}</p>
      </div>
      <div className="admit-school-meta">
        {school.grades && <span className="admit-badge">🎓 {school.grades}</span>}
        {r != null && !isNaN(r) && <span className="admit-badge admit-badge-gold">⭐ {r.toFixed(1)}</span>}
      </div>
    </a>
  );
}

export default async function Grade9TransitionPage() {
  let publicSecondary: School[] = [];
  let catholicSecondary: School[] = [];
  try {
    const pub = await fetchSchools({ type: 'public', limit: '500' });
    publicSecondary = pub.data.filter((s: School) => s.subtype === 'secondary' || (s.grades && s.grades.includes('9-12')));
    const cat = await fetchSchools({ type: 'catholic', limit: '500' });
    catholicSecondary = cat.data.filter((s: School) => s.subtype === 'secondary' || (s.grades && s.grades.includes('9-12')));
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Admissions', url: '/admissions' },
        { name: 'Grade 9 Transition', url: '/admissions/grade-9-transition' },
      ]} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span>Admissions</span> <span aria-hidden="true">/</span> <span aria-current="page">Grade 9 Transition</span>
      </nav>

      <div className="admit-page">
        <div className="admit-hero admit-hero-blue">
          <span className="admit-tag">🎓 Spring 2026</span>
          <h1>Grade 9 Transition &amp; Course Selection</h1>
          <p>Everything Grade 8 students and parents need to know about entering secondary school in Oakville.</p>
        </div>

        <div className="admit-content">
          <div className="admit-summary">
            <h2>What Parents &amp; Students Need to Know</h2>
            <div className="admit-info-grid">
              <div className="admit-info-card">
                <h3>📝 Course Selection</h3>
                <ul>
                  <li>Students choose courses through their Grade 8 guidance counsellor</li>
                  <li>Typically completed in February&ndash;March</li>
                  <li>8 credits per year (4 per semester) in most schools</li>
                  <li>Core subjects: English, Math, Science, French, Geography/History</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>🌟 Specialized Programs</h3>
                <ul>
                  <li><strong>IB (International Baccalaureate):</strong> Available at select HDSB schools</li>
                  <li><strong>AP (Advanced Placement):</strong> University-level courses</li>
                  <li><strong>Arts Programs:</strong> Enhanced visual arts, music, drama, dance</li>
                  <li><strong>SHSM:</strong> Specialist High Skills Major in various sectors</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>📅 Important Dates</h3>
                <ul>
                  <li><strong>January&ndash;February:</strong> Grade 8 info nights at secondary schools</li>
                  <li><strong>February&ndash;March:</strong> Course selection forms due</li>
                  <li><strong>April:</strong> Confirmation of course selections</li>
                  <li><strong>September 2026:</strong> First day of Grade 9</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>💡 Tips for Parents</h3>
                <ul>
                  <li>Attend the info night at your child&apos;s future secondary school</li>
                  <li>Discuss academic vs. applied course streams with guidance</li>
                  <li>Check if transportation/busing is provided for your address</li>
                  <li>Look into extra-curricular activities and sports programs</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="admit-schools-title">HDSB Public Secondary Schools ({publicSecondary.length})</h2>
          <div className="admit-schools-list" role="list">
            {publicSecondary.map((school) => <SchoolRow key={school.id} school={school} />)}
          </div>

          {catholicSecondary.length > 0 && (
            <>
              <h2 className="admit-schools-title">HCDSB Catholic Secondary Schools ({catholicSecondary.length})</h2>
              <div className="admit-schools-list" role="list">
                {catholicSecondary.map((school) => <SchoolRow key={school.id} school={school} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
