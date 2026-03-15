import { Worker, Job, Queue } from 'bullmq';
import dotenv from 'dotenv';
import logger from '../logger';
import { query } from '../db/pool';
import { enqueueCrawlJob } from './playwrightWorker';

dotenv.config();

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

interface EnrichmentJobData {
  schoolId: number;
  sourceId: number;
  url: string;
  fieldsToEnrich: string[];
}

async function processEnrichment(job: Job<EnrichmentJobData>): Promise<void> {
  const { schoolId, url, fieldsToEnrich } = job.data;

  logger.info(`Enriching school ${schoolId}: ${url} (fields: ${fieldsToEnrich.join(', ')})`);

  // Build selectors based on needed fields
  const selectors: Record<string, string> = {};
  for (const field of fieldsToEnrich) {
    switch (field) {
      case 'phone':
        selectors.phone = '[class*="phone"], [class*="tel"], a[href^="tel:"]';
        break;
      case 'grades':
        selectors.grades = '[class*="grade"], [class*="program"]';
        break;
      case 'address':
        selectors.address = '[class*="address"], address';
        break;
      case 'website':
        selectors.website = 'a[href*="http"]:contains("website")';
        break;
    }
  }

  // Enqueue a Playwright crawl job
  await enqueueCrawlJob(url, job.data.sourceId, selectors);
}

export async function enqueueEnrichment(
  schoolId: number,
  sourceId: number,
  url: string,
  fieldsToEnrich: string[]
): Promise<void> {
  const enrichmentQueue = new Queue('enrichment-jobs', { connection });
  await enrichmentQueue.add('enrich', { schoolId, sourceId, url, fieldsToEnrich });
}

export async function findIncompleteSchools(): Promise<void> {
  // Find schools missing key fields observed > 30 days ago
  const result = await query(`
    SELECT s.id, s.website, o.source_id
    FROM schools s
    LEFT JOIN school_observations o ON s.id = o.school_id
    WHERE (s.phone IS NULL OR s.grades IS NULL)
      AND s.website IS NOT NULL
      AND s.updated_at < NOW() - INTERVAL '30 days'
    ORDER BY s.updated_at ASC
    LIMIT 50
  `);

  for (const row of result.rows) {
    const missing: string[] = [];
    if (!row.phone) missing.push('phone');
    if (!row.grades) missing.push('grades');

    await enqueueEnrichment(row.id, row.source_id, row.website, missing);
    logger.info(`Queued enrichment for school ${row.id}: ${missing.join(', ')}`);
  }
}

export function startEnrichmentWorker(): Worker<EnrichmentJobData> {
  const worker = new Worker<EnrichmentJobData>('enrichment-jobs', processEnrichment, {
    connection,
    concurrency: 1,
    limiter: { max: 1, duration: 5000 },
  });

  worker.on('completed', (job) => {
    logger.info(`Enrichment completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Enrichment failed: ${job?.id}`, err);
  });

  logger.info('Enrichment worker started');
  return worker;
}

if (require.main === module) {
  startEnrichmentWorker();
  // Also check for incomplete schools on startup
  findIncompleteSchools().catch((err) => logger.error('Failed to find incomplete schools:', err));
}
