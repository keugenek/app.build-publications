import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { getActivities } from '../handlers/get_activities';
import { type Activity } from '../schema';

// Helper to insert activity directly
const insertActivity = async (activity: {
  type: string;
  points: number;
}): Promise<Activity> => {
  const [row] = await db
    .insert(activitiesTable)
    .values({
      type: activity.type as any, // enum string
      points: activity.points,
    })
    .returning()
    .execute();
  return {
    id: row.id,
    type: row.type,
    points: row.points,
    created_at: row.created_at,
  } as Activity;
};

describe('getActivities handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no activities exist', async () => {
    const result = await getActivities();
    expect(result).toEqual([]);
  });

  it('should fetch all logged activities from the database', async () => {
    // Insert two activities
    const activity1 = await insertActivity({ type: 'PROLONGED_STARING', points: 5 });
    const activity2 = await insertActivity({ type: 'MIDNIGHT_ZOOMIES', points: 10 });

    const result = await getActivities();

    // Sort by id to have deterministic order
    const sorted = result.sort((a, b) => a.id - b.id);

    expect(sorted).toHaveLength(2);
    expect(sorted[0]).toMatchObject({
      id: activity1.id,
      type: activity1.type,
      points: activity1.points,
      created_at: expect.any(Date),
    });
    expect(sorted[1]).toMatchObject({
      id: activity2.id,
      type: activity2.type,
      points: activity2.points,
      created_at: expect.any(Date),
    });
  });
});
