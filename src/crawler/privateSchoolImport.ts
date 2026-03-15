import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../logger';
import { RawSchoolRecord } from '../types';
import { getSource, insertRawRecord, updateLastChecked, recordMetric } from './sourceRegistry';
import { normalizeAndSave } from '../parser/schoolParser';

dotenv.config();

// Ontario Open Data — Private Schools dataset (CSV/JSON)
const DATASET_URL = 'https://data.ontario.ca/api/3/action/datastore_search';
const RESOURCE_ID = 'private-schools-ontario'; // Replace with actual resource ID

interface PrivateSchoolRow {
  school_name: string;
  street_address: string;
  city: string;
  postal_code: string;
  phone: string;
  website?: string;
  operator?: string;
  grades?: string;
}

async function fetchDataset(): Promise<PrivateSchoolRow[]> {
  logger.info('Fetching Ontario Private Schools dataset...');

  const allRecords: PrivateSchoolRow[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(DATASET_URL, {
      params: {
        resource_id: RESOURCE_ID,
        limit,
        offset,
        filters: JSON.stringify({ city: 'Oakville' }),
      },
      timeout: 30000,
    });

    const records = response.data?.result?.records || [];
    allRecords.push(...records);
    hasMore = records.length === limit;
    offset += limit;
  }

  logger.info(`Fetched ${allRecords.length} private school records for Oakville`);
  return allRecords;
}

export async function importPrivateSchools(): Promise<void> {
  const source = await getSource('Ontario Private Schools');
  logger.info('Starting private school import');

  try {
    const records = await fetchDataset();

    for (const row of records) {
      try {
        const rawRecord: RawSchoolRecord = {
          sourceName: 'Ontario Private Schools',
          rawName: row.school_name,
          rawAddress: [row.street_address, row.city, row.postal_code].filter(Boolean).join(', '),
          rawPhone: row.phone,
          rawWebsite: row.website,
          rawGrades: row.grades,
          rawPayload: row as unknown as Record<string, unknown>,
        };

        const rawId = await insertRawRecord(source.sourceId, rawRecord);

        // Determine if Montessori based on name
        const isMontessori = row.school_name.toLowerCase().includes('montessori');
        const schoolType = isMontessori ? 'montessori' : 'private';

        await normalizeAndSave(rawRecord, source.sourceId, schoolType, row.operator);
        await recordMetric(source.sourceId, 'records_created');

        logger.info(`Imported private school: ${row.school_name} (raw_id: ${rawId})`);
      } catch (err) {
        logger.error(`Failed to import ${row.school_name}:`, err);
        await recordMetric(source.sourceId, 'crawl_failure');
      }
    }

    await updateLastChecked(source.sourceId);
    await recordMetric(source.sourceId, 'crawl_success');
    logger.info('Private school import completed');
  } catch (error) {
    logger.error('Private school import failed:', error);
    await recordMetric(source.sourceId, 'crawl_failure');
    throw error;
  }
}

if (require.main === module) {
  importPrivateSchools().catch((err) => {
    logger.error('Fatal error:', err);
    process.exit(1);
  });
}
