import { createClient } from '@supabase/supabase-js';

// Supabase client — uses env vars set in Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  principal_name: string | null;
  school_email: string | null;
  school_number: string | null;
  ossd_credits: string | null;
  program_type: string | null;
  association_membership: string | null;
  school_level: string | null;
  fax: string | null;
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
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '500', 10);
  const type = params.type;
  const search = params.search;
  const offset = (page - 1) * limit;

  let query = supabase.from('schools').select('*', { count: 'exact' });

  if (type) {
    query = query.eq('school_type', type);
  }
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query.order('name').range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    data: (data || []) as School[],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function fetchSchoolBySlug(slug: string): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw new Error(error.message);
  return data as School;
}

export async function fetchStats(): Promise<StatsResponse> {
  // Get total count
  const { count: total } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true });

  // Get counts by type using RPC or manual query
  const { data: schools } = await supabase
    .from('schools')
    .select('school_type');

  const typeCounts: Record<string, number> = {};
  (schools || []).forEach((s: any) => {
    typeCounts[s.school_type] = (typeCounts[s.school_type] || 0) + 1;
  });

  const byType = Object.entries(typeCounts)
    .map(([school_type, count]) => ({ school_type, count: String(count) }))
    .sort((a, b) => parseInt(b.count) - parseInt(a.count));

  return { total: total || 0, byType };
}
