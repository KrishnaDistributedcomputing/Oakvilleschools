import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import logger from '../logger';
import { RawSchoolRecord } from '../types';
import { getSource, insertRawRecord, updateLastChecked, recordMetric } from './sourceRegistry';
import { isAllowed, isDomainAllowed, sleep } from './compliance';
import { normalizeAndSave } from '../parser/schoolParser';

dotenv.config();

const CHILDCARE_URL = 'https://www.ontario.ca/page/find-child-care';
const RATE_LIMIT_MS = parseInt(process.env.RATE_LIMIT_CHILDCARE || '5000', 10);

interface ChildcareRecord {
  name: string;
  address: string;
  licenseStatus?: string;
  ageRange?: string;
  phone?: string;
  website?: string;
}

async function fetchChildcareListings(): Promise<ChildcareRecord[]> {
  if (!isDomainAllowed(CHILDCARE_URL)) {
    throw new Error('Domain not in allowlist');
  }

  const allowed = await isAllowed(CHILDCARE_URL);
  if (!allowed) {
    throw new Error('robots.txt disallows this URL');
  }

  logger.info('Fetching Ontario Child Care listings for Oakville...');

  // The child care finder may use an API or rendered page.
  // This implementation attempts the page scrape; Playwright fallback available.
  const response = await axios.get(CHILDCARE_URL, {
    timeout: 30000,
    headers: { 'User-Agent': 'OakvilleSchoolsDirectory/1.0 (educational project)' },
    params: { city: 'Oakville' },
  });

  const $ = cheerio.load(response.data);
  const records: ChildcareRecord[] = [];

  // Selectors depend on actual page structure
  $('.childcare-result, .result-item, [class*="childcare"]').each((_i, el) => {
    const name = $(el).find('.name, h3, h4').first().text().trim();
    const address = $(el).find('.address, [class*="address"]').first().text().trim();
    const licenseStatus = $(el).find('[class*="license"]').first().text().trim();
    const ageRange = $(el).find('[class*="age"]').first().text().trim();
    const phone = $(el).find('[class*="phone"]').first().text().trim();

    if (name) {
      records.push({ name, address, licenseStatus, ageRange, phone });
    }
  });

  logger.info(`Found ${records.length} childcare listings`);
  return records;
}

export async function importChildcare(): Promise<void> {
  const source = await getSource('Ontario Child Care Finder');
  logger.info('Starting childcare import');

  try {
    const records = await fetchChildcareListings();

    for (const record of records) {
      try {
        await sleep(RATE_LIMIT_MS);

        const rawRecord: RawSchoolRecord = {
          sourceName: 'Ontario Child Care Finder',
          rawName: record.name,
          rawAddress: record.address,
          rawPhone: record.phone,
          rawWebsite: record.website,
          rawPayload: record as unknown as Record<string, unknown>,
        };

        const rawId = await insertRawRecord(source.sourceId, rawRecord);
        await normalizeAndSave(rawRecord, source.sourceId, 'daycare', undefined, {
          ageRange: record.ageRange,
          licensed: record.licenseStatus?.toLowerCase().includes('licensed') ?? undefined,
        });
        await recordMetric(source.sourceId, 'records_created');

        logger.info(`Imported childcare: ${record.name} (raw_id: ${rawId})`);
      } catch (err) {
        logger.error(`Failed to import ${record.name}:`, err);
        await recordMetric(source.sourceId, 'crawl_failure');
      }
    }

    await updateLastChecked(source.sourceId);
    await recordMetric(source.sourceId, 'crawl_success');
    logger.info('Childcare import completed');
  } catch (error) {
    logger.error('Childcare import failed:', error);
    await recordMetric(source.sourceId, 'crawl_failure');
    throw error;
  }
}

if (require.main === module) {
  importChildcare().catch((err) => {
    logger.error('Fatal error:', err);
    process.exit(1);
  });
}
