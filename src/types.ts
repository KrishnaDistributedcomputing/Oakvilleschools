export interface RawSchoolRecord {
  sourceName: string;
  rawName: string;
  rawAddress: string;
  rawPhone?: string;
  rawWebsite?: string;
  rawGrades?: string;
  rawPayload?: Record<string, unknown>;
}

export type SchoolType = 'public' | 'catholic' | 'private' | 'montessori' | 'daycare';

export interface NormalizedSchool {
  name: string;
  slug: string;
  schoolType: SchoolType;
  subtype?: string;
  operator?: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  grades?: string;
  ageRange?: string;
  licensed?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface SourceConfig {
  sourceId?: number;
  sourceName: string;
  sourceType: string;
  baseUrl: string;
  allowedMethod: 'http' | 'playwright' | 'download';
  refreshInterval: 'daily' | 'weekly' | 'monthly';
  rateLimitSeconds: number;
}

export interface CrawlJob {
  jobId: number;
  url: string;
  sourceId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
}

export interface Observation {
  schoolId: number;
  sourceId: number;
  observedName: string;
  observedAddress?: string;
  observedPhone?: string;
  observedWebsite?: string;
  sourceUrl: string;
  confidenceScore: number;
}
