import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from '../db/pool';
import logger from '../logger';
import { crawlHDSB } from '../crawler/hdsbAdapter';
import { crawlHCDSB } from '../crawler/hcdsbAdapter';
import { importPrivateSchools } from '../crawler/privateSchoolImport';
import { importChildcare } from '../crawler/childcareImport';
import { resolveEntities } from '../entity/entityResolution';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Health ----------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------- List schools ----------
app.get('/api/schools', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      type,
      grade,
      postal_code,
      licensed,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (type) {
      conditions.push(`school_type = $${paramIdx++}`);
      params.push(type);
    }
    if (grade) {
      conditions.push(`grades ILIKE $${paramIdx++}`);
      params.push(`%${grade}%`);
    }
    if (postal_code) {
      conditions.push(`postal_code = $${paramIdx++}`);
      params.push(postal_code);
    }
    if (licensed === 'true') {
      conditions.push(`licensed = true`);
    }
    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR address_line_1 ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM schools ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, name, slug, school_type, subtype, operator, address_line_1, city, province, postal_code, phone, website, grades, age_range, licensed, latitude, longitude, rating, reviews_count, google_maps_url, description, image_url, categories, opening_hours, principal_name, school_email, school_number, ossd_credits, program_type, association_membership, school_level, fax, created_at, updated_at
       FROM schools ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limitNum, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------- Get school by slug ----------
app.get('/api/schools/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const result = await query(
      `SELECT s.*, json_agg(
        json_build_object(
          'source_id', o.source_id,
          'observed_name', o.observed_name,
          'observed_at', o.observed_at,
          'confidence_score', o.confidence_score
        )
      ) FILTER (WHERE o.id IS NOT NULL) AS observations
       FROM schools s
       LEFT JOIN school_observations o ON s.id = o.school_id
       WHERE s.slug = $1
       GROUP BY s.id`,
      [slug]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'School not found' });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ---------- School types summary ----------
