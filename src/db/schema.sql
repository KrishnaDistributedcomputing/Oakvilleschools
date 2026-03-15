-- Oakville Schools Directory — Database Schema
-- PostgreSQL

-- ============================================================
-- Table: sources
-- Metadata about each data source
-- ============================================================
CREATE TABLE IF NOT EXISTS sources (
    source_id       SERIAL PRIMARY KEY,
    source_name     VARCHAR(255) NOT NULL UNIQUE,
    source_type     VARCHAR(100) NOT NULL,          -- 'school_board', 'government_dataset', 'childcare_finder'
    base_url        TEXT NOT NULL,
    allowed_method  VARCHAR(100) NOT NULL DEFAULT 'http',  -- 'http', 'playwright', 'download'
    refresh_interval VARCHAR(50) NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    robots_status   VARCHAR(50) DEFAULT 'unknown',         -- 'allowed', 'disallowed', 'unknown'
    rate_limit_seconds INTEGER NOT NULL DEFAULT 3,
    last_checked    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: raw_records
-- Raw imported rows before normalization
-- ============================================================
CREATE TABLE IF NOT EXISTS raw_records (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER NOT NULL REFERENCES sources(source_id) ON DELETE CASCADE,
    raw_name        TEXT,
    raw_address     TEXT,
    raw_phone       TEXT,
    raw_website     TEXT,
    raw_grades      TEXT,
    raw_payload_json JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raw_records_source ON raw_records(source_id);
CREATE INDEX idx_raw_records_created ON raw_records(created_at);

-- ============================================================
-- Table: schools
-- Canonical normalized entities
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) NOT NULL UNIQUE,
    school_type     VARCHAR(50) NOT NULL,   -- 'public', 'catholic', 'private', 'montessori', 'daycare'
    subtype         VARCHAR(100),           -- e.g. 'elementary', 'secondary', 'infant', 'toddler'
    operator        VARCHAR(500),
    address_line_1  VARCHAR(500),
    city            VARCHAR(100) DEFAULT 'Oakville',
    province        VARCHAR(50) DEFAULT 'Ontario',
    postal_code     VARCHAR(10),
    phone           VARCHAR(30),
    website         TEXT,
    grades          VARCHAR(100),           -- e.g. 'JK-8', '9-12'
    age_range       VARCHAR(100),           -- for daycares
    licensed        BOOLEAN,
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schools_type ON schools(school_type);
CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_schools_postal ON schools(postal_code);
CREATE INDEX idx_schools_city ON schools(city);

-- ============================================================
-- Table: school_observations
-- Source evidence for each school record
-- ============================================================
CREATE TABLE IF NOT EXISTS school_observations (
    id              SERIAL PRIMARY KEY,
    school_id       INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    source_id       INTEGER NOT NULL REFERENCES sources(source_id) ON DELETE CASCADE,
    observed_name   TEXT,
    observed_address TEXT,
    observed_phone  TEXT,
    observed_website TEXT,
    source_url      TEXT,
    confidence_score DECIMAL(3, 2) DEFAULT 1.00,
    observed_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_observations_school ON school_observations(school_id);
CREATE INDEX idx_observations_source ON school_observations(source_id);

-- ============================================================
-- Table: crawl_jobs
-- Tracks scraping/crawl jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_jobs (
    job_id          SERIAL PRIMARY KEY,
    url             TEXT NOT NULL,
    source_id       INTEGER NOT NULL REFERENCES sources(source_id) ON DELETE CASCADE,
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
    attempts        INTEGER NOT NULL DEFAULT 0,
    last_attempt    TIMESTAMP WITH TIME ZONE,
    next_retry      TIMESTAMP WITH TIME ZONE,
    error_message   TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX idx_crawl_jobs_source ON crawl_jobs(source_id);
CREATE INDEX idx_crawl_jobs_next_retry ON crawl_jobs(next_retry);

-- ============================================================
-- Table: crawl_metrics
-- Monitoring metrics for crawl operations
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_metrics (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER REFERENCES sources(source_id) ON DELETE SET NULL,
    metric_name     VARCHAR(100) NOT NULL,  -- 'crawl_success', 'crawl_failure', 'records_created', 'records_updated', 'duplicate'
    metric_value    INTEGER NOT NULL DEFAULT 1,
    recorded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metrics_source ON crawl_metrics(source_id);
CREATE INDEX idx_metrics_name ON crawl_metrics(metric_name);
CREATE INDEX idx_metrics_recorded ON crawl_metrics(recorded_at);

-- ============================================================
-- Seed sources
-- ============================================================
INSERT INTO sources (source_name, source_type, base_url, allowed_method, refresh_interval, rate_limit_seconds)
VALUES
    ('HDSB', 'school_board', 'https://www.hdsb.ca', 'http', 'weekly', 3),
    ('HCDSB', 'school_board', 'https://www.hcdsb.org', 'http', 'weekly', 3),
    ('Ontario Private Schools', 'government_dataset', 'https://data.ontario.ca', 'download', 'monthly', 5),
    ('Ontario Child Care Finder', 'childcare_finder', 'https://www.ontario.ca/page/find-child-care', 'http', 'weekly', 5)
ON CONFLICT (source_name) DO NOTHING;
