"""Import Google Places JSON data into the Oakville Schools database.

Adds new columns for rating, reviews, opening hours, description, images.
De-duplicates by slug matching. Updates existing records with richer data.
"""
import json
import os
import re
import sys
import psycopg2

DB_URL = "postgresql://oakvilleadmin:OakV1ll3Sch00ls!2026@data-psql-oakvilleschools-prod.postgres.database.azure.com:5432/oakville_schools?sslmode=require"

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# Map folder name to school_type
FOLDER_TYPE_MAP = {
    "ChildCare": "daycare",
    "Montessori": "montessori",
    "PrivateSchools": "private",
    "PublicSchools": "public",
}


def make_slug(name):
    s = re.sub(r"[^a-z0-9\s-]", "", name.lower().strip())
    return re.sub(r"-+", "-", re.sub(r"\s+", "-", s)).strip("-")


def add_columns_if_missing(conn):
    """Add new columns for Google Places data."""
    cur = conn.cursor()
    columns = [
        ("rating", "DECIMAL(2,1)"),
        ("reviews_count", "INTEGER"),
        ("google_maps_url", "TEXT"),
        ("place_id", "VARCHAR(500)"),
        ("opening_hours", "JSONB"),
        ("description", "TEXT"),
        ("image_url", "TEXT"),
        ("categories", "TEXT"),
        ("price_level", "VARCHAR(20)"),
        ("permanently_closed", "BOOLEAN DEFAULT FALSE"),
        ("temporarily_closed", "BOOLEAN DEFAULT FALSE"),
    ]
    for col_name, col_type in columns:
        try:
            cur.execute(f"ALTER TABLE schools ADD COLUMN IF NOT EXISTS {col_name} {col_type}")
        except Exception:
            conn.rollback()
    conn.commit()
    print("Schema updated with new columns.")


def parse_address(place):
    """Extract structured address components from Google Places data."""
    addr = place.get("address", "")
    city = place.get("city", "Oakville")
    province = place.get("state", "Ontario")
    postal = place.get("postalCode") or place.get("zipCode")
    if not postal and addr:
        m = re.search(r"[A-Z]\d[A-Z]\s?\d[A-Z]\d", addr)
        if m:
            postal = m.group(0).upper()
    return addr, city or "Oakville", province or "Ontario", postal


def parse_phone(place):
    """Extract phone number."""
    phone = place.get("phone") or place.get("phoneUnformatted")
    if phone:
        phone = phone.strip()
        if not phone.startswith("(") and not phone.startswith("+") and len(phone) == 10:
            phone = f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
    return phone


def determine_subtype(place, school_type):
    """Determine subtype from categories and name."""
    name = (place.get("title") or "").lower()
    cats = " ".join(place.get("categories", []) or []).lower() if place.get("categories") else ""
    
    if school_type == "daycare":
        if "infant" in cats or "infant" in name:
            return "infant"
        if "toddler" in cats or "toddler" in name:
            return "toddler"
        return "daycare"
    
    if "secondary" in name or "high school" in name:
        return "secondary"
    if "middle" in name:
        return "middle"
    return "elementary"


def load_json_files():
    """Load all JSON files from data directory, tagged by folder type."""
    all_records = []
    for folder, school_type in FOLDER_TYPE_MAP.items():
        folder_path = os.path.join(DATA_DIR, folder)
        if not os.path.exists(folder_path):
            print(f"  Skipping missing folder: {folder}")
            continue
        for fname in os.listdir(folder_path):
            if not fname.endswith(".json"):
                continue
            fpath = os.path.join(folder_path, fname)
            with open(fpath, encoding="utf-8") as f:
                data = json.load(f)
            print(f"  Loaded {folder}/{fname}: {len(data)} records")
            for rec in data:
                rec["_school_type"] = school_type
                rec["_source_file"] = f"{folder}/{fname}"
            all_records.extend(data)
    return all_records


