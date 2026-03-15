import { School } from '@/lib/api';

interface SchoolListProps {
  schools: School[];
}

export default function SchoolList({ schools }: SchoolListProps) {
  if (schools.length === 0) {
    return <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>No schools found.</p>;
  }

  return (
    <div className="school-grid">
      {schools.map((school) => (
        <a key={school.id} href={`/schools/${school.slug}`} className="school-card">
          <span className="badge">{school.school_type}</span>
          <h3>{school.name}</h3>
          <div className="meta">
            {school.address_line_1 && <span>{school.address_line_1}, {school.city}</span>}
            {school.phone && <span>{school.phone}</span>}
            {school.grades && <span>Grades: {school.grades}</span>}
            {school.age_range && <span>Ages: {school.age_range}</span>}
          </div>
        </a>
      ))}
    </div>
  );
}
