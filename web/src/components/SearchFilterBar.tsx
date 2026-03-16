'use client';

import { useState, useEffect, useCallback } from 'react';
import { School } from '@/lib/api';

interface SearchFilterBarProps {
  schools: School[];
  onFiltered: (filtered: School[]) => void;
  showTypeFilter?: boolean;
}

export default function SearchFilterBar({ schools, onFiltered, showTypeFilter = false }: SearchFilterBarProps) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const applyFilters = useCallback(() => {
    let filtered = [...schools];

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.address_line_1 || '').toLowerCase().includes(q) ||
          (s.operator || '').toLowerCase().includes(q) ||
          (s.categories || '').toLowerCase().includes(q) ||
          (s.grades || '').toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.school_type === typeFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter((s) => {
        const r = typeof s.rating === 'string' ? parseFloat(s.rating) : s.rating;
        return r != null && !isNaN(r) && r >= minRating;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating': {
          const ra = typeof a.rating === 'string' ? parseFloat(a.rating) : (a.rating || 0);
          const rb = typeof b.rating === 'string' ? parseFloat(b.rating) : (b.rating || 0);
          return (rb as number) - (ra as number);
        }
        case 'reviews':
          return (b.reviews_count || 0) - (a.reviews_count || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    onFiltered(filtered);
  }, [schools, query, sortBy, typeFilter, ratingFilter, onFiltered]);

  useEffect(() => {
    applyFilters();
    setPage(1);
  }, [applyFilters]);

  return (
    <div className="search-filter-bar" role="search" aria-label="Search and filter schools">
      {/* Search */}
      <div className="search-input-wrap">
        <label htmlFor="school-search" className="sr-only">Search schools</label>
        <svg className="search-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="school-search"
          type="search"
          placeholder="Search by name, address, grade..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search schools by name, address, or grade"
          autoComplete="off"
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="filter-row">
        {showTypeFilter && (
          <div className="filter-group">
            <label htmlFor="type-filter">Type</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by school type"
            >
              <option value="all">All Types</option>
              <option value="public">Public</option>
              <option value="catholic">Catholic</option>
              <option value="private">Private</option>
              <option value="montessori">Montessori</option>
              <option value="daycare">Daycare</option>
            </select>
          </div>
        )}

        <div className="filter-group">
          <label htmlFor="rating-filter">Rating</label>
          <select
            id="rating-filter"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            aria-label="Filter by minimum rating"
          >
            <option value="all">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-by">Sort by</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort schools"
          >
            <option value="name">Name (A-Z)</option>
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviewed</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* Pagination component */
export function Pagination({
  total,
  page,
  perPage,
  onPageChange,
}: {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav className="pagination" role="navigation" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ← Previous
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={page === p ? 'active' : ''}
            aria-label={`Page ${p}`}
            aria-current={page === p ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
