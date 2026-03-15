import { query } from '../db/pool';
import { SourceConfig } from '../types';
import logger from '../logger';

const DEFAULT_SOURCES: SourceConfig[] = [
  {
    sourceName: 'HDSB',
    sourceType: 'school_board',
    baseUrl: 'https://www.hdsb.ca',
    allowedMethod: 'http',
    refreshInterval: 'weekly',
    rateLimitSeconds: 3,
  },
  {
    sourceName: 'HCDSB',
    sourceType: 'school_board',
    baseUrl: 'https://www.hcdsb.org',
    allowedMethod: 'http',
    refreshInterval: 'weekly',
    rateLimitSeconds: 3,
  },
  {
    sourceName: 'Ontario Private Schools',
    sourceType: 'government_dataset',
    baseUrl: 'https://data.ontario.ca',
    allowedMethod: 'download',
    refreshInterval: 'monthly',
    rateLimitSeconds: 5,
  },
  {
    sourceName: 'Ontario Child Care Finder',
    sourceType: 'childcare_finder',
    baseUrl: 'https://www.ontario.ca/page/find-child-care',
    allowedMethod: 'http',
    refreshInterval: 'weekly',
    rateLimitSeconds: 5,
  },
];

export async function getSource(sourceName: string): Promise<SourceConfig & { sourceId: number }> {
  const result = await query(
    'SELECT source_id, source_name, source_type, base_url, allowed_method, refresh_interval, rate_limit_seconds FROM sources WHERE source_name = $1',
    [sourceName]
  );
  if (result.rows.length === 0) {
    throw new Error(`Source not found: ${sourceName}`);
  }
  const row = result.rows[0];
  return {
    sourceId: row.source_id,
    sourceName: row.source_name,
    sourceType: row.source_type,
    baseUrl: row.base_url,
    allowedMethod: row.allowed_method,
    refreshInterval: row.refresh_interval,
    rateLimitSeconds: row.rate_limit_seconds,
  };
}

export async function getAllSources(): Promise<(SourceConfig & { sourceId: number })[]> {
  const result = await query(
    'SELECT source_id, source_name, source_type, base_url, allowed_method, refresh_interval, rate_limit_seconds FROM sources ORDER BY source_id'
  );
  return result.rows.map((row) => ({
    sourceId: row.source_id,
    sourceName: row.source_name,
    sourceType: row.source_type,
    baseUrl: row.base_url,
    allowedMethod: row.allowed_method,
    refreshInterval: row.refresh_interval,
    rateLimitSeconds: row.rate_limit_seconds,
  }));
}

export async function updateLastChecked(sourceId: number): Promise<void> {
  await query('UPDATE sources SET last_checked = NOW(), updated_at = NOW() WHERE source_id = $1', [sourceId]);
}

export async function insertRawRecord(
  sourceId: number,
  record: {
    rawName: string;
    rawAddress?: string;
    rawPhone?: string;
    rawWebsite?: string;
    rawGrades?: string;
    rawPayload?: Record<string, unknown>;
  }
): Promise<number> {
  const result = await query(
    `INSERT INTO raw_records (source_id, raw_name, raw_address, raw_phone, raw_website, raw_grades, raw_payload_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      sourceId,
      record.rawName,
      record.rawAddress || null,
      record.rawPhone || null,
      record.rawWebsite || null,
      record.rawGrades || null,
      record.rawPayload ? JSON.stringify(record.rawPayload) : null,
    ]
  );
  return result.rows[0].id;
}

export async function recordMetric(
  sourceId: number | null,
  metricName: string,
  metricValue: number = 1
): Promise<void> {
  await query(
    'INSERT INTO crawl_metrics (source_id, metric_name, metric_value) VALUES ($1, $2, $3)',
    [sourceId, metricName, metricValue]
  );
}

export { DEFAULT_SOURCES };
