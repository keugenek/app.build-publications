import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { getDailyConspiracy } from '../handlers/get_daily_conspiracy';
import { type DailyConspiracy } from '../schema';

describe('getDailyConspiracy handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns empty array when no activities', async () => {
    const result = await getDailyConspiracy();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
    expect(result).toHaveLength(0);
  });

  it('groups activities by date and sums points', async () => {
    // Insert activities across two dates
    await db.insert(activitiesTable).values([
      {
        type: 'PROLONGED_STARING',
        points: 5,
        created_at: new Date('2025-01-01T10:00:00Z'),
      },
      {
        type: 'DEAD_INSECT_GIFT',
        points: 7,
        created_at: new Date('2025-01-01T15:30:00Z'),
      },
      {
        type: 'LIVE_ANIMAL_GIFT',
        points: 3,
        created_at: new Date('2025-01-02T09:45:00Z'),
      },
    ]).execute();

    const result: DailyConspiracy[] = await getDailyConspiracy();

    expect(result).toHaveLength(2);

    // First day should be 2025-01-01
    const first = result[0];
    expect(first.date.getTime()).toBe(new Date('2025-01-01').getTime());
    expect(first.totalPoints).toBe(12);
    expect(first.activities).toHaveLength(2);
    // Verify activity fields exist
    expect(first.activities[0]).toMatchObject({ points: expect.any(Number) });

    // Second day
    const second = result[1];
    expect(second.date.getTime()).toBe(new Date('2025-01-02').getTime());
    expect(second.totalPoints).toBe(3);
    expect(second.activities).toHaveLength(1);
    expect(second.activities[0].type).toBe('LIVE_ANIMAL_GIFT');
  });
});
