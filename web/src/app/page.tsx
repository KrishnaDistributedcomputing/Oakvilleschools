import { fetchStats } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let stats = { total: 0, byType: [] as { school_type: string; count: string }[] };
  try {
    stats = await fetchStats();
  } catch {
    // API may not be running yet
  }

  return (
    <>
      <div className="hero">
        <h1>Oakville Schools Directory</h1>
        <p className="page-subtitle">
          Comprehensive directory of public, Catholic, private, Montessori schools and daycares in Oakville, Ontario.
        </p>
        <div className="stats-row">
          <div className="stat-card">
            <div className="number">{stats.total}</div>
            <div className="label">Total Schools</div>
          </div>
          {stats.byType.map((item) => (
            <div key={item.school_type} className="stat-card">
              <div className="number">{item.count}</div>
              <div className="label">{item.school_type}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="school-grid" style={{ marginTop: '2rem' }}>
        <a href="/oakville-public-schools" className="school-card">
          <h3>Public Schools</h3>
          <div className="meta">Halton District School Board schools serving Oakville</div>
        </a>
        <a href="/oakville-catholic-schools" className="school-card">
          <h3>Catholic Schools</h3>
          <div className="meta">Halton Catholic District School Board schools</div>
        </a>
        <a href="/oakville-private-schools" className="school-card">
          <h3>Private Schools</h3>
          <div className="meta">Independent and private schools in Oakville</div>
        </a>
        <a href="/oakville-montessori-schools" className="school-card">
          <h3>Montessori Schools</h3>
          <div className="meta">Montessori programs and schools</div>
        </a>
        <a href="/oakville-daycares" className="school-card">
          <h3>Daycares &amp; Child Care</h3>
          <div className="meta">Licensed child care centers and daycares</div>
        </a>
      </div>
    </>
  );
}
