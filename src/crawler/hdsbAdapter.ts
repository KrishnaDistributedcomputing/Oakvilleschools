import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import logger from '../logger';
import { RawSchoolRecord } from '../types';
import { getSource, insertRawRecord, updateLastChecked, recordMetric } from './sourceRegistry';
import { isAllowed, isDomainAllowed, sleep } from './compliance';
import { normalizeAndSave } from '../parser/schoolParser';

dotenv.config();

const HDSB_SCHOOLS_URL = 'https://www.hdsb.ca/schools/school-directory/';
const RATE_LIMIT_MS = parseInt(process.env.RATE_LIMIT_HDSB || '3000', 10);

// Known Oakville schools in the HDSB (Halton covers Burlington, Oakville, Milton, Halton Hills)
const OAKVILLE_SCHOOL_NAMES = new Set([
  'abbey park high school',
  'iroquois ridge high school',
  'oakville trafalgar high school',
  'garth webb secondary school',
  'white oaks secondary school',
  't. a. blakelock high school',
  'abbey lane public school',
  'alexander\'s public school',
  'brantwood public school',
  'brookdale public school',
  'c.h. norton public school',
  'cedar ridge public school',
  'charles r. beaudoin',
  'chris hadfield public school',
  'dr. charles best public school',
  'e.j. james public school',
  'emily carr public school',
  'ethel gardiner public school',
  'falgarwood public school',
  'forest trail public school',
  'gladys speers public school',
  'heritage glen public school',
  'irma coulson public school',
  'james w. hill public school',
  'john t. tuck public school',
  'john william boich public school',
  'joshua creek public school',
  'king\'s road public school',
  'maple grove public school',
  'montclair public school',
  'munn\'s public school',
  'new central public school',
  'oakwood public school',
  'oodenawi public school',
  'orchard park public school',
  'palermo public school',
  'paul a. fisher public school',
  'pilgrim wood public school',
  'pine grove public school',
  'pineland public school',
  'river oaks public school',
  'robert baldwin public school',
  'sheridan public school',
  'sunningdale public school',
  'west oak public school',
  'w. h. morden public school',
]);

function isOakvilleSchool(name: string): boolean {
  return OAKVILLE_SCHOOL_NAMES.has(name.toLowerCase().trim());
}

async function fetchSchoolList(): Promise<{ name: string; url: string; section: string }[]> {
  if (!isDomainAllowed(HDSB_SCHOOLS_URL)) {
    throw new Error('Domain not in allowlist');
  }

  const allowed = await isAllowed(HDSB_SCHOOLS_URL);
  if (!allowed) {
    throw new Error('robots.txt disallows this URL');
  }

  logger.info('Fetching HDSB school directory...');
  const response = await axios.get(HDSB_SCHOOLS_URL, {
    timeout: 30000,
    headers: { 'User-Agent': 'OakvilleSchoolsDirectory/1.0 (educational project)' },
  });

  const $ = cheerio.load(response.data);
  const schools: { name: string; url: string; section: string }[] = [];

  // The directory page lists schools as links to subdomains: href="https://xxx.hdsb.ca"
  let currentSection = 'unknown';
  $('h2').each((_i, h2) => {
    const heading = $(h2).text().trim().toLowerCase();
    if (heading.includes('secondary')) currentSection = 'secondary';
    else if (heading.includes('elementary')) currentSection = 'elementary';
  });

  // Extract all school links with hdsb.ca subdomains
  $('a[href*=".hdsb.ca"]').each((_i, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (name && href.match(/https?:\/\/[a-z]+\.hdsb\.ca/i) && !href.includes('www.hdsb.ca')) {
      schools.push({ name, url: href, section: currentSection });
    }
  });

  // Deduplicate by name (some schools appear multiple times)
  const seen = new Set<string>();
  const unique = schools.filter((s) => {
    const key = s.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  logger.info(`Found ${unique.length} HDSB schools total`);
  return unique;
}

export async function crawlHDSB(): Promise<void> {
  const source = await getSource('HDSB');
  logger.info('Starting HDSB crawl');

  try {
    const schoolList = await fetchSchoolList();
    const oakvilleSchools = schoolList.filter((s) => isOakvilleSchool(s.name));
    logger.info(`Filtered to ${oakvilleSchools.length} Oakville schools from ${schoolList.length} total`);

    for (const school of oakvilleSchools) {
      try {
        await sleep(RATE_LIMIT_MS);

        // Determine grade range from section
        const grades = school.section === 'secondary' ? '9-12' : 'JK-8';
        const subtype = school.section === 'secondary' ? 'secondary' : 'elementary';

        const rawRecord: RawSchoolRecord = {
          sourceName: 'HDSB',
          rawName: school.name,
          rawAddress: 'Oakville, Ontario',
          rawPhone: undefined,
          rawWebsite: school.url,
          rawGrades: grades,
          rawPayload: { profileUrl: school.url, section: school.section, subtype },
        };

        const rawId = await insertRawRecord(source.sourceId, rawRecord);
        await normalizeAndSave(rawRecord, source.sourceId, 'public', 'Halton District School Board');
        await recordMetric(source.sourceId, 'records_created');

        logger.info(`Imported HDSB school: ${school.name} (raw_id: ${rawId})`);
      } catch (err) {
        logger.error(`Failed to import ${school.name}:`, err);
        await recordMetric(source.sourceId, 'crawl_failure');
      }
    }

    await updateLastChecked(source.sourceId);
    await recordMetric(source.sourceId, 'crawl_success');
    logger.info('HDSB crawl completed');
  } catch (error) {
    logger.error('HDSB crawl failed:', error);
    await recordMetric(source.sourceId, 'crawl_failure');
    throw error;
  }
}

if (require.main === module) {
  crawlHDSB().catch((err) => {
    logger.error('Fatal error:', err);
    process.exit(1);
  });
}