app.get('/api/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT school_type, COUNT(*) as count FROM schools GROUP BY school_type ORDER BY count DESC`
    );
    const total = await query('SELECT COUNT(*) FROM schools');

    res.json({
      total: parseInt(total.rows[0].count, 10),
      byType: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// ---------- Crawl metrics ----------
app.get('/api/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT metric_name, SUM(metric_value) as total
       FROM crawl_metrics
       WHERE recorded_at > NOW() - INTERVAL '7 days'
       GROUP BY metric_name`
    );
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// ---------- Trigger crawls manually ----------
const crawlRunning: Record<string, boolean> = {};

app.post('/api/crawl', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validSources = ['hdsb', 'hcdsb', 'private', 'childcare', 'all'];
    const source = (req.body?.source || 'all').toLowerCase();

    if (!validSources.includes(source)) {
      res.status(400).json({ error: `Invalid source. Valid: ${validSources.join(', ')}` });
      return;
    }

    if (crawlRunning[source]) {
      res.status(409).json({ error: `Crawl for '${source}' is already running` });
      return;
    }

    crawlRunning[source] = true;
    const started = new Date().toISOString();

    // Run asynchronously — don't wait for completion
    const runCrawl = async () => {
      const results: { source: string; status: string; error?: string }[] = [];
      try {
        if (source === 'hdsb' || source === 'all') {
          try {
            logger.info('Manual trigger: HDSB crawl');
            await crawlHDSB();
            results.push({ source: 'hdsb', status: 'success' });
          } catch (err: any) {
            logger.error('HDSB crawl failed:', err);
            results.push({ source: 'hdsb', status: 'failed', error: err.message });
          }
        }
        if (source === 'hcdsb' || source === 'all') {
          try {
            logger.info('Manual trigger: HCDSB crawl');
            await crawlHCDSB();
            results.push({ source: 'hcdsb', status: 'success' });
          } catch (err: any) {
            logger.error('HCDSB crawl failed:', err);
            results.push({ source: 'hcdsb', status: 'failed', error: err.message });
          }
        }
        if (source === 'private' || source === 'all') {
          try {
            logger.info('Manual trigger: private school import');
            await importPrivateSchools();
            results.push({ source: 'private', status: 'success' });
          } catch (err: any) {
            logger.error('Private school import failed:', err);
            results.push({ source: 'private', status: 'failed', error: err.message });
          }
        }
        if (source === 'childcare' || source === 'all') {
          try {
            logger.info('Manual trigger: childcare import');
            await importChildcare();
            results.push({ source: 'childcare', status: 'success' });
          } catch (err: any) {
            logger.error('Childcare import failed:', err);
            results.push({ source: 'childcare', status: 'failed', error: err.message });
          }
        }
        try {
          logger.info('Manual trigger: entity resolution');
          await resolveEntities();
        } catch (err: any) {
          logger.error('Entity resolution failed:', err);
        }
        logger.info(`Manual crawl '${source}' finished: ${JSON.stringify(results)}`);
      } finally {
        crawlRunning[source] = false;
      }
    };

    runCrawl();

    res.json({
      status: 'started',
      source,
      started,
      message: `Crawl '${source}' triggered — check /api/metrics for progress`,
    });
  } catch (error) {
    next(error);
  }
});

// ---------- Seed known Oakville schools ----------
app.post('/api/seed', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const knownSchools = [
      // HDSB Secondary Schools
      { name: 'Abbey Park High School', type: 'public', subtype: 'secondary', operator: 'Halton District School Board', address: '1455 Glen Abbey Gate, Oakville, ON L6M 2G5', phone: '(905) 827-4101', website: 'https://aph.hdsb.ca', grades: '9-12' },
      { name: 'Iroquois Ridge High School', type: 'public', subtype: 'secondary', operator: 'Halton District School Board', address: '1123 Glenashton Dr, Oakville, ON L6H 5M1', phone: '(905) 257-9711', website: 'https://irs.hdsb.ca', grades: '9-12' },
      { name: 'Oakville Trafalgar High School', type: 'public', subtype: 'secondary', operator: 'Halton District School Board', address: '1460 Devon Rd, Oakville, ON L6J 3L6', phone: '(905) 845-2891', website: 'https://oth.hdsb.ca', grades: '9-12' },
      { name: 'Garth Webb Secondary School', type: 'public', subtype: 'secondary', operator: 'Halton District School Board', address: '2820 Westoak Trails Blvd, Oakville, ON L6M 4W7', phone: '(905) 827-1158', website: 'https://gws.hdsb.ca', grades: '9-12' },
      { name: 'White Oaks Secondary School', type: 'public', subtype: 'secondary', operator: 'Halton District School Board', address: '1330 Montclair Dr, Oakville, ON L6H 1Z5', phone: '(905) 845-5200', website: 'https://wos.hdsb.ca', grades: '9-12' },
      { name: 'T.A. Blakelock High School', type: 'public', subtype: 'secondary', operator: 'Halton District School Board', address: '1160 Rebecca St, Oakville, ON L6L 1Y9', phone: '(905) 827-1158', website: 'https://tab.hdsb.ca', grades: '9-12' },
      // HDSB Elementary Schools
      { name: 'Falgarwood Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '2136 Calloway Dr, Oakville, ON L6M 2K3', phone: '(905) 847-6815', website: 'https://fal.hdsb.ca', grades: 'JK-8' },
      { name: 'Joshua Creek Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '1450 Pilgrims Way, Oakville, ON L6M 2W3', phone: '(905) 827-1290', website: 'https://jcp.hdsb.ca', grades: 'JK-8' },
      { name: 'River Oaks Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '2173 Eighth Line, Oakville, ON L6H 7A4', phone: '(905) 257-0622', website: 'https://riv.hdsb.ca', grades: 'JK-8' },
      { name: 'Sunningdale Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '1430 Rebecca St, Oakville, ON L6L 2B4', phone: '(905) 825-2414', website: 'https://sun.hdsb.ca', grades: 'JK-8' },
      { name: 'Pilgrim Wood Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '1551 Pilgrims Way, Oakville, ON L6M 2W7', phone: '(905) 847-2963', website: 'https://pwe.hdsb.ca', grades: 'JK-8' },
      { name: 'Palermo Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '2505 Dundas St W, Oakville, ON L6M 4J2', phone: '(905) 847-6270', website: 'https://pal.hdsb.ca', grades: 'JK-8' },
      { name: 'West Oak Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '310 Westoak Trails Blvd, Oakville, ON L6H 5T6', phone: '(905) 257-1044', website: 'https://wes.hdsb.ca', grades: 'JK-6' },
      { name: 'Sheridan Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '49 Wilson St, Oakville, ON L6K 3G1', phone: '(905) 845-5083', website: 'https://she.hdsb.ca', grades: 'JK-8' },
      { name: 'Pine Grove Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '1466 Nottinghill Gate, Oakville, ON L6M 1X6', phone: '(905) 827-4133', website: 'https://pin.hdsb.ca', grades: 'JK-8' },
      { name: 'Montclair Public School', type: 'public', subtype: 'elementary', operator: 'Halton District School Board', address: '53 Montclair Dr, Oakville, ON L6H 1L2', phone: '(905) 844-6120', website: 'https://mon.hdsb.ca', grades: 'JK-8' },
      // HCDSB Catholic Schools
      { name: 'Holy Trinity Catholic Secondary School', type: 'catholic', subtype: 'secondary', operator: 'Halton Catholic District School Board', address: '2420 Sixth Line, Oakville, ON L6H 6W5', phone: '(905) 257-3530', website: 'https://hol.hcdsb.org', grades: '9-12' },
      { name: 'St. Thomas Aquinas Catholic Secondary School', type: 'catholic', subtype: 'secondary', operator: 'Halton Catholic District School Board', address: '124 Dorval Dr, Oakville, ON L6K 2W1', phone: '(905) 842-8900', website: 'https://sta.hcdsb.org', grades: '9-12' },
      { name: 'St. Ignatius of Loyola Catholic Secondary School', type: 'catholic', subtype: 'secondary', operator: 'Halton Catholic District School Board', address: '1550 Nottinghill Gate, Oakville, ON L6M 1X5', phone: '(905) 847-0595', website: 'https://sil.hcdsb.org', grades: '9-12' },
      { name: 'St. Andrew Catholic Elementary School', type: 'catholic', subtype: 'elementary', operator: 'Halton Catholic District School Board', address: '1340 Pilgrims Way, Oakville, ON L6M 2W2', phone: '(905) 827-4011', website: 'https://san.hcdsb.org', grades: 'JK-8' },
      { name: 'St. Bernadette Catholic Elementary School', type: 'catholic', subtype: 'elementary', operator: 'Halton Catholic District School Board', address: '3170 Spruce Ave, Oakville, ON L6L 2G3', phone: '(905) 827-4008', website: 'https://sbe.hcdsb.org', grades: 'JK-8' },
      { name: 'St. Dominic Catholic Elementary School', type: 'catholic', subtype: 'elementary', operator: 'Halton Catholic District School Board', address: '2511 Glenwood School Dr, Oakville, ON L6M 4E4', phone: '(905) 847-8013', website: 'https://sdo.hcdsb.org', grades: 'JK-8' },
      { name: 'St. James Catholic Elementary School', type: 'catholic', subtype: 'elementary', operator: 'Halton Catholic District School Board', address: '225 Church St, Oakville, ON L6J 1N2', phone: '(905) 844-3214', website: 'https://sja.hcdsb.org', grades: 'JK-8' },
      { name: 'St. Luke Catholic Elementary School', type: 'catholic', subtype: 'elementary', operator: 'Halton Catholic District School Board', address: '1486 Devon Rd, Oakville, ON L6J 3L6', phone: '(905) 844-2850', website: 'https://slu.hcdsb.org', grades: 'JK-8' },
      { name: 'St. Marguerite d\'Youville Catholic Elementary School', type: 'catholic', subtype: 'elementary', operator: 'Halton Catholic District School Board', address: '2473 Sixth Line, Oakville, ON L6H 6X1', phone: '(905) 257-2764', website: 'https://smy.hcdsb.org', grades: 'JK-8' },
      // Private / Montessori Schools
      { name: 'Appleby College', type: 'private', subtype: 'secondary', operator: 'Appleby College', address: '540 Lakeshore Rd W, Oakville, ON L6K 3P1', phone: '(905) 845-4681', website: 'https://www.appleby.on.ca', grades: '7-12' },
      { name: 'MacLachlan College', type: 'private', subtype: 'elementary', operator: 'MacLachlan College', address: '337 Trafalgar Rd, Oakville, ON L6J 3H3', phone: '(905) 844-0372', website: 'https://www.maclachlan.ca', grades: 'PS-8' },
      { name: 'Fern Hill School', type: 'private', subtype: 'elementary', operator: 'Fern Hill School', address: '2207 Third Line, Oakville, ON L6H 6P5', phone: '(905) 257-0022', website: 'https://www.fernhillschool.com', grades: 'PS-8' },
      { name: 'Dearcroft Montessori School', type: 'montessori', subtype: 'elementary', operator: 'Dearcroft Montessori', address: '1460 Sixth Line, Oakville, ON L6H 2N6', phone: '(905) 842-4646', website: 'https://www.dearcroft.on.ca', grades: 'PS-6' },
      { name: 'Oakville Montessori School', type: 'montessori', subtype: 'elementary', operator: 'Oakville Montessori School', address: '330 Randall St, Oakville, ON L6J 1P9', phone: '(905) 849-6611', website: 'https://www.oakvillemontessori.com', grades: 'PS-6' },
      { name: 'Chisholm Academy', type: 'private', subtype: 'elementary', operator: 'Chisholm Academy', address: '568 Central Pkwy W, Oakville, ON L6K 1W9', phone: '(905) 337-1221', website: 'https://www.chisholmacademy.ca', grades: 'JK-8' },
      // Daycares
      { name: 'Oakville Parent-Child Centre', type: 'daycare', subtype: 'daycare', operator: 'EarlyON', address: '3280 Wynnefield Gate, Oakville, ON L6L 0A8', phone: '(905) 849-8440', website: 'https://www.oakvillepcc.ca', grades: undefined, ageRange: '0-4', licensed: true },
      { name: 'La Petite Garderie Montessori', type: 'daycare', subtype: 'daycare', operator: 'La Petite Garderie', address: '2383 Sixth Line, Oakville, ON L6H 6W3', phone: '(905) 257-0001', website: undefined, grades: undefined, ageRange: '18 months - 6 years', licensed: true },
      { name: 'Brightpath Oakville', type: 'daycare', subtype: 'daycare', operator: 'BrightPath', address: '1011 Upper Middle Rd E, Oakville, ON L6H 4L1', phone: '(905) 337-0766', website: 'https://www.brightpathkids.com/oakville', grades: undefined, ageRange: 'Infant - 5 years', licensed: true },
    ];

    let created = 0;
    let updated = 0;

    for (const school of knownSchools) {
      const slug = school.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const existing = await query('SELECT id FROM schools WHERE slug = $1', [slug]);

      if (existing.rows.length > 0) {
        await query(
          `UPDATE schools SET name=$1, school_type=$2, subtype=$3, operator=$4,
           address_line_1=$5, city='Oakville', province='Ontario',
           postal_code=$6, phone=$7, website=$8, grades=$9,
           age_range=$10, licensed=$11, updated_at=NOW()
           WHERE slug=$12`,
          [
            school.name, school.type, school.subtype, school.operator,
            school.address, school.address.match(/[A-Z]\d[A-Z] \d[A-Z]\d/)?.[0] || null,
            school.phone, school.website || null, school.grades || null,
            (school as any).ageRange || null, (school as any).licensed ?? null, slug,
          ]
        );
        updated++;
      } else {
        await query(
          `INSERT INTO schools (name, slug, school_type, subtype, operator, address_line_1, city, province, postal_code, phone, website, grades, age_range, licensed)
           VALUES ($1, $2, $3, $4, $5, $6, 'Oakville', 'Ontario', $7, $8, $9, $10, $11, $12)`,
          [
            school.name, slug, school.type, school.subtype, school.operator,
            school.address, school.address.match(/[A-Z]\d[A-Z] \d[A-Z]\d/)?.[0] || null,
            school.phone, school.website || null, school.grades || null,
            (school as any).ageRange || null, (school as any).licensed ?? null,
          ]
        );
        created++;
      }
    }

    res.json({
      status: 'ok',
      created,
      updated,
      total: knownSchools.length,
      message: `Seeded ${created} new schools, updated ${updated} existing`,
    });
  } catch (error) {
    next(error);
  }
});

// ---------- Error handler ----------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('API error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.API_PORT || '3001', 10);

app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});

export default app;
