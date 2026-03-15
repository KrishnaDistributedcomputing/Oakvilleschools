import { query } from '../db/pool';
import { RawSchoolRecord, SchoolType } from '../types';
import { buildNormalizedSchool } from './normalization';
import logger from '../logger';

export async function normalizeAndSave(
  rawRecord: RawSchoolRecord,
  sourceId: number,
  schoolType: SchoolType,
  operator?: string,
  extra?: { ageRange?: string; licensed?: boolean }
): Promise<number> {
  const normalized = buildNormalizedSchool(
    rawRecord.rawName,
    rawRecord.rawAddress,
    schoolType,
    {
      rawPhone: rawRecord.rawPhone,
      rawWebsite: rawRecord.rawWebsite,
      rawGrades: rawRecord.rawGrades,
      operator,
      ageRange: extra?.ageRange,
      licensed: extra?.licensed,
    }
  );

  // Check if school already exists by slug
  const existing = await query('SELECT id FROM schools WHERE slug = $1', [normalized.slug]);

  let schoolId: number;

  if (existing.rows.length > 0) {
    schoolId = existing.rows[0].id;
    // Update existing record
    await query(
      `UPDATE schools SET
        name = $1,
        school_type = $2,
        operator = $3,
        address_line_1 = $4,
        city = $5,
        province = $6,
        postal_code = $7,
        phone = COALESCE($8, phone),
        website = COALESCE($9, website),
        grades = COALESCE($10, grades),
        age_range = COALESCE($11, age_range),
        licensed = COALESCE($12, licensed),
        updated_at = NOW()
      WHERE id = $13`,
      [
        normalized.name,
        normalized.schoolType,
        normalized.operator,
        normalized.addressLine1,
        normalized.city,
        normalized.province,
        normalized.postalCode,
        normalized.phone || null,
        normalized.website || null,
        normalized.grades || null,
        normalized.ageRange || null,
        normalized.licensed ?? null,
        schoolId,
      ]
    );
    logger.debug(`Updated school: ${normalized.name} (id: ${schoolId})`);
  } else {
    const result = await query(
      `INSERT INTO schools (name, slug, school_type, subtype, operator, address_line_1, city, province, postal_code, phone, website, grades, age_range, licensed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        normalized.name,
        normalized.slug,
        normalized.schoolType,
        normalized.subtype || null,
        normalized.operator || null,
        normalized.addressLine1,
        normalized.city,
        normalized.province,
        normalized.postalCode || null,
        normalized.phone || null,
        normalized.website || null,
        normalized.grades || null,
        normalized.ageRange || null,
        normalized.licensed ?? null,
      ]
    );
    schoolId = result.rows[0].id;
    logger.debug(`Created school: ${normalized.name} (id: ${schoolId})`);
  }

  // Record observation
  await query(
    `INSERT INTO school_observations (school_id, source_id, observed_name, observed_address, observed_phone, observed_website, source_url, confidence_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      schoolId,
      sourceId,
      rawRecord.rawName,
      rawRecord.rawAddress,
      rawRecord.rawPhone || null,
      rawRecord.rawWebsite || null,
      rawRecord.rawPayload?.profileUrl || '',
      1.0,
    ]
  );

  return schoolId;
}
