import { Metadata } from 'next';
import { fetchStats, fetchSchools } from '@/lib/api';
import HomeSearch from '@/components/HomeSearch';

export const metadata: Metadata = {
  title: 'Oakville Schools Directory | Find the Best Schools in Oakville, Ontario',
  description: 'Search 259+ public, Catholic, private, Montessori schools and daycares in Oakville, Ontario. Compare ratings, read reviews, view hours & contact info. Updated 2026.',
  keywords: 'Oakville schools, Oakville public schools, Oakville Catholic schools, Oakville private schools, Oakville Montessori, Oakville daycares, HDSB schools, HCDSB schools, schools near me Oakville, best schools Oakville Ontario',
  openGraph: {
    title: 'Oakville Schools Directory — Find the Best School for Your Child',
    description: 'Comprehensive guide to 259+ schools in Oakville, ON. Public, Catholic, private, Montessori & daycare. Ratings, reviews, hours & directions.',
    url: 'https://ep-oakvilleschools-dge4fadcdedphcgw.b02.azurefd.net',
    siteName: 'Oakville Schools Directory',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oakville Schools Directory — 259+ Schools & Daycares',
    description: 'Search, compare & find the best schools in Oakville, Ontario.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://ep-oakvilleschools-dge4fadcdedphcgw.b02.azurefd.net' },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let stats = { total: 0, byType: [] as { school_type: string; count: string }[] };
  let topSchools: any[] = [];
  try {
    stats = await fetchStats();
  } catch {}
  try {
    const res = await fetchSchools({ limit: '500' });
    topSchools = res.data;
  } catch {}

  const typeColors: Record<string, string> = {
    public: '#2ecc71',
    catholic: '#9b59b6',
    private: '#e67e22',
    montessori: '#1abc9c',
    daycare: '#e74c3c',
  };

  const typeIcons: Record<string, string> = {
    public: '🏫',
    catholic: '⛪',
    private: '🎓',
    montessori: '🌱',
    daycare: '👶',
  };

  const typeDescriptions: Record<string, string> = {
    public: 'Halton District School Board (HDSB) schools serving JK-12 in Oakville',
    catholic: 'Halton Catholic District School Board (HCDSB) faith-based education',
    private: 'Independent schools offering specialized curricula and small class sizes',
    montessori: 'Child-centered Montessori method schools for ages 2-12',
    daycare: 'Licensed child care centers, nurseries & before/after school programs',
  };

  const typeLinks: Record<string, string> = {
    public: '/oakville-public-schools',
    catholic: '/oakville-catholic-schools',
    private: '/oakville-private-schools',
    montessori: '/oakville-montessori-schools',
    daycare: '/oakville-daycares',
  };

  return (
    <>
      {/* JSON-LD for AIO/GEO — Organization + WebSite with SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              name: 'Oakville Schools Directory',
              url: 'https://ep-oakvilleschools-dge4fadcdedphcgw.b02.azurefd.net',
              description: 'Comprehensive directory of 259+ schools and daycares in Oakville, Ontario, Canada.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://ep-oakvilleschools-dge4fadcdedphcgw.b02.azurefd.net/oakville-schools?search={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            },
            {
              '@type': 'Organization',
              name: 'Oakville Schools Directory',
              url: 'https://ep-oakvilleschools-dge4fadcdedphcgw.b02.azurefd.net',
              areaServed: { '@type': 'City', name: 'Oakville', containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario, Canada' } },
            },
            {
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How many schools are in Oakville, Ontario?',
                  acceptedAnswer: { '@type': 'Answer', text: `There are ${stats.total} schools and daycares in Oakville, Ontario, including public schools (HDSB), Catholic schools (HCDSB), private schools, Montessori schools, and licensed daycares.` },
                },
                {
                  '@type': 'Question',
                  name: 'What school boards serve Oakville?',
                  acceptedAnswer: { '@type': 'Answer', text: 'Oakville is served by the Halton District School Board (HDSB) for public schools and the Halton Catholic District School Board (HCDSB) for Catholic schools. There are also numerous private, Montessori, and independent schools.' },
                },
                {
                  '@type': 'Question',
                  name: 'What are the best-rated schools in Oakville?',
                  acceptedAnswer: { '@type': 'Answer', text: 'Many Oakville schools have excellent Google ratings of 4.0+. Use our directory to search, filter by rating, and compare schools side by side. Popular choices include Appleby College, Abbey Park High School, and Iroquois Ridge High School.' },
                },
              ],
            },
          ],
        })}}
      />

      {/* Hero Section with Search */}
      <section className="hero-section" aria-label="Find schools in Oakville">
        <div className="hero-bg">
          <h1>Find the Perfect School in <span className="hero-highlight">Oakville</span></h1>
          <p className="hero-desc">
            Search {stats.total}+ schools and daycares — public, Catholic, private, Montessori & child care.
            Compare ratings, read reviews, and find the right fit for your family.
          </p>

          {/* Homepage Search */}
          <HomeSearch schools={topSchools} />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar" aria-label="School statistics">
        <div className="stats-bar-inner">
          <div className="stat-pill">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-lbl">Total Schools</span>
          </div>
          {stats.byType.map((item) => (
            <a
              key={item.school_type}
              href={typeLinks[item.school_type] || '/oakville-schools'}
              className="stat-pill"
              style={{ borderColor: typeColors[item.school_type] || '#ccc' }}
              aria-label={`${item.count} ${item.school_type} schools`}
            >
              <span className="stat-icon">{typeIcons[item.school_type] || '📚'}</span>
              <span className="stat-num" style={{ color: typeColors[item.school_type] }}>{item.count}</span>
              <span className="stat-lbl">{item.school_type}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Category Cards */}
      <section className="home-categories" aria-label="Browse by school type">
        <h2 className="section-title">Browse Schools by Type</h2>
        <div className="category-grid">
          {stats.byType.map((item) => (
            <a
              key={item.school_type}
              href={typeLinks[item.school_type] || '/oakville-schools'}
              className="category-card-v2"
              style={{ '--accent': typeColors[item.school_type] || '#2980b9' } as React.CSSProperties}
              aria-label={`Browse ${item.count} ${item.school_type} schools`}
            >
              <div className="cat-icon">{typeIcons[item.school_type] || '📚'}</div>
              <div className="cat-body">
                <h3>{item.school_type === 'daycare' ? 'Daycares & Child Care' : `${item.school_type.charAt(0).toUpperCase() + item.school_type.slice(1)} Schools`}</h3>
                <p>{typeDescriptions[item.school_type] || ''}</p>
                <span className="cat-count">{item.count} listings →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* News & Updates — Admissions & Enrollment */}
      <section className="news-section" aria-label="Latest admissions and enrollment news">
        <h2 className="section-title">📰 Admissions & Enrollment Updates</h2>
        <p className="section-subtitle">Stay informed about registration deadlines, open houses, and enrollment news for Oakville schools.</p>
        <div className="news-grid">
          <article className="news-card news-urgent">
            <div className="news-tag">🔴 Deadline</div>
            <h3>HDSB Kindergarten Registration Now Open</h3>
            <p className="news-date">Updated March 2026</p>
            <p>Registration for Junior Kindergarten (JK) and Senior Kindergarten (SK) for the 2026-2027 school year is now open. Children born in 2022 are eligible for JK. Register online through the HDSB portal or visit your local school.</p>
            <a href="https://www.hdsb.ca/schools/Pages/Registration.aspx" target="_blank" rel="noopener noreferrer" className="news-link">
              Register at HDSB →
            </a>
          </article>

          <article className="news-card news-urgent">
            <div className="news-tag">🔴 Deadline</div>
            <h3>HCDSB Catholic School Registration</h3>
            <p className="news-date">Updated March 2026</p>
            <p>Halton Catholic District School Board is accepting registrations for new students. A Catholic baptismal certificate is required. French Immersion applications have separate deadlines — check your local school.</p>
            <a href="https://www.hcdsb.org" target="_blank" rel="noopener noreferrer" className="news-link">
              Visit HCDSB →
            </a>
          </article>

          <article className="news-card">
            <div className="news-tag">📅 Open Houses</div>
            <h3>Private School Open Houses — Spring 2026</h3>
            <p className="news-date">March — May 2026</p>
            <p>Many Oakville private schools hold spring open houses for prospective families. Appleby College, MacLachlan College, Fern Hill School, and St. Mildred&apos;s-Lightbourn offer tours and information sessions.</p>
            <a href="/oakville-private-schools" className="news-link">
              Browse Private Schools →
            </a>
          </article>

          <article className="news-card">
            <div className="news-tag">🌱 Montessori</div>
            <h3>Montessori Enrollment for Ages 2-6</h3>
            <p className="news-date">Ongoing</p>
            <p>Oakville Montessori schools accept rolling admissions for Casa (ages 2.5-6) and Elementary (ages 6-12) programs. Most schools offer tours by appointment. Spaces fill quickly for fall programs.</p>
            <a href="/oakville-montessori-schools" className="news-link">
              Browse Montessori Schools →
            </a>
          </article>

          <article className="news-card">
            <div className="news-tag">👶 Childcare</div>
            <h3>Licensed Daycare Waitlists</h3>
            <p className="news-date">Ongoing</p>
            <p>Oakville licensed daycares often have waitlists, especially for infant and toddler spots. Register early through Halton Region&apos;s OneList system at <strong>onelisthalton.ca</strong> to get on multiple waitlists.</p>
            <a href="/oakville-daycares" className="news-link">
              Browse Daycares →
            </a>
          </article>

          <article className="news-card">
            <div className="news-tag">🎓 Secondary</div>
            <h3>Grade 9 Transition — Course Selection</h3>
            <p className="news-date">Spring 2026</p>
            <p>Grade 8 students entering HDSB or HCDSB secondary schools should complete course selection through their school guidance office. Specialized programs (IB, AP, Arts) may have additional application requirements.</p>
            <a href="/oakville-public-schools" className="news-link">
              Browse Public Schools →
            </a>
          </article>
        </div>
      </section>

      {/* FAQ Section — visible for AIO/GEO crawlers */}
      <section className="faq-section" aria-label="Frequently asked questions">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          <details className="faq-item">
            <summary>How many schools are in Oakville, Ontario?</summary>
            <p>There are {stats.total} schools and daycares in Oakville, including public schools (HDSB), Catholic schools (HCDSB), private schools, Montessori schools, and licensed daycares.</p>
          </details>
          <details className="faq-item">
            <summary>What school boards serve Oakville?</summary>
            <p>Oakville is served by the <strong>Halton District School Board (HDSB)</strong> for public schools and the <strong>Halton Catholic District School Board (HCDSB)</strong> for Catholic schools. There are also numerous private and independent schools.</p>
          </details>
          <details className="faq-item">
            <summary>How do I find the best-rated school near me?</summary>
            <p>Use the search bar above to search by name, address, or grade. Filter by type and sort by &quot;Highest Rated&quot; to find schools with the best Google ratings and reviews.</p>
          </details>
          <details className="faq-item">
            <summary>Are the school ratings verified?</summary>
            <p>Ratings and reviews come from Google Places and are based on real parent, student, and community reviews. We update our data regularly to keep it current.</p>
          </details>
          <details className="faq-item">
            <summary>What age groups do Oakville daycares serve?</summary>
            <p>Oakville daycares serve children from infants (6 weeks) through school-age (12 years). Most licensed centers offer infant, toddler, preschool, and before/after school care programs.</p>
          </details>
          <details className="faq-item">
            <summary>Can I compare schools side by side?</summary>
            <p>Yes! Browse any category page, use the search and filter tools to narrow down your choices, then click into each school for detailed information including ratings, hours, contact info, and directions.</p>
          </details>
        </div>
      </section>
    </>
  );
}
