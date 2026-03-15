import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { Queue, Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import logger from '../logger';
import { query } from '../db/pool';
import { isDomainAllowed, isAllowed } from '../crawler/compliance';

dotenv.config();

const TIMEOUT = parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000', 10);
const MAX_RETRIES = parseInt(process.env.PLAYWRIGHT_MAX_RETRIES || '3', 10);

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

const crawlQueue = new Queue('crawl-jobs', { connection });

interface CrawlJobData {
  jobId: number;
  url: string;
  sourceId: number;
  selectors?: Record<string, string>;
}

async function createStealthContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    userAgent: 'OakvilleSchoolsDirectory/1.0 (educational project)',
    viewport: { width: 1280, height: 720 },
    javaScriptEnabled: true,
  });
}

async function blockUnnecessaryResources(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType();
    if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
      route.abort();
    } else if (route.request().url().match(/analytics|tracking|ads|doubleclick|google-analytics/i)) {
      route.abort();
    } else {
      route.continue();
    }
  });
}

async function crawlPage(page: Page, url: string, selectors?: Record<string, string>): Promise<Record<string, string>> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
  await page.waitForTimeout(2000); // Allow dynamic content to render

  const result: Record<string, string> = {};

  if (selectors) {
    for (const [field, selector] of Object.entries(selectors)) {
      try {
        const element = await page.$(selector);
        if (element) {
          result[field] = (await element.textContent())?.trim() || '';
        }
      } catch {
        logger.debug(`Selector not found: ${selector} for field ${field}`);
      }
    }
  } else {
    // Extract common school fields
    result.title = await page.title();
    result.html = await page.content();
  }

  return result;
}

async function processJob(job: Job<CrawlJobData>): Promise<void> {
  const { jobId, url, sourceId, selectors } = job.data;

  // Security checks
  if (!isDomainAllowed(url)) {
    logger.warn(`Skipping disallowed domain: ${url}`);
    await updateJobStatus(jobId, 'failed', 'Domain not in allowlist');
    return;
  }

  const allowed = await isAllowed(url);
  if (!allowed) {
    logger.warn(`robots.txt blocks: ${url}`);
    await updateJobStatus(jobId, 'failed', 'Blocked by robots.txt');
    return;
  }

  await updateJobStatus(jobId, 'running');

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await createStealthContext(browser);
    const page = await context.newPage();
    await blockUnnecessaryResources(page);

    const data = await crawlPage(page, url, selectors);

    // Store results
    await query(
      `UPDATE crawl_jobs SET status = 'completed', last_attempt = NOW(), updated_at = NOW() WHERE job_id = $1`,
      [jobId]
    );

    logger.info(`Crawl completed: ${url}`);

    await context.close();
  } catch (error) {
    const attempts = await incrementAttempts(jobId);
    if (attempts >= MAX_RETRIES) {
      await updateJobStatus(jobId, 'failed', String(error));
      logger.error(`Crawl permanently failed after ${MAX_RETRIES} attempts: ${url}`);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, attempts) * 60000; // 2^n minutes
      await query(
        `UPDATE crawl_jobs SET status = 'pending', next_retry = NOW() + interval '${retryDelay} milliseconds', updated_at = NOW() WHERE job_id = $1`,
        [jobId]
      );
      logger.warn(`Crawl failed, retry ${attempts}/${MAX_RETRIES}: ${url}`);
    }
  } finally {
    if (browser) await browser.close();
  }
}

async function updateJobStatus(jobId: number, status: string, error?: string): Promise<void> {
  await query(
    'UPDATE crawl_jobs SET status = $1, error_message = $2, last_attempt = NOW(), updated_at = NOW() WHERE job_id = $3',
    [status, error || null, jobId]
  );
}

async function incrementAttempts(jobId: number): Promise<number> {
  const result = await query(
    'UPDATE crawl_jobs SET attempts = attempts + 1, last_attempt = NOW(), updated_at = NOW() WHERE job_id = $1 RETURNING attempts',
    [jobId]
  );
  return result.rows[0].attempts;
}

export async function enqueueCrawlJob(url: string, sourceId: number, selectors?: Record<string, string>): Promise<number> {
  const result = await query(
    `INSERT INTO crawl_jobs (url, source_id, status) VALUES ($1, $2, 'pending') RETURNING job_id`,
    [url, sourceId]
  );
  const jobId = result.rows[0].job_id;

  await crawlQueue.add('crawl', { jobId, url, sourceId, selectors });

  return jobId;
}

export function startPlaywrightWorker(): Worker<CrawlJobData> {
  const worker = new Worker<CrawlJobData>('crawl-jobs', processJob, {
    connection,
    concurrency: 2,
    limiter: { max: 1, duration: 3000 },
  });

  worker.on('completed', (job) => {
    logger.info(`Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job failed: ${job?.id}`, err);
  });

  logger.info('Playwright worker started');
  return worker;
}

if (require.main === module) {
  startPlaywrightWorker();
}
