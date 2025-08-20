import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suspiciousActivitiesTable } from '../db/schema';
import { type CreateSuspiciousActivityInput } from '../schema';
import { createSuspiciousActivity } from '../handlers/create_suspicious_activity';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateSuspiciousActivityInput = {
  description: 'Cat staring intently at the wall',
  activity_type: 'PROLONGED_STARE',
  conspiracy_points: 25
};

describe('createSuspiciousActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a suspicious activity', async () => {
    const result = await createSuspiciousActivity(testInput);

    // Basic field validation
    expect(result.description).toEqual('Cat staring intently at the wall');
    expect(result.activity_type).toEqual('PROLONGED_STARE');
    expect(result.conspiracy_points).toEqual(25);
    expect(result.id).toBeDefined();
    expect(result.recorded_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save suspicious activity to database', async () => {
    const result = await createSuspiciousActivity(testInput);

    // Query using proper drizzle syntax
    const activities = await db.select()
      .from(suspiciousActivitiesTable)
      .where(eq(suspiciousActivitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].description).toEqual('Cat staring intently at the wall');
    expect(activities[0].activity_type).toEqual('PROLONGED_STARE');
    expect(activities[0].conspiracy_points).toEqual(25);
    expect(activities[0].recorded_at).toBeInstanceOf(Date);
    expect(activities[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different activity types', async () => {
    const inputs: CreateSuspiciousActivityInput[] = [
      {
        description: 'Cat brought a "gift"',
        activity_type: 'GIFT_BRINGING',
        conspiracy_points: 30
      },
      {
        description: 'Cat suddenly purring loudly',
        activity_type: 'SUDDEN_PURRING',
        conspiracy_points: 15
      },
      {
        description: 'Cat aggressively kneading',
        activity_type: 'AGGRESSIVE_KNEADING',
        conspiracy_points: 20
      }
    ];

    for (const input of inputs) {
      const result = await createSuspiciousActivity(input);
      
      expect(result.description).toEqual(input.description);
      expect(result.activity_type).toEqual(input.activity_type);
      expect(result.conspiracy_points).toEqual(input.conspiracy_points);
    }
  });

  it('should create activities with maximum conspiracy points', async () => {
    const maxPointsInput: CreateSuspiciousActivityInput = {
      description: 'Maximum conspiracy activity',
      activity_type: 'SITTING_IN_FRONT_OF_MONITOR',
      conspiracy_points: 100 // Maximum allowed points
    };

    const result = await createSuspiciousActivity(maxPointsInput);
    
    expect(result.conspiracy_points).toEqual(100);
  });
});
