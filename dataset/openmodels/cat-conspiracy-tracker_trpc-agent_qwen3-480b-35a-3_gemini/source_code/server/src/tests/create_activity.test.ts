import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type CreateActivityInput } from '../schema';
import { createActivity } from '../handlers/create_activity';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateActivityInput = {
  description: 'Staring intently at the wall for 10 minutes',
  activity_type: 'Prolonged Staring',
  date: new Date('2023-05-15')
};

describe('createActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new activity', async () => {
    const result = await createActivity(testInput);

    // Basic field validation
    expect(result.description).toEqual(testInput.description);
    expect(result.activity_type).toEqual(testInput.activity_type);
    expect(result.suspicion_score).toEqual(5); // Prolonged Staring score
    expect(result.date.getTime()).toEqual(testInput.date!.getTime());
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save activity to database', async () => {
    const result = await createActivity(testInput);

    // Query using proper drizzle syntax
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].description).toEqual(testInput.description);
    expect(activities[0].activity_type).toEqual(testInput.activity_type);
    expect(activities[0].suspicion_score).toEqual(5);
    expect(new Date(activities[0].date).getTime()).toEqual(testInput.date!.getTime());
    expect(activities[0].created_at).toBeInstanceOf(Date);
  });

  it('should use current date when date is not provided', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for comparison
    
    const inputWithoutDate: CreateActivityInput = {
      description: 'Running wildly through the house at 3am',
      activity_type: 'Midnight Zoomies'
    };

    const result = await createActivity(inputWithoutDate);

    // Check that the date is today (or very close to it)
    const resultDate = new Date(result.date);
    resultDate.setHours(0, 0, 0, 0); // Reset time part for comparison
    expect(resultDate).toEqual(today);
    
    // Verify suspicion score for Midnight Zoomies
    expect(result.suspicion_score).toEqual(3);
  });

  it('should correctly map all activity types to their suspicion scores', async () => {
    const activityTypesWithScores = [
      { type: 'Prolonged Staring' as const, score: 5 },
      { type: 'Midnight Zoomies' as const, score: 3 },
      { type: 'Leaving \'Gifts\' (dead insects, toys, etc.)' as const, score: 10 },
      { type: 'Silent Judgment' as const, score: 7 },
      { type: 'Plotting on the Keyboard' as const, score: 8 }
    ];

    for (const { type, score } of activityTypesWithScores) {
      const input: CreateActivityInput = {
        description: `Testing activity type: ${type}`,
        activity_type: type,
        date: new Date('2023-05-15')
      };

      const result = await createActivity(input);
      expect(result.activity_type).toEqual(type);
      expect(result.suspicion_score).toEqual(score);
    }
  });
});
