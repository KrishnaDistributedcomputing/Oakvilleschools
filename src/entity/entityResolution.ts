import stringSimilarity from 'string-similarity';
import { query, transaction } from '../db/pool';
import logger from '../logger';
import { normalizeWebsite, normalizePhone } from '../parser/normalization';
import dotenv from 'dotenv';

dotenv.config();

interface SchoolRow {
  id: number;
  name: string;
  phone: string | null;
  website: string | null;
  postal_code: string | null;
  address_line_1: string | null;
}

function extractDomain(url: string): string {
  try {
    return new URL(normalizeWebsite(url)).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function computeMatchScore(a: SchoolRow, b: SchoolRow): number {
  let score = 0;

  // Website domain match (+0.5)
  const domainA = a.website ? extractDomain(a.website) : '';
  const domainB = b.website ? extractDomain(b.website) : '';
  if (domainA && domainB && domainA === domainB) {
    score += 0.5;
  }

  // Phone match (+0.3)
  const phoneA = a.phone ? normalizePhone(a.phone) : '';
  const phoneB = b.phone ? normalizePhone(b.phone) : '';
  if (phoneA && phoneB && phoneA === phoneB) {
    score += 0.3;
  }

  // Postal code match (+0.2)
  if (a.postal_code && b.postal_code && a.postal_code === b.postal_code) {
    score += 0.2;
  }

  // Name similarity (+0.2 if > 0.9)
  const nameSim = stringSimilarity.compareTwoStrings(
    a.name.toLowerCase(),
    b.name.toLowerCase()
  );
  if (nameSim > 0.9) {
    score += 0.2;
  }

  // Address match (bonus for same street)
  if (a.address_line_1 && b.address_line_1) {
    const addrSim = stringSimilarity.compareTwoStrings(
      a.address_line_1.toLowerCase(),
      b.address_line_1.toLowerCase()
    );
    if (addrSim > 0.85) {
      score += 0.1;
    }
  }

  return score;
}

async function mergeSchools(keepId: number, mergeId: number): Promise<void> {
  await transaction(async (client) => {
    // Move observations to the kept school
    await client.query(
      'UPDATE school_observations SET school_id = $1 WHERE school_id = $2',
      [keepId, mergeId]
    );

    // Fill in missing fields from the merged school
    await client.query(
      `UPDATE schools SET
        phone = COALESCE(phone, (SELECT phone FROM schools WHERE id = $1)),
        website = COALESCE(website, (SELECT website FROM schools WHERE id = $1)),
        grades = COALESCE(grades, (SELECT grades FROM schools WHERE id = $1)),
        postal_code = COALESCE(postal_code, (SELECT postal_code FROM schools WHERE id = $1)),
        updated_at = NOW()
      WHERE id = $2`,
      [mergeId, keepId]
    );

    // Delete merged school
    await client.query('DELETE FROM schools WHERE id = $1', [mergeId]);

    logger.info(`Merged school ${mergeId} into ${keepId}`);
  });
}

export async function resolveEntities(): Promise<{ mergeCount: number }> {
  logger.info('Starting entity resolution...');

  const result = await query(
    'SELECT id, name, phone, website, postal_code, address_line_1 FROM schools ORDER BY id'
  );
  const schools: SchoolRow[] = result.rows;
  const merged = new Set<number>();
  let mergeCount = 0;

  for (let i = 0; i < schools.length; i++) {
    if (merged.has(schools[i].id)) continue;

    for (let j = i + 1; j < schools.length; j++) {
      if (merged.has(schools[j].id)) continue;

      const score = computeMatchScore(schools[i], schools[j]);

      if (score > 0.7) {
        logger.info(
          `Match found: "${schools[i].name}" ↔ "${schools[j].name}" (score: ${score.toFixed(2)})`
        );
        // Keep the one with more data (lower id = earlier import as tiebreaker)
        await mergeSchools(schools[i].id, schools[j].id);
        merged.add(schools[j].id);
        mergeCount++;
      }
    }
  }

  logger.info(`Entity resolution complete: ${mergeCount} merges`);
  return { mergeCount };
}

if (require.main === module) {
  resolveEntities()
    .then(({ mergeCount }) => {
      console.log(`Resolved ${mergeCount} duplicate entities`);
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Entity resolution failed:', err);
      process.exit(1);
    });
}
