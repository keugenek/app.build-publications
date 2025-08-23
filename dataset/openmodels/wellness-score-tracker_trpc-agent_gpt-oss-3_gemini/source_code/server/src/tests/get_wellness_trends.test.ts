import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { getWellnessTrends } from '../handlers/get_wellness_trends';
import { sql } from 'drizzle-orm';

/** Helper to insert a wellness entry */
async function insertEntry(params: {
  sleep_hours: number;
  stress_level: number;
  caffeine_servings: number;
  alcohol_servings: number;
  wellness_score: number;
  created_at?: Date;
}) {
  const { sleep_hours, stress_level, caffeine_servings, alcohol_servings, wellness_score, created_at } = params;
  const values: any = {
    sleep_hours: sleep_hours.toString(),
    stress_level,
    caffeine_servings,
    alcohol_servings,
    wellness_score: wellness_score.toString(),
  };
  if (created_at) {
    // Set created_at directly as Date object; Drizzle will handle conversion
    values.created_at = created_at;
  }
  const result = await db
    .insert(wellnessEntriesTable)
    .values(values)
    .returning()
    .execute();
  return result[0];
}

describe('getWellnessTrends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns average wellness scores grouped by date', async () => {
    // Insert entries for two dates
    const today = new Date('2025-01-01T10:00:00Z');
    const tomorrow = new Date('2025-01-02T12:00:00Z');

    await insertEntry({
      sleep_hours: 7.5,
      stress_level: 3,
      caffeine_servings: 2,
      alcohol_servings: 0,
      wellness_score: 80,
      created_at: today,
    });
    await insertEntry({
      sleep_hours: 6.0,
      stress_level: 2,
      caffeine_servings: 1,
      alcohol_servings: 0,
      wellness_score: 60,
      created_at: today,
    });
    await insertEntry({
      sleep_hours: 8.0,
      stress_level: 4,
      caffeine_servings: 3,
      alcohol_servings: 1,
      wellness_score: 90,
      created_at: tomorrow,
    });

    const trends = await getWellnessTrends();

    // Expect two dates
    expect(trends).toHaveLength(2);

    // Find trend for today
    const todayTrend = trends.find((t) => t.date === '2025-01-01');
    const tomorrowTrend = trends.find((t) => t.date === '2025-01-02');

    expect(todayTrend).toBeDefined();
    expect(tomorrowTrend).toBeDefined();

    // Average of 80 and 60 = 70
    expect(todayTrend?.averageScore).toBeCloseTo(70);
    // Only one entry for tomorrow = 90
    expect(tomorrowTrend?.averageScore).toBeCloseTo(90);
  });
});
