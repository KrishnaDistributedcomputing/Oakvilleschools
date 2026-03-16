'use client';

import { useState, useRef, useEffect } from 'react';
import { School } from '@/lib/api';

interface HomeSearchProps {
  schools: School[];
}

export default function HomeSearch({ schools }: HomeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<School[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const matched = schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.address_line_1 || '').toLowerCase().includes(q) ||
        (s.operator || '').toLowerCase().includes(q) ||
        (s.categories || '').toLowerCase().includes(q) ||
        (s.school_type || '').toLowerCase().includes(q) ||
        (s.grades || '').toLowerCase().includes(q)
    ).slice(0, 8);
    setResults(matched);
    setIsOpen(matched.length > 0);
  }, [query, schools]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/oakville-schools?search=${encodeURIComponent(query)}`;
    }
  };

  return (
    <div className="home-search-wrap" ref={wrapRef} role="search" aria-label="Search schools">
      <form onSubmit={handleSubmit} className="home-search-form">
        <div className="home-search-input-group">
          <span className="home-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search schools by name, address, type, or grade..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            aria-label="Search for a school in Oakville"
            aria-expanded={isOpen}
            aria-controls="search-results"
            autoComplete="off"
          />
          <button type="submit" className="home-search-btn" aria-label="Search">
            Search
          </button>
        </div>
      </form>

      {/* Quick filter chips */}
      <div className="quick-filters" role="group" aria-label="Quick search examples">
        <span className="qf-label">Try:</span>
        {['Elementary', 'High School', 'Montessori', 'French Immersion', 'Daycare', 'JK-8'].map((term) => (
          <button
            key={term}
            className="qf-chip"
            onClick={() => setQuery(term)}
            aria-label={`Search for ${term}`}
          >
            {term}
          </button>
        ))}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <ul id="search-results" className="home-search-dropdown" role="listbox" aria-label="Search suggestions">
          {results.map((school) => (
            <li key={school.id} role="option">
              <a href={`/schools/${school.slug}`} className="search-result-item">
                <div className="search-result-name">
                  <span className="search-result-badge" style={{ background: getBadgeColor(school.school_type) }}>
                    {school.school_type}
                  </span>
                  {school.name}
                </div>
                <div className="search-result-meta">
                  {school.address_line_1 && school.address_line_1 !== 'Oakville, Ontario' && (
                    <span>📍 {school.address_line_1}</span>
                  )}
                  {school.rating && (
                    <span>⭐ {typeof school.rating === 'string' ? school.rating : school.rating.toFixed(1)}</span>
                  )}
                </div>
              </a>
            </li>
          ))}
          <li className="search-result-all" role="option">
            <a href={`/oakville-schools?search=${encodeURIComponent(query)}`}>
              View all results for &quot;{query}&quot; →
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}

function getBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    public: '#2ecc71',
    catholic: '#9b59b6',
    private: '#e67e22',
    montessori: '#1abc9c',
    daycare: '#e74c3c',
  };
  return colors[type] || '#2980b9';
}
