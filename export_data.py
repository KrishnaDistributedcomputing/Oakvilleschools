"""Export all school data from Azure PostgreSQL to SQL + JSON for Supabase migration."""
import json
import psycopg2
from psycopg2.extras import RealDictCursor

DB_URL = "postgresql://oakvilleadmin:OakV1ll3Sch00ls!2026@data-psql-oakvilleschools-prod.postgres.database.azure.com:5432/oakville_schools?sslmode=require"

def main():
    conn = psycopg2.connect(DB_URL, connect_timeout=30)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Export schools
    cur.execute("SELECT * FROM schools ORDER BY id")
    schools = cur.fetchall()
    print(f"Exported {len(schools)} schools")

    # Convert to JSON-serializable
    for s in schools:
        for k, v in s.items():
            if hasattr(v, 'isoformat'):
                s[k] = v.isoformat()

    with open("data/schools_export.json", "w", encoding="utf-8") as f:
        json.dump(schools, f, indent=2, default=str)
    print("Saved to data/schools_export.json")

    # Generate Supabase SQL
    with open("data/supabase_schema.sql", "w", encoding="utf-8") as f:
        f.write("-- Supabase schema for Oakville Schools Directory\n\n")
        f.write("CREATE TABLE IF NOT EXISTS schools (\n")
        f.write("  id SERIAL PRIMARY KEY,\n")
        f.write("  name VARCHAR(300) NOT NULL,\n")
        f.write("  slug VARCHAR(300) UNIQUE NOT NULL,\n")
        f.write("  school_type VARCHAR(50) NOT NULL,\n")
        f.write("  subtype VARCHAR(50),\n")
        f.write("  operator VARCHAR(300),\n")
        f.write("  address_line_1 TEXT,\n")
        f.write("  city VARCHAR(100) DEFAULT 'Oakville',\n")
        f.write("  province VARCHAR(50) DEFAULT 'Ontario',\n")
        f.write("  postal_code VARCHAR(10),\n")
        f.write("  phone VARCHAR(30),\n")
        f.write("  fax VARCHAR(30),\n")
        f.write("  website TEXT,\n")
        f.write("  grades VARCHAR(50),\n")
        f.write("  age_range VARCHAR(50),\n")
        f.write("  licensed BOOLEAN,\n")
        f.write("  latitude DECIMAL(10,7),\n")
        f.write("  longitude DECIMAL(10,7),\n")
        f.write("  rating DECIMAL(2,1),\n")
        f.write("  reviews_count INTEGER,\n")
        f.write("  google_maps_url TEXT,\n")
        f.write("  place_id VARCHAR(500),\n")
        f.write("  opening_hours JSONB,\n")
        f.write("  description TEXT,\n")
        f.write("  image_url TEXT,\n")
        f.write("  categories TEXT,\n")
        f.write("  price_level VARCHAR(20),\n")
        f.write("  permanently_closed BOOLEAN DEFAULT FALSE,\n")
        f.write("  temporarily_closed BOOLEAN DEFAULT FALSE,\n")
        f.write("  principal_name VARCHAR(200),\n")
        f.write("  school_email VARCHAR(200),\n")
        f.write("  school_number VARCHAR(20),\n")
        f.write("  ossd_credits TEXT,\n")
        f.write("  program_type VARCHAR(100),\n")
        f.write("  association_membership TEXT,\n")
        f.write("  school_level VARCHAR(50),\n")
        f.write("  created_at TIMESTAMPTZ DEFAULT NOW(),\n")
        f.write("  updated_at TIMESTAMPTZ DEFAULT NOW()\n")
        f.write(");\n\n")
        f.write("CREATE INDEX idx_schools_slug ON schools(slug);\n")
        f.write("CREATE INDEX idx_schools_type ON schools(school_type);\n")
        f.write("CREATE INDEX idx_schools_name ON schools(name);\n\n")
        f.write("-- Enable Row Level Security (public read)\n")
        f.write("ALTER TABLE schools ENABLE ROW LEVEL SECURITY;\n")
        f.write("CREATE POLICY \"Public read access\" ON schools FOR SELECT USING (true);\n\n")

    print("Saved to data/supabase_schema.sql")

    # Get column info
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='schools' ORDER BY ordinal_position")
    cols = [r['column_name'] for r in cur.fetchall()]
    print(f"Columns: {cols}")

    conn.close()

if __name__ == "__main__":
    main()
