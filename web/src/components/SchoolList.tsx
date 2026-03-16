import { School } from '@/lib/api';

interface SchoolListProps {
  schools: School[];
}

function StarRating({ rating }: { rating: number | string }) {
  const r = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (!r || isNaN(r)) return null;
  const fullStars = Math.floor(r);
  const halfStar = r % 1 >= 0.5;
  return (
    <span className="star-rating" title={`${r} out of 5`}>
      {'\u2605'.repeat(fullStars)}
      {halfStar ? '\u00bd' : ''}
      {'\u2606'.repeat(5 - fullStars - (halfStar ? 1 : 0))}
      <span className="rating-number">{r.toFixed(1)}</span>
    </span>
  );
}

export default function SchoolList({ schools }: SchoolListProps) {
  if (schools.length === 0) {
    return <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>No schools found.</p>;
  }

  return (
    <div className="school-grid">
      {schools.map((school) => (
        <a key={school.id} href={`/schools/${school.slug}`} className="school-card">
          {school.image_url && (
            <div className="school-card-image">
              <img src={school.image_url} alt={school.name} loading="lazy" />
            </div>
          )}
          <div className="school-card-body">
            <div className="school-card-header">
              <span className="badge">{school.school_type}</span>
              {school.rating && <StarRating rating={school.rating} />}
            </div>
            <h3>{school.name}</h3>
            {school.categories && (
              <p className="school-categories">{school.categories}</p>
            )}
            <div className="meta">
              {school.address_line_1 && <span>📍 {school.address_line_1}, {school.city}</span>}
              {school.phone && <span>📞 {school.phone}</span>}
              {school.grades && <span>🎓 Grades: {school.grades}</span>}
              {school.age_range && <span>👶 Ages: {school.age_range}</span>}
              {school.reviews_count != null && school.reviews_count > 0 && (
                <span>💬 {school.reviews_count} reviews</span>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
