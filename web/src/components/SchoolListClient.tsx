'use client';

import { useState, useCallback } from 'react';
import { School } from '@/lib/api';
import SearchFilterBar, { Pagination } from './SearchFilterBar';
import ShareLike from './ShareLike';

interface SchoolListClientProps {
  schools: School[];
  showTypeFilter?: boolean;
}

function StarRating({ rating }: { rating: number | string | null }) {
  const r = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (!r || isNaN(r)) return null;
  const fullStars = Math.floor(r);
  const halfStar = r % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <span className="star-rating" title={`${r.toFixed(1)} out of 5 stars`} role="img" aria-label={`Rating: ${r.toFixed(1)} out of 5 stars`}>
      <span aria-hidden="true">
        {'★'.repeat(fullStars)}
        {halfStar ? '½' : ''}
        {'☆'.repeat(emptyStars)}
      </span>
      <span className="rating-number">{r.toFixed(1)}</span>
    </span>
  );
}

export default function SchoolListClient({ schools, showTypeFilter = false }: SchoolListClientProps) {
  const [filtered, setFiltered] = useState<School[]>(schools);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const handleFiltered = useCallback((f: School[]) => {
    setFiltered(f);
    setPage(1);
  }, []);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <SearchFilterBar schools={schools} onFiltered={handleFiltered} showTypeFilter={showTypeFilter} />

      {/* Results count */}
      <div className="results-summary" role="status" aria-live="polite">
        Showing {paged.length} of {filtered.length} schools
        {filtered.length !== schools.length && ` (filtered from ${schools.length} total)`}
      </div>

      {paged.length === 0 ? (
        <div className="no-results" role="status">
          <p>No schools match your search criteria.</p>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="school-grid" role="list">
          {paged.map((school) => (
            <a
              key={school.id}
              href={`/schools/${school.slug}`}
              className="school-card"
              role="listitem"
              aria-label={`${school.name} — ${school.school_type} school${school.rating ? `, rated ${typeof school.rating === 'string' ? school.rating : school.rating?.toFixed(1)} stars` : ''}`}
            >
              {school.image_url && (
                <div className="school-card-image">
                  <img src={school.image_url} alt="" loading="lazy" />
                </div>
              )}
              <div className="school-card-body">
                <div className="school-card-header">
                  <span className="badge" aria-label={`School type: ${school.school_type}`}>{school.school_type}</span>
                  {school.subtype && school.subtype !== school.school_type && (
                    <span className="badge badge-outline">{school.subtype}</span>
                  )}
                  <StarRating rating={school.rating} />
                </div>
                <h3>{school.name}</h3>
                {school.categories && (
                  <p className="school-categories">{school.categories}</p>
                )}
                <div className="meta">
                  {school.address_line_1 && school.address_line_1 !== 'Oakville, Ontario' && (
                    <span aria-label={`Address: ${school.address_line_1}`}>📍 {school.address_line_1}</span>
                  )}
                  {school.phone && (
                    <span aria-label={`Phone: ${school.phone}`}>📞 {school.phone}</span>
                  )}
                  {school.grades && (
                    <span aria-label={`Grades: ${school.grades}`}>🎓 {school.grades}</span>
                  )}
                  {school.age_range && (
                    <span aria-label={`Age range: ${school.age_range}`}>👶 {school.age_range}</span>
                  )}
                  {school.reviews_count != null && school.reviews_count > 0 && (
                    <span aria-label={`${school.reviews_count} reviews`}>💬 {school.reviews_count} reviews</span>
                  )}
                </div>
                <ShareLike schoolName={school.name} schoolSlug={school.slug} compact />
              </div>
            </a>
          ))}
        </div>
      )}

      <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} />
    </>
  );
}
