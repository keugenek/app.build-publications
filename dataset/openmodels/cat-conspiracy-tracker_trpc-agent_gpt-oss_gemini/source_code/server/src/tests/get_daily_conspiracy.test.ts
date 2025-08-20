import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { catsTable, activitiesTable } from '../db/schema';
import { getDailyConspiracy } from '../handlers/get_daily_conspiracy';

// Helper to insert a cat and return its id
const insertCat = async (name: string, owner_name: string | null = null) => {
  const result = await db
    .insert(catsTable)
    .values({ name, owner_name })
    .returning()
    .execute();
  return result[0].id;
};

// Helper to insert an activity for a cat
const insertActivity = async (
  cat_id: number,
  description: string,
  suspicion_score: number,
  activity_date: Date
) => {
  // Convert Date to YYYY-MM-DD string for the DATE column
  const dateString = activity_date.toISOString().slice(0, 10);
  await db
    .insert(activitiesTable)
    .values({
      cat_id,
      description,
      suspicion_score: suspicion_score.toString(), // numeric column expects string
      activity_date: dateString,
    })
    .execute();
};

describe('getDailyConspiracy', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('aggregates suspicion scores per cat per day', async () => {
    const catId = await insertCat('Whiskers');
    const today = new Date();
    // Insert two activities for the same cat on the same day
    await insertActivity(catId, 'Climbed curtains', 3.5, today);
    await insertActivity(catId, 'Knocked over vase', 2.0, today);

    const results = await getDailyConspiracy();

    expect(results).toHaveLength(1);
    const record = results[0];
    expect(record.cat_id).toBe(catId);
    expect(record.date).toBeInstanceOf(Date);
    // Compare only the date portion
    expect(record.date.toDateString()).toBe(today.toDateString());
    expect(record.total_score).toBeCloseTo(5.5);
  });

  it('handles multiple cats and dates', async () => {
    const catA = await insertCat('Mittens');
    const catB = await insertCat('Paws');
    const day1 = new Date('2023-01-01');
    const day2 = new Date('2023-01-02');

    // Cat A activities on two different days
    await insertActivity(catA, 'Ran in circles', 1.0, day1);
    await insertActivity(catA, 'Chased laser', 2.5, day2);
    // Cat B activity on day1 only
    await insertActivity(catB, 'Scratched sofa', 4.0, day1);

    const results = await getDailyConspiracy();

    // Expect three aggregated records (catA-day1, catA-day2, catB-day1)
    expect(results).toHaveLength(3);
    const find = (cat_id: number, date: Date) =>
      results.find(r => r.cat_id === cat_id && r.date.toDateString() === date.toDateString());

    const recA1 = find(catA, day1);
    const recA2 = find(catA, day2);
    const recB1 = find(catB, day1);

    expect(recA1?.total_score).toBeCloseTo(1.0);
    expect(recA2?.total_score).toBeCloseTo(2.5);
    expect(recB1?.total_score).toBeCloseTo(4.0);
  });
});
