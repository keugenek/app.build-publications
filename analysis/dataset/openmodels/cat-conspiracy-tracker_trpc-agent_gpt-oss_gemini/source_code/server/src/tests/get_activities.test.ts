import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { catsTable, activitiesTable } from '../db/schema';
import { type Activity } from '../schema';
import { getActivities } from '../handlers/get_activities';
import { eq } from 'drizzle-orm';

/**
 * Helper to insert a cat and return its id.
 */
const insertCat = async () => {
  const cat = await db
    .insert(catsTable)
    .values({ name: 'Whiskers', owner_name: 'Alice' })
    .returning()
    .execute();
  return cat[0];
};

/**
 * Helper to insert an activity for a given cat.
 */
const insertActivity = async (catId: number) => {
  const activity = await db
    .insert(activitiesTable)
    .values({
      cat_id: catId,
      description: 'Climbed curtain',
      suspicion_score: (5.5).toString(), // numeric stored as string
      activity_date: '2023-01-01'
    })
    .returning()
    .execute();
  return activity[0];
};

describe('getActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all activities from the database with proper conversions', async () => {
    const cat = await insertCat();
    const inserted = await insertActivity(cat.id);

    const result: Activity[] = await getActivities();

    // Ensure we have exactly one activity
    expect(result).toHaveLength(1);
    const act = result[0];

    // Verify fields match inserted values
    expect(act.id).toBe(inserted.id);
    expect(act.cat_id).toBe(cat.id);
    expect(act.description).toBe('Climbed curtain');
    expect(act.suspicion_score).toBe(5.5);
    // activity_date should be a Date and match the inserted date (ignore time)
    expect(act.activity_date).toBeInstanceOf(Date);
    expect(act.activity_date.toISOString().startsWith('2023-01-01')).toBe(true);
    // created_at should be a Date instance
    expect(act.created_at).toBeInstanceOf(Date);
  });

  it('should return an empty array when no activities exist', async () => {
    const result = await getActivities();
    expect(result).toEqual([]);
  });
});