def upsert_place(cur, conn, place):
    """Insert or update a school/place. Returns 'created', 'updated', or 'skipped'."""
    name = (place.get("title") or "").strip()
    if not name:
        return "skipped"
    
    slug = make_slug(name)
    school_type = place["_school_type"]
    subtype = determine_subtype(place, school_type)
    
    addr, city, province, postal = parse_address(place)
    phone = parse_phone(place)
    website = place.get("website") or place.get("webUrl")
    rating = place.get("totalScore")
    reviews_count = place.get("reviewsCount")
    google_maps_url = place.get("url")
    place_id = place.get("placeId")
    lat = place.get("location", {}).get("lat") if place.get("location") else None
    lng = place.get("location", {}).get("lng") if place.get("location") else None
    description = place.get("description") or place.get("additionalInfo", {}).get("description") if place.get("additionalInfo") else None
    image_url = place.get("imageUrl") or place.get("thumbnailUrl")
    categories = ", ".join(place.get("categories", []) or []) if place.get("categories") else None
    price_level = place.get("priceLevel")
    permanently_closed = place.get("permanentlyClosed", False)
    temporarily_closed = place.get("temporarilyClosed", False)
    
    # Opening hours
    opening_hours = None
    if place.get("openingHours"):
        opening_hours = json.dumps(place["openingHours"])
    
    # Determine operator
    operator = None
    if school_type == "public":
        if "catholic" in (categories or "").lower() or "catholic" in name.lower():
            school_type = "catholic"
            operator = "Halton Catholic District School Board"
        else:
            operator = "Halton District School Board"
    elif school_type == "catholic":
        operator = "Halton Catholic District School Board"
    else:
        operator = name
    
    # Check for existing
    cur.execute("SELECT id, rating, reviews_count, google_maps_url, phone, website, address_line_1, latitude, description, image_url, opening_hours FROM schools WHERE slug = %s", (slug,))
    existing = cur.fetchone()
    
    if existing:
        row_id = existing[0]
        updates = []
        params = []
        
        # Update fields that are currently NULL or if we have better data
        field_map = [
            ("rating", rating, existing[1]),
            ("reviews_count", reviews_count, existing[2]),
            ("google_maps_url", google_maps_url, existing[3]),
            ("phone", phone, existing[4]),
            ("website", website, existing[5]),
            ("address_line_1", addr, existing[6]),
            ("latitude", lat, existing[7]),
            ("description", description, existing[8]),
            ("image_url", image_url, existing[9]),
            ("opening_hours", opening_hours, existing[10]),
        ]
        
        for col, new_val, old_val in field_map:
            if new_val and not old_val:
                if col == "opening_hours":
                    updates.append(f"{col} = %s::jsonb")
                else:
                    updates.append(f"{col} = %s")
                params.append(new_val)
        
        # Always update these if we have new data
        if lat and not existing[7]:
            updates.append("longitude = %s")
            params.append(lng)
        if categories:
            updates.append("categories = %s")
            params.append(categories)
        if place_id:
            updates.append("place_id = %s")
            params.append(place_id)
        if price_level:
            updates.append("price_level = %s")
            params.append(price_level)
        if postal and not cur.execute("SELECT postal_code FROM schools WHERE id = %s", (row_id,)) and not cur.fetchone()[0]:
            updates.append("postal_code = %s")
            params.append(postal)
        
        if updates:
            updates.append("updated_at = NOW()")
            sql = f"UPDATE schools SET {', '.join(updates)} WHERE id = %s"
            params.append(row_id)
            cur.execute(sql, params)
            conn.commit()
            return "updated"
        return "skipped"
    else:
        cur.execute(
            """INSERT INTO schools 
               (name, slug, school_type, subtype, operator, address_line_1, city, province,
                postal_code, phone, website, latitude, longitude, rating, reviews_count,
                google_maps_url, place_id, opening_hours, description, image_url, categories,
                price_level, permanently_closed, temporarily_closed)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s)""",
            (name, slug, school_type, subtype, operator, addr, city, province,
             postal, phone, website, lat, lng, rating, reviews_count,
             google_maps_url, place_id, opening_hours, description, image_url, categories,
             price_level, permanently_closed, temporarily_closed)
        )
        conn.commit()
        return "created"


def main():
    print("=" * 60)
    print("Google Places Data Import")
    print("=" * 60)
    
    # Connect
    print("\nConnecting to database...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    # Add new columns
    add_columns_if_missing(conn)
    
    cur.execute("SELECT count(*) FROM schools")
    before = cur.fetchone()[0]
    print(f"Schools before import: {before}")
    
    # Load all JSON files
    print("\nLoading JSON files...")
    records = load_json_files()
    print(f"Total records to process: {len(records)}")
    
    # Process each record
    stats = {"created": 0, "updated": 0, "skipped": 0, "errors": 0}
    seen_slugs = set()
    
    for place in records:
        name = (place.get("title") or "").strip()
        if not name:
            stats["skipped"] += 1
            continue
        
        slug = make_slug(name)
        if slug in seen_slugs:
            stats["skipped"] += 1
            continue
        seen_slugs.add(slug)
        
        try:
            result = upsert_place(cur, conn, place)
            stats[result] += 1
            if result == "created":
                print(f"  + {name}")
            elif result == "updated":
                print(f"  ~ {name}")
        except Exception as e:
            print(f"  ERROR {name}: {e}")
            conn.rollback()
            stats["errors"] += 1
    
    # Final counts
    cur.execute("SELECT count(*) FROM schools")
    after = cur.fetchone()[0]
    cur.execute("SELECT school_type, count(*) FROM schools GROUP BY school_type ORDER BY count(*) DESC")
    breakdown = cur.fetchall()
    cur.execute("SELECT count(*) FROM schools WHERE rating IS NOT NULL")
    with_rating = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM schools WHERE google_maps_url IS NOT NULL")
    with_maps = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM schools WHERE opening_hours IS NOT NULL")
    with_hours = cur.fetchone()[0]
    
    conn.close()
    
    print(f"\n{'=' * 60}")
    print(f"IMPORT COMPLETE")
    print(f"{'=' * 60}")
    print(f"Before:  {before}")
    print(f"After:   {after}")
    print(f"Created: {stats['created']}")
    print(f"Updated: {stats['updated']}")
    print(f"Skipped: {stats['skipped']} (duplicates/empty)")
    print(f"Errors:  {stats['errors']}")
    print(f"\nWith ratings:      {with_rating}")
    print(f"With Maps URL:     {with_maps}")
    print(f"With opening hours:{with_hours}")
    print(f"\nBreakdown by type:")
    for row in breakdown:
        print(f"  {row[0]:15s} {row[1]:4d}")


if __name__ == "__main__":
    main()
