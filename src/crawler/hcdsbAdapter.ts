import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import logger from '../logger';
import { RawSchoolRecord } from '../types';
import { getSource, insertRawRecord, updateLastChecked, recordMetric } from './sourceRegistry';
import { isAllowed, isDomainAllowed, sleep } from './compliance';
import { normalizeAndSave } from '../parser/schoolParser';

dotenv.config();

const HCDSB_SCHOOLS_URL = 'https://www.hcdsb.org/our-schools/';
const RATE_LIMIT_MS = parseInt(process.env.RATE_LIMIT_HCDSB || '3000', 10);

async function fetchSchoolList(): Promise<{ name: string; url: string }[]> {
  if (!isDomainAllowed(HCDSB_SCHOOLS_URL)) {
    throw new Error('Domain not in allowlist');
  }

  const allowed = await isAllowed(HCDSB_SCHOOLS_URL);
  if (!allowed) {
    throw new Error('robots.txt disallows this URL');
  }

  logger.info('Fetching HCDSB school list...');
  const response = await axios.get(HCDSB_SCHOOLS_URL, {
    timeout: 30000,
    headers: { 'User-Agent': 'OakvilleSchoolsDirectory/1.0 (educational project)' },
  });

  const $ = cheerio.load(response.data);
  const schools: { name: string; url: string }[] = [];

  // Parse school links — selectors may need adjustment
  $('a[href*="/schools/"], a[href*="/school/"]').each((_i, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    if (name && href) {
      const fullUrl = href.startsWith('http') ? href : `https://www.hcdsb.org${href}`;
      // Filter to Oakville-area schools
      schools.push({ name, url: fullUrl });
    }
  });

  logger.info(`Found ${schools.length} HCDSB schools`);
  return schools;
}

async function fetchSchoolDetail(url: string): Promise<Partial<RawSchoolRecord>> {
  if (!isDomainAllowed(url)) return {};

  const allowed = await isAllowed(url);
  if (!allowed) return {};

  const response = await axios.get(url, {
    timeout: 30000,
    headers: { 'User-Agent': 'OakvilleSchoolsDirectory/1.0 (educational project)' },
  });

  const $ = cheerio.load(response.data);

  const address = $('[class*="address"], .school-info address').first().text().trim();
  const phone = $('[class*="phone"], .school-info [class*="tel"]').first().text().trim();
  const website = $('a:contains("School Website")').attr('href') || '';
  const grades = $('[class*="grade"]').first().text().trim();

  return {
    rawAddress: address || undefined,
    rawPhone: phone || undefined,
    rawWebsite: website || undefined,
    rawGrades: grades || undefined,
  };
}

export async function crawlHCDSB(): Promise<void> {
  const source = await getSource('HCDSB');
  logger.info('Starting HCDSB crawl');

  try {
    const schoolList = await fetchSchoolList();

    for (const school of schoolList) {
      try {
        await sleep(RATE_LIMIT_MS);
        const detail = await fetchSchoolDetail(school.url);

        const rawRecord: RawSchoolRecord = {
          sourceName: 'HCDSB',
          rawName: school.name,
          rawAddress: detail.rawAddress || '',
          rawPhone: detail.rawPhone,
          rawWebsite: detail.rawWebsite || school.url,
          rawGrades: detail.rawGrades,
          rawPayload: { profileUrl: school.url },
        };

        const rawId = await insertRawRecord(source.sourceId, rawRecord);
        await normalizeAndSave(rawRecord, source.sourceId, 'catholic');
        await recordMetric(source.sourceId, 'records_created');

        logger.info(`Imported HCDSB school: ${school.name} (raw_id: ${rawId})`);
      } catch (err) {
        logger.error(`Failed to import ${school.name}:`, err);
        await recordMetric(source.sourceId, 'crawl_failure');
      }
    }

    await updateLastChecked(source.sourceId);
    await recordMetric(source.sourceId, 'crawl_success');
    logger.info('HCDSB crawl completed');
  } catch (error) {
    logger.error('HCDSB crawl failed:', error);
    await recordMetric(source.sourceId, 'crawl_failure');
    throw error;
  }
}

if (require.main === module) {
  crawlHCDSB().catch((err) => {
    logger.error('Fatal error:', err);
    process.exit(1);
  });
}
