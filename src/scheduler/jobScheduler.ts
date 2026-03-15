import cron from 'node-cron';
import dotenv from 'dotenv';
import logger from '../logger';
import { crawlHDSB } from '../crawler/hdsbAdapter';
import { crawlHCDSB } from '../crawler/hcdsbAdapter';
import { importPrivateSchools } from '../crawler/privateSchoolImport';
import { importChildcare } from '../crawler/childcareImport';
import { resolveEntities } from '../entity/entityResolution';
import { findIncompleteSchools } from '../workers/enrichmentWorker';

dotenv.config();

// Daily at 2am — refresh childcare listings
cron.schedule('0 2 * * *', async () => {
  logger.info('Scheduled job: childcare refresh');
  try {
    await importChildcare();
  } catch (err) {
    logger.error('Scheduled childcare import failed:', err);
  }
});

// Weekly on Sunday at 3am — refresh school board directories
cron.schedule('0 3 * * 0', async () => {
  logger.info('Scheduled job: school board refresh');
  try {
    await crawlHDSB();
    await crawlHCDSB();
    await resolveEntities();
  } catch (err) {
    logger.error('Scheduled school board crawl failed:', err);
  }
});

// Monthly on the 1st at 4am — refresh private school dataset
cron.schedule('0 4 1 * *', async () => {
  logger.info('Scheduled job: private school refresh');
  try {
    await importPrivateSchools();
    await resolveEntities();
  } catch (err) {
    logger.error('Scheduled private school import failed:', err);
  }
});

// Daily at 5am — find and enqueue incomplete schools for enrichment
cron.schedule('0 5 * * *', async () => {
  logger.info('Scheduled job: enrichment check');
  try {
    await findIncompleteSchools();
  } catch (err) {
    logger.error('Scheduled enrichment check failed:', err);
  }
});

logger.info('Scheduler started — jobs registered:');
logger.info('  Daily 2am    → childcare refresh');
logger.info('  Weekly Sun 3am → HDSB + HCDSB crawl + entity resolution');
logger.info('  Monthly 1st 4am → private school import + entity resolution');
logger.info('  Daily 5am    → enrichment queue');

// Keep process alive
process.on('SIGINT', () => {
  logger.info('Scheduler shutting down');
  process.exit(0);
});
