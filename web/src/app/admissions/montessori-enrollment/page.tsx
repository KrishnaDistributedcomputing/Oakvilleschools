import { Metadata } from 'next';
import { fetchSchools, School } from '@/lib/api';
import { BreadcrumbJsonLd } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Montessori School Enrollment in Oakville | Oakville Schools Directory',
  description: 'Enroll in Oakville Montessori schools. Casa, preschool, and elementary programs. Rolling admissions for ages 2-12. School listings with ratings and contact info.',
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

export default async function MontessoriEnrollmentPage() {
  let schools: School[] = [];
  try {
    const res = await fetchSchools({ type: 'montessori', limit: '500' });
    schools = res.data;
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Admissions', url: '/admissions' },
        { name: 'Montessori Enrollment', url: '/admissions/montessori-enrollment' },
      ]} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span>Admissions</span> <span aria-hidden="true">/</span> <span aria-current="page">Montessori Enrollment</span>
      </nav>

      <div className="admit-page">
        <div className="admit-hero admit-hero-teal">
          <span className="admit-tag">🌱 Rolling Admissions</span>
          <h1>Montessori School Enrollment</h1>
          <p>Child-centered education for ages 2-12. Oakville Montessori schools accept applications year-round.</p>
        </div>

        <div className="admit-content">
          <div className="admit-summary">
            <h2>About Montessori Education</h2>
            <div className="admit-info-grid">
              <div className="admit-info-card">
                <h3>🌱 The Montessori Method</h3>
                <p>Montessori education emphasizes hands-on, self-directed learning in mixed-age classrooms. Children work at their own pace with specially designed materials, developing independence and critical thinking.</p>
              </div>
              <div className="admit-info-card">
                <h3>👶 Age Groups</h3>
                <ul>
                  <li><strong>Toddler:</strong> 18 months &ndash; 2.5 years</li>
                  <li><strong>Casa (Preschool):</strong> 2.5 &ndash; 6 years</li>
                  <li><strong>Lower Elementary:</strong> 6 &ndash; 9 years</li>
                  <li><strong>Upper Elementary:</strong> 9 &ndash; 12 years</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>📝 How to Enroll</h3>
                <ul>
                  <li>Contact the school to schedule a tour</li>
                  <li>Most schools accept applications year-round</li>
                  <li>Fall programs fill up quickly — apply early (January&ndash;March)</li>
                  <li>Some offer trial/observation days for your child</li>
                </ul>
              </div>
              <div className="admit-info-card">
                <h3>💰 Tuition &amp; Fees</h3>
                <p>Montessori schools are privately operated. Tuition varies by school and program. Many offer sibling discounts and flexible payment plans. Contact each school directly for current rates.</p>
              </div>
            </div>
          </div>

          <h2 className="admit-schools-title">Oakville Montessori Schools ({schools.length})</h2>
          <div className="admit-schools-list" role="list">
            {schools.map((school) => <SchoolRow key={school.id} school={school} />)}
          </div>
        </div>
      </div>
    </>
  );
}
