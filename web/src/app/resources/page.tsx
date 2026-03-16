import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parent Resources — Oakville Schools | Registration, Transportation, EQAO',
  description: 'Essential resources for Oakville parents: school board contacts, registration links, transportation info, EQAO results, school boundaries, special education, and French Immersion.',
};

export default function ResourcesPage() {
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span aria-current="page">Parent Resources</span>
      </nav>
      <h1 className="page-title">Parent Resources</h1>
      <p className="page-subtitle">
        Everything parents, students, and educators need — school board contacts, registration, transportation, academic data, and more.
      </p>

      {/* School Boards */}
      <section className="resource-section">
        <h2 className="resource-heading">🏛️ School Boards Serving Oakville</h2>
        <div className="resource-card-grid">
          <div className="resource-card resource-card-green">
            <h3>Halton District School Board (HDSB)</h3>
            <p>Public schools serving JK–12 in Oakville, Burlington, Milton, and Halton Hills.</p>
            <ul>
              <li><strong>Website:</strong> <a href="https://www.hdsb.ca" target="_blank" rel="noopener noreferrer">hdsb.ca</a></li>
              <li><strong>Phone:</strong> <a href="tel:9058753200">(905) 875-3200</a></li>
              <li><strong>Registration:</strong> <a href="https://www.hdsb.ca/schools/Pages/Registration.aspx" target="_blank" rel="noopener noreferrer">Online Registration</a></li>
              <li><strong>Find Your School:</strong> <a href="https://www.hdsb.ca/schools/school-directory/" target="_blank" rel="noopener noreferrer">School Locator</a></li>
              <li><strong>Transportation:</strong> <a href="https://www.hdsb.ca/schools/Pages/Transportation.aspx" target="_blank" rel="noopener noreferrer">Student Transportation</a></li>
            </ul>
          </div>
          <div className="resource-card resource-card-purple">
            <h3>Halton Catholic District School Board (HCDSB)</h3>
            <p>Catholic schools serving JK–12 across the Halton Region.</p>
            <ul>
              <li><strong>Website:</strong> <a href="https://www.hcdsb.org" target="_blank" rel="noopener noreferrer">hcdsb.org</a></li>
              <li><strong>Phone:</strong> <a href="tel:9056326300">(905) 632-6300</a></li>
              <li><strong>Registration:</strong> <a href="https://www.hcdsb.org" target="_blank" rel="noopener noreferrer">Registration Info</a></li>
              <li><strong>Requirement:</strong> Catholic Baptismal Certificate</li>
              <li><strong>Transportation:</strong> <a href="https://www.haltonbus.ca" target="_blank" rel="noopener noreferrer">Halton Student Transportation</a></li>
            </ul>
          </div>
          <div className="resource-card resource-card-blue">
            <h3>Conseil scolaire Viamonde</h3>
            <p>French-language public schools in the Greater Toronto and Halton area.</p>
            <ul>
              <li><strong>Website:</strong> <a href="https://csviamonde.ca" target="_blank" rel="noopener noreferrer">csviamonde.ca</a></li>
              <li><strong>Phone:</strong> <a href="tel:4163973000">(416) 397-3000</a></li>
              <li><strong>Eligibility:</strong> French-language education rights holders under Section 23 of the Charter</li>
            </ul>
          </div>
          <div className="resource-card resource-card-blue">
            <h3>Conseil scolaire catholique MonAvenir</h3>
            <p>French-language Catholic schools in the GTA region.</p>
            <ul>
              <li><strong>Website:</strong> <a href="https://cscmonavenir.ca" target="_blank" rel="noopener noreferrer">cscmonavenir.ca</a></li>
              <li><strong>Phone:</strong> <a href="tel:4163978000">(416) 397-8000</a></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Registration & Enrollment */}
      <section className="resource-section">
        <h2 className="resource-heading">📋 Registration &amp; Enrollment</h2>
        <div className="resource-card-grid">
          <div className="resource-card">
            <h3>New Student Registration</h3>
            <ul>
              <li><a href="/admissions/hdsb-kindergarten">HDSB Kindergarten Registration</a></li>
              <li><a href="/admissions/hcdsb-registration">HCDSB Catholic School Registration</a></li>
              <li><a href="/admissions/grade-9-transition">Grade 9 Transition Guide</a></li>
              <li><a href="/admissions/private-open-houses">Private School Open Houses</a></li>
              <li><a href="/admissions/montessori-enrollment">Montessori Enrollment</a></li>
              <li><a href="/admissions/daycare-waitlists">Daycare Waitlists (OneList)</a></li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Documents You&apos;ll Need</h3>
            <ul>
              <li>Child&apos;s birth certificate or passpoort</li>
              <li>Proof of address (utility bill, lease, tax bill)</li>
              <li>Immunization records (Halton Region Public Health)</li>
              <li>Previous school records / Ontario Student Record</li>
              <li>Catholic Baptismal Certificate (HCDSB only)</li>
              <li>Custody agreement (if applicable)</li>
              <li>Immigration documents (if applicable)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Academic Performance & Testing */}
      <section className="resource-section">
        <h2 className="resource-heading">📊 Academic Performance &amp; Testing</h2>
        <div className="resource-card-grid">
          <div className="resource-card">
            <h3>EQAO — Ontario Standardized Testing</h3>
            <p>The Education Quality and Accountability Office administers province-wide tests in reading, writing, and math.</p>
            <ul>
              <li><strong>Grade 3 &amp; 6:</strong> Reading, Writing, Mathematics</li>
              <li><strong>Grade 9:</strong> Mathematics (EQAO Math)</li>
              <li><strong>Grade 10:</strong> Ontario Secondary School Literacy Test (OSSLT)</li>
              <li><a href="https://www.eqao.com/the-assessments/find-my-school/" target="_blank" rel="noopener noreferrer">Find My School&apos;s Results on EQAO →</a></li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Fraser Institute School Rankings</h3>
            <p>Annual ranking of Ontario elementary and secondary schools based on EQAO results.</p>
            <ul>
              <li><a href="https://www.compareschools.ca" target="_blank" rel="noopener noreferrer">Compare Schools — Fraser Institute →</a></li>
              <li>Rankings based on: EQAO scores, gender gap, ESL percentage</li>
              <li>Available for public and Catholic schools</li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Ontario School Information Finder</h3>
            <p>Official Ontario Ministry of Education tool with enrollment numbers, demographics, and school profiles.</p>
            <ul>
              <li><a href="https://www.app.edu.gov.on.ca/eng/sift/indexSift.asp" target="_blank" rel="noopener noreferrer">School Information Finder →</a></li>
              <li>Student enrollment, staffing ratios, demographics</li>
              <li>Available for all publicly funded schools</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="resource-section">
        <h2 className="resource-heading">🎓 Specialized Programs in Oakville</h2>
        <div className="resource-card-grid">
          <div className="resource-card">
            <h3>French Immersion</h3>
            <p>Both HDSB and HCDSB offer French Immersion starting in Grade 1 at select schools. Early and Late (Grade 4) entry options available.</p>
            <ul>
              <li><strong>HDSB:</strong> <a href="https://www.hdsb.ca/programs/french-immersion/" target="_blank" rel="noopener noreferrer">French Immersion Program</a></li>
              <li>Separate application required (usually January)</li>
              <li>50% French / 50% English instruction in early years</li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>International Baccalaureate (IB)</h3>
            <p>Rigorous internationally recognized program offered at select Oakville secondary schools.</p>
            <ul>
              <li>Middle Years Programme (MYP): Grades 6-10</li>
              <li>Diploma Programme (DP): Grades 11-12</li>
              <li>Admission by application with academic requirements</li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Advanced Placement (AP)</h3>
            <p>University-level courses offered at select HDSB secondary schools.</p>
            <ul>
              <li>AP courses in: Math, Science, English, History, Languages</li>
              <li>Scores of 4-5 may earn university credit</li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Special Education &amp; Support</h3>
            <p>Both school boards provide special education services for students with learning differences.</p>
            <ul>
              <li>Individual Education Plans (IEPs)</li>
              <li>Gifted programs</li>
              <li>Learning disability support</li>
              <li>English as a Second Language (ESL)</li>
              <li><a href="https://www.hdsb.ca/programs/special-education/" target="_blank" rel="noopener noreferrer">HDSB Special Education →</a></li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Before &amp; After School Care</h3>
            <p>Most elementary schools offer before and after school programs through third-party operators.</p>
            <ul>
              <li>Typical hours: 7:00 AM – 9:00 AM and 3:30 PM – 6:00 PM</li>
              <li>Available for JK through Grade 6</li>
              <li>Register through your school or the care provider</li>
              <li>Fee subsidy available through Halton Region</li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>SHSM — Specialist High Skills Major</h3>
            <p>Secondary school program allowing students to focus on a specific industry sector while completing their OSSD.</p>
            <ul>
              <li>Sectors: Health, STEM, Business, Arts, Environment, etc.</li>
              <li>Includes co-op placements and certifications</li>
              <li>Available at most HDSB and HCDSB secondary schools</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Transportation */}
      <section className="resource-section">
        <h2 className="resource-heading">🚌 Transportation</h2>
        <div className="resource-card-grid">
          <div className="resource-card">
            <h3>Halton Student Transportation Services</h3>
            <p>School bus service for HDSB and HCDSB students who live beyond walking distance.</p>
            <ul>
              <li><a href="https://www.haltonbus.ca" target="_blank" rel="noopener noreferrer">haltonbus.ca</a> — route lookup, delays, cancellations</li>
              <li><strong>Elementary:</strong> Bus provided if you live &gt; 1.6 km from school</li>
              <li><strong>Secondary:</strong> Bus provided if you live &gt; 3.2 km from school</li>
              <li><strong>Oakville Transit:</strong> Student passes available through <a href="https://www.oakvilletransit.ca" target="_blank" rel="noopener noreferrer">Oakville Transit</a></li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>School Boundary Tool</h3>
            <p>Find out which public or Catholic school serves your address:</p>
            <ul>
              <li><a href="https://www.hdsb.ca/schools/school-directory/" target="_blank" rel="noopener noreferrer">HDSB — Find Your School</a></li>
              <li><a href="https://www.hcdsb.org/our-schools/" target="_blank" rel="noopener noreferrer">HCDSB — School Locator</a></li>
              <li>Private / Montessori schools: no boundaries — open enrollment</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Key Contacts */}
      <section className="resource-section">
        <h2 className="resource-heading">📞 Key Contacts</h2>
        <div className="resource-card-grid">
          <div className="resource-card">
            <h3>Town of Oakville</h3>
            <ul>
              <li><a href="https://www.oakville.ca" target="_blank" rel="noopener noreferrer">oakville.ca</a></li>
              <li>Recreation &amp; parks programs: <a href="tel:9058456601">(905) 845-6601</a></li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Halton Region</h3>
            <ul>
              <li><a href="https://www.halton.ca" target="_blank" rel="noopener noreferrer">halton.ca</a></li>
              <li>Public Health (immunizations): <a href="tel:9058257047">(905) 825-6000</a></li>
              <li>Child care fee subsidy: <a href="tel:3112311">(311)</a></li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Ontario Ministry of Education</h3>
            <ul>
              <li><a href="https://www.ontario.ca/page/education-ontario" target="_blank" rel="noopener noreferrer">ontario.ca/education</a></li>
              <li>Private school registry, curriculum standards</li>
              <li>Special education policy &amp; funding</li>
            </ul>
          </div>
          <div className="resource-card">
            <h3>Oakville Public Library</h3>
            <ul>
              <li><a href="https://www.opl.ca" target="_blank" rel="noopener noreferrer">opl.ca</a></li>
              <li>Free tutoring programs, homework help, study spaces</li>
              <li>Children&apos;s &amp; teen programs</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Browse CTA */}
      <section className="resource-cta">
        <h2>Ready to Find a School?</h2>
        <p>Search, filter, and browse 280+ schools and daycares in Oakville.</p>
        <a href="/oakville-schools" className="cta-btn cta-btn-primary">🔍 Browse All Schools →</a>
      </section>
    </>
  );
}
