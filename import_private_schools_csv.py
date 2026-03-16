"""Parse Ontario private school CSV + enrich Oakville schools DB."""
import csv
import re
import sys
import psycopg2

DB_URL = "postgresql://oakvilleadmin:OakV1ll3Sch00ls!2026@data-psql-oakvilleschools-prod.postgres.database.azure.com:5432/oakville_schools?sslmode=require"
CSV_PATH = "data/private_school_contact_information_eng_1.csv"

def make_slug(name):
    s = re.sub(r"[^a-z0-9\s-]", "", name.lower().strip())
    return re.sub(r"-+", "-", re.sub(r"\s+", "-", s)).strip("-")

def add_columns(conn):
    cur = conn.cursor()
    cols = [
        ("principal_name", "VARCHAR(200)"),
        ("school_email", "VARCHAR(200)"),
        ("school_number", "VARCHAR(20)"),
        ("ossd_credits", "TEXT"),
        ("program_type", "VARCHAR(100)"),
        ("association_membership", "TEXT"),
        ("school_level", "VARCHAR(50)"),
        ("fax", "VARCHAR(30)"),
    ]
    for col, typ in cols:
        try:
            cur.execute(f"ALTER TABLE schools ADD COLUMN IF NOT EXISTS {col} {typ}")
        except Exception:
            conn.rollback()
    conn.commit()
    print("Schema updated with new columns.")

def main():
    # 1. Parse CSV for Oakville schools
    oakville_schools = []
    with open(CSV_PATH, encoding="latin-1") as f:
        reader = csv.DictReader(f)
        for row in reader:
            city = (row.get("City") or "").strip().lower()
            if "oakville" in city:
                oakville_schools.append(row)
    
    print(f"Found {len(oakville_schools)} Oakville schools in CSV:")
    for s in oakville_schools:
        print(f"  - {s['School Name']} | {s['School Level']} | {s['Street Address']}")
    
    # 2. Connect to DB and add columns
    conn = psycopg2.connect(DB_URL, connect_timeout=60)
    cur = conn.cursor()
    add_columns(conn)
    
    cur.execute("SELECT count(*) FROM schools")
    before = cur.fetchone()[0]
    print(f"\nDB before: {before} schools")
    
    created = 0
    updated = 0
    skipped = 0
    
    for row in oakville_schools:
        name = row["School Name"].strip()
        slug = make_slug(name)
        addr = row.get("Street Address", "").strip()
        suite = row.get("Suite", "").strip()
        if suite:
            addr = f"{suite}-{addr}"
        city = row.get("City", "Oakville").strip()
        province = row.get("Province", "Ontario").strip()
        postal = row.get("Postal Code", "").strip()
        if postal and len(postal) == 6:
            postal = postal[:3] + " " + postal[3:]
        phone = row.get("Telephone Number", "").strip()
        fax = row.get("Fax", "").strip() or None
        website = row.get("School Website", "").strip()
        if website and not website.startswith("http"):
            website = "https://" + website
        email = row.get("School Email Address", "").strip() or None
        principal = row.get("Principal Name", "").strip() or None
        school_number = row.get("School Number", "").strip() or None
        ossd = row.get("OSSD Credits Offered", "").strip() or None
        level = row.get("School Level", "").strip() or None
        prog_type = row.get("Program Type", "").strip() or None
        assoc = row.get("Association Membership", "").strip() or None
        
        # Determine school type
        name_lower = name.lower()
        if "montessori" in name_lower:
            school_type = "montessori"
        elif "daycare" in name_lower or "childcare" in name_lower or "child care" in name_lower:
            school_type = "daycare"
        elif "islamic" in name_lower or "muslim" in name_lower or "khalsa" in name_lower:
            school_type = "private"
        else:
            school_type = "private"
        
        # Determine subtype
        if level and "elem" in level.lower() and "sec" in level.lower():
            subtype = "elementary"  # Elem/Sec
        elif level and "sec" in level.lower():
            subtype = "secondary"
        else:
            subtype = "elementary"
        
        full_addr = f"{addr}, {city}, {province} {postal}".strip(", ")
        
        # Check if exists
        cur.execute("SELECT id, principal_name, school_email, phone, website, address_line_1, postal_code, fax FROM schools WHERE slug = %s", (slug,))
        existing = cur.fetchone()
        
        if existing:
            row_id = existing[0]
            updates = []
            params = []
            field_map = [
                ("principal_name", principal, existing[1]),
                ("school_email", email, existing[2]),
                ("phone", phone, existing[3]),
                ("website", website, existing[4]),
                ("address_line_1", full_addr, existing[5]),
                ("postal_code", postal, existing[6]),
                ("fax", fax, existing[7]),
            ]
            for col, new, old in field_map:
                if new and not old:
                    updates.append(f"{col} = %s")
                    params.append(new)
            
            # Always set these enrichment fields
            always_set = [
                ("school_number", school_number),
                ("ossd_credits", ossd),
                ("program_type", prog_type),
                ("association_membership", assoc),
                ("school_level", level),
            ]
            for col, val in always_set:
                if val:
                    updates.append(f"{col} = %s")
                    params.append(val)
            
            if updates:
                updates.append("updated_at = NOW()")
                sql = f"UPDATE schools SET {', '.join(updates)} WHERE id = %s"
                params.append(row_id)
                cur.execute(sql, params)
                conn.commit()
                updated += 1
                print(f"  ~ Updated: {name}")
            else:
                skipped += 1
        else:
            cur.execute(
                """INSERT INTO schools 
                   (name, slug, school_type, subtype, operator, address_line_1, city, province,
                    postal_code, phone, fax, website, principal_name, school_email, school_number,
                    ossd_credits, program_type, association_membership, school_level)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (name, slug, school_type, subtype, name, full_addr, city, province,
                 postal, phone or None, fax, website or None, principal, email, school_number,
                 ossd, prog_type, assoc, level)
            )
            conn.commit()
            created += 1
            print(f"  + Created: {name}")
    
    cur.execute("SELECT count(*) FROM schools")
    after = cur.fetchone()[0]
    cur.execute("SELECT school_type, count(*) FROM schools GROUP BY school_type ORDER BY count(*) DESC")
    breakdown = cur.fetchall()
    cur.execute("SELECT count(*) FROM schools WHERE principal_name IS NOT NULL")
    with_principal = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM schools WHERE school_email IS NOT NULL")
    with_email = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM schools WHERE ossd_credits IS NOT NULL")
    with_ossd = cur.fetchone()[0]
    
    conn.close()
    
    print(f"\n{'='*50}")
    print(f"IMPORT COMPLETE")
    print(f"Before: {before} | After: {after}")
    print(f"Created: {created} | Updated: {updated} | Skipped: {skipped}")
    print(f"With principal: {with_principal}")
    print(f"With email: {with_email}")
    print(f"With OSSD info: {with_ossd}")
    print(f"\nBreakdown:")
    for r in breakdown:
        print(f"  {r[0]:15s} {r[1]:4d}")

if __name__ == "__main__":
    main()
