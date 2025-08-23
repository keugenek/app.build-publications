import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorsTable, catsTable } from '../db/schema';
import { type RecordBehaviorInput } from '../schema';
import { recordBehavior } from '../handlers/record_behavior';
import { eq } from 'drizzle-orm';

// Test cat data
const testCat = {
  name: 'Fluffy',
  breed: 'Persian',
  age: 3
};

// Test behavior input
const testInput: RecordBehaviorInput = {
  cat_id: 1,
  behavior_type: 'STARE_DOWN',
  description: 'Stared at the wall for hours',
  intensity: 8,
  duration_minutes: 45,
  recorded_at: new Date()
};

describe('recordBehavior', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test cat first since behavior has a foreign key to cat
    await db.insert(catsTable).values(testCat).execute();
  });
  
  afterEach(resetDB);

  it('should record a behavior for a cat', async () => {
    const result = await recordBehavior(testInput);

    // Basic field validation
    expect(result.cat_id).toEqual(testInput.cat_id);
    expect(result.behavior_type).toEqual(testInput.behavior_type);
    expect(result.description).toEqual(testInput.description);
    expect(result.intensity).toEqual(testInput.intensity);
    expect(result.duration_minutes).toEqual(testInput.duration_minutes);
    expect(result.id).toBeDefined();
    expect(result.recorded_at.getTime()).toEqual(testInput.recorded_at!.getTime());
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save behavior to database', async () => {
    const result = await recordBehavior(testInput);

    // Query using proper drizzle syntax
    const behaviors = await db.select()
      .from(behaviorsTable)
      .where(eq(behaviorsTable.id, result.id))
      .execute();

    expect(behaviors).toHaveLength(1);
    expect(behaviors[0].cat_id).toEqual(testInput.cat_id);
    expect(behaviors[0].behavior_type).toEqual(testInput.behavior_type);
    expect(behaviors[0].description).toEqual(testInput.description);
    expect(behaviors[0].intensity).toEqual(testInput.intensity);
    expect(behaviors[0].duration_minutes).toEqual(testInput.duration_minutes);
    expect(behaviors[0].recorded_at.getTime()).toEqual(testInput.recorded_at!.getTime());
    expect(behaviors[0].created_at).toBeInstanceOf(Date);
  });

  it('should work without optional recorded_at field', async () => {
    const inputWithoutDate: RecordBehaviorInput = {
      cat_id: 1,
      behavior_type: 'LURKING',
      description: 'Lurking in the shadows',
      intensity: 7,
      duration_minutes: 30
    };

    const beforeTime = new Date();
    const result = await recordBehavior(inputWithoutDate);
    const afterTime = new Date();

    expect(result.cat_id).toEqual(inputWithoutDate.cat_id);
    expect(result.behavior_type).toEqual(inputWithoutDate.behavior_type);
    expect(result.description).toEqual(inputWithoutDate.description);
    expect(result.intensity).toEqual(inputWithoutDate.intensity);
    expect(result.duration_minutes).toEqual(inputWithoutDate.duration_minutes);
    expect(result.id).toBeDefined();
    expect(result.recorded_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Check that recorded_at is within expected time range
    const recordedAt = result.recorded_at;
    expect(recordedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(recordedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it('should throw error for non-existent cat_id', async () => {
    const invalidInput: RecordBehaviorInput = {
      cat_id: 999, // Non-existent cat ID
      behavior_type: 'STARE_DOWN',
      description: 'Test description',
      intensity: 5,
      duration_minutes: 10
    };

    await expect(recordBehavior(invalidInput)).rejects.toThrow();
  });
});
