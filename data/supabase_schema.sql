-- Supabase schema for Oakville Schools Directory

CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(300) NOT NULL,
  slug VARCHAR(300) UNIQUE NOT NULL,
  school_type VARCHAR(50) NOT NULL,
  subtype VARCHAR(50),
  operator VARCHAR(300),
  address_line_1 TEXT,
  city VARCHAR(100) DEFAULT 'Oakville',
  province VARCHAR(50) DEFAULT 'Ontario',
  postal_code VARCHAR(10),
  phone VARCHAR(30),
  fax VARCHAR(30),
  website TEXT,
  grades VARCHAR(50),
  age_range VARCHAR(50),
  licensed BOOLEAN,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  rating DECIMAL(2,1),
  reviews_count INTEGER,
  google_maps_url TEXT,
  place_id VARCHAR(500),
  opening_hours JSONB,
  description TEXT,
  image_url TEXT,
  categories TEXT,
  price_level VARCHAR(20),
  permanently_closed BOOLEAN DEFAULT FALSE,
  temporarily_closed BOOLEAN DEFAULT FALSE,
  principal_name VARCHAR(200),
  school_email VARCHAR(200),
  school_number VARCHAR(20),
  ossd_credits TEXT,
  program_type VARCHAR(100),
  association_membership TEXT,
  school_level VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_schools_type ON schools(school_type);
CREATE INDEX idx_schools_name ON schools(name);

-- Enable Row Level Security (public read)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON schools FOR SELECT USING (true);

