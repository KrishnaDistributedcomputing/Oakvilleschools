"""Generate Supabase SQL seed file from exported JSON data."""
import json
import re

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, dict) or isinstance(val, list):
        return "'" + json.dumps(val).replace("'", "''") + "'::jsonb"
    s = str(val).replace("'", "''")
    return f"'{s}'"

def main():
    with open("data/schools_export.json", encoding="utf-8") as f:
        schools = json.load(f)

    cols = [
        "name", "slug", "school_type", "subtype", "operator",
        "address_line_1", "city", "province", "postal_code",
        "phone", "fax", "website", "grades", "age_range", "licensed",
        "latitude", "longitude", "rating", "reviews_count",
        "google_maps_url", "place_id", "opening_hours", "description",
        "image_url", "categories", "price_level",
        "permanently_closed", "temporarily_closed",
        "principal_name", "school_email", "school_number",
        "ossd_credits", "program_type", "association_membership", "school_level"
    ]

    with open("data/supabase_seed.sql", "w", encoding="utf-8") as f:
        f.write("-- Seed data for Oakville Schools Directory\n")
        f.write(f"-- {len(schools)} schools\n\n")

        for school in schools:
            values = []
            for col in cols:
                val = school.get(col)
                values.append(escape_sql(val))

            f.write(f"INSERT INTO schools ({', '.join(cols)}) VALUES ({', '.join(values)});\n")

        f.write(f"\n-- Total: {len(schools)} schools inserted\n")

    print(f"Generated data/supabase_seed.sql with {len(schools)} INSERT statements")

if __name__ == "__main__":
    main()
