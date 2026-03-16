'use client';

import { useState, useEffect } from 'react';
import { School } from '@/lib/api';

interface CompareToolProps {
  schools: School[];
}

export default function CompareTool({ schools }: CompareToolProps) {
  const [selected, setSelected] = useState<School[]>([]);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [search3, setSearch3] = useState('');
  const [drop1, setDrop1] = useState(false);
  const [drop2, setDrop2] = useState(false);
  const [drop3, setDrop3] = useState(false);

  const filterSchools = (q: string) => {
    if (q.length < 2) return [];
    const lower = q.toLowerCase();
    return schools.filter(s =>
      s.name.toLowerCase().includes(lower) &&
      !selected.find(sel => sel.id === s.id)
    ).slice(0, 6);
  };

  const addSchool = (school: School, slot: number) => {
    const newSelected = [...selected];
    newSelected[slot] = school;
    setSelected(newSelected);
    if (slot === 0) { setSearch1(school.name); setDrop1(false); }
    if (slot === 1) { setSearch2(school.name); setDrop2(false); }
    if (slot === 2) { setSearch3(school.name); setDrop3(false); }
  };

  const removeSchool = (slot: number) => {
    const newSelected = [...selected];
    newSelected.splice(slot, 1);
    setSelected(newSelected);
    if (slot === 0) setSearch1('');
    if (slot === 1) setSearch2('');
    if (slot === 2) setSearch3('');
  };

  const parseRating = (r: any) => {
    if (r == null) return null;
    const n = typeof r === 'string' ? parseFloat(r) : r;
    return isNaN(n) ? null : n;
  };

  const searches = [
    { val: search1, set: setSearch1, drop: drop1, setDrop: setDrop1 },
    { val: search2, set: setSearch2, drop: drop2, setDrop: setDrop2 },
    { val: search3, set: setSearch3, drop: drop3, setDrop: setDrop3 },
  ];

  const compareFields = [
    { label: 'Type', key: 'school_type', icon: '🏫' },
    { label: 'Level', key: 'school_level', icon: '📊', fallback: 'subtype' },
    { label: 'Grades', key: 'grades', icon: '🎓' },
    { label: 'Rating', key: 'rating', icon: '⭐', format: (v: any) => { const r = parseRating(v); return r ? `${r.toFixed(1)} / 5` : '—'; } },
    { label: 'Reviews', key: 'reviews_count', icon: '💬', format: (v: any) => v ? `${v} reviews` : '—' },
    { label: 'Operator / Board', key: 'operator', icon: '🏛️' },
    { label: 'Principal', key: 'principal_name', icon: '👤' },
    { label: 'Address', key: 'address_line_1', icon: '📍' },
    { label: 'Phone', key: 'phone', icon: '📞' },
    { label: 'Email', key: 'school_email', icon: '📧' },
    { label: 'Website', key: 'website', icon: '🌐', format: (v: any) => v ? v.replace(/^https?:\/\/(www\.)?/, '').slice(0, 35) : '—' },
    { label: 'OSSD Credits', key: 'ossd_credits', icon: '📜', format: (v: any) => v ? (v.includes('Offers') ? '✅ Yes' : v.includes('Applied') ? '⏳ Applied' : '—') : '—' },
    { label: 'Program Type', key: 'program_type', icon: '💻' },
    { label: 'Accreditation', key: 'association_membership', icon: '🤝', format: (v: any) => v && v !== 'No Association Membership' ? v : '—' },
    { label: 'Categories', key: 'categories', icon: '📂' },
    { label: 'Age Range', key: 'age_range', icon: '👶' },
    { label: 'Licensed', key: 'licensed', icon: '✅', format: (v: any) => v === true ? 'Yes' : v === false ? 'No' : '—' },
    { label: 'Opening Hours', key: 'opening_hours', icon: '🕐', format: (v: any) => v ? 'Available' : '—' },
    { label: 'Google Maps', key: 'google_maps_url', icon: '🗺️', format: (v: any) => v ? 'View →' : '—' },
  ];

  return (
    <div className="compare-tool">
      {/* School Selection */}
      <div className="compare-selectors">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="compare-selector">
            <label htmlFor={`compare-search-${slot}`}>School {slot + 1}</label>
            <div className="compare-search-wrap">
              <input
                id={`compare-search-${slot}`}
                type="search"
                placeholder="Type school name..."
                value={searches[slot].val}
                onChange={(e) => { searches[slot].set(e.target.value); searches[slot].setDrop(true); }}
                onFocus={() => searches[slot].setDrop(true)}
                aria-label={`Search for school ${slot + 1} to compare`}
                autoComplete="off"
              />
              {selected[slot] && (
                <button className="compare-remove" onClick={() => removeSchool(slot)} aria-label="Remove school" type="button">✕</button>
              )}
            </div>
            {searches[slot].drop && filterSchools(searches[slot].val).length > 0 && (
              <ul className="compare-dropdown" role="listbox">
                {filterSchools(searches[slot].val).map((s) => (
                  <li key={s.id} role="option">
                    <button onClick={() => addSchool(s, slot)} type="button">
                      <span className="compare-dd-badge" style={{ background: getBadgeColor(s.school_type) }}>{s.school_type}</span>
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {selected.length >= 2 && (
        <div className="compare-table-wrap" role="table" aria-label="School comparison">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                {selected.map((s, i) => (
                  <th key={i} scope="col">
                    <a href={`/schools/${s.slug}`} className="compare-school-name">{s.name}</a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map((field) => {
                const hasData = selected.some((s: any) => {
                  const val = s[field.key] || (field.fallback ? s[field.fallback as string] : null);
                  return val != null && val !== '' && val !== 'No Association Membership';
                });
                if (!hasData) return null;
                return (
                  <tr key={field.key}>
                    <td className="compare-label">{field.icon} {field.label}</td>
                    {selected.map((s: any, i) => {
                      const val = s[field.key] || (field.fallback ? s[field.fallback as string] : null);
                      const display = field.format ? field.format(val) : (val || '—');
                      return <td key={i}>{display}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected.length < 2 && (
        <div className="compare-placeholder">
          <p>Select at least 2 schools above to compare them side by side.</p>
          <p className="compare-hint">Compare ratings, programs, contact info, and more.</p>
        </div>
      )}
    </div>
  );
}

function getBadgeColor(type: string): string {
  const colors: Record<string, string> = { public: '#2ecc71', catholic: '#9b59b6', private: '#e67e22', montessori: '#1abc9c', daycare: '#e74c3c' };
  return colors[type] || '#2980b9';
}
