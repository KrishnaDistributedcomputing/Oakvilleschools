// Server-side: use API_URL (runtime env, not baked at build time)
// Client-side: use relative URL (Front Door / Next.js rewrites handle routing)
function getApiBase(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering — need the full URL to the API backend
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  // Client-side — use relative URL (Front Door routes /api/* to API backend)
  return '';
}

const API_BASE = getApiBase();

export interface School {
  id: number;
  name: string;
  slug: string;
  school_type: string;
  subtype: string | null;
  operator: string | null;
  address_line_1: string;
  city: string;
  province: string;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  grades: string | null;
  age_range: string | null;
  licensed: boolean | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviews_count: number | null;
  google_maps_url: string | null;
  description: string | null;
  image_url: string | null;
  categories: string | null;
  opening_hours: any | null;
}

export interface SchoolListResponse {
  data: School[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StatsResponse {
  total: number;
  byType: { school_type: string; count: string }[];
}

export async function fetchSchools(params: Record<string, string> = {}): Promise<SchoolListResponse> {
  const searchParams = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/api/schools?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch schools');
  return res.json();
}

export async function fetchSchoolBySlug(slug: string): Promise<{ data: School }> {
  const res = await fetch(`${API_BASE}/api/schools/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error('School not found');
  return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
