'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
}

export default function Pagination({ page, totalPages, basePath }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => goTo(page - 1)}>Previous</button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = i + 1;
        return (
          <button key={p} className={p === page ? 'active' : ''} onClick={() => goTo(p)}>
            {p}
          </button>
        );
      })}
      {totalPages > 7 && <span>...</span>}
      <button disabled={page >= totalPages} onClick={() => goTo(page + 1)}>Next</button>
    </div>
  );
}
