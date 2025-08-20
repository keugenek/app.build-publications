import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, activitiesTable } from '../db/schema';
import { type CreateActivityInput } from '../schema';
import { createActivity } from '../handlers/create_activity';
import { eq } from 'drizzle-orm';

describe('createActivity', () => {
  let testCatId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test cat first since activities require a valid cat_id
    const catResult = await db.insert(catsTable)
      .values({
        name: 'Test Cat',
        breed: 'Suspicious Tabby',
        age: 3,
        description: 'Known for plotting activities'
      })
      .returning()
      .execute();
    
    testCatId = catResult[0].id;
  });

  afterEach(resetDB);

  it('should create an activity with all required fields', async () => {
    const testInput: CreateActivityInput = {
      cat_id: testCatId,
      activity_type: 'prolonged staring',
      description: 'Stared at the wall for 3 hours straight',
      conspiracy_score: 7,
      recorded_at: new Date('2024-01-15T10:30:00Z')
    };

    const result = await createActivity(testInput);

    expect(result.cat_id).toEqual(testCatId);
    expect(result.activity_type).toEqual('prolonged staring');
    expect(result.description).toEqual('Stared at the wall for 3 hours straight');
    expect(result.conspiracy_score).toEqual(7);
    expect(result.recorded_at).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an activity with null description', async () => {
    const testInput: CreateActivityInput = {
      cat_id: testCatId,
      activity_type: 'gifting dead insects',
      description: null,
      conspiracy_score: 5
    };

    const result = await createActivity(testInput);

    expect(result.cat_id).toEqual(testCatId);
    expect(result.activity_type).toEqual('gifting dead insects');
    expect(result.description).toBeNull();
    expect(result.conspiracy_score).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should use current time when recorded_at is not provided', async () => {
    const beforeCreation = new Date();
    
    const testInput: CreateActivityInput = {
      cat_id: testCatId,
      activity_type: 'midnight zoomies',
      description: 'Running around at 3 AM for no apparent reason',
      conspiracy_score: 8
    };

    const result = await createActivity(testInput);
    const afterCreation = new Date();

    expect(result.recorded_at).toBeInstanceOf(Date);
    expect(result.recorded_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.recorded_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should save activity to database', async () => {
    const testInput: CreateActivityInput = {
      cat_id: testCatId,
      activity_type: 'knocking things off tables',
      description: 'Systematically pushed 5 items off the kitchen counter',
      conspiracy_score: 9,
      recorded_at: new Date('2024-01-16T14:25:00Z')
    };

    const result = await createActivity(testInput);

    // Verify the activity was saved to database
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].cat_id).toEqual(testCatId);
    expect(activities[0].activity_type).toEqual('knocking things off tables');
    expect(activities[0].description).toEqual('Systematically pushed 5 items off the kitchen counter');
    expect(activities[0].conspiracy_score).toEqual(9);
    expect(activities[0].recorded_at).toEqual(new Date('2024-01-16T14:25:00Z'));
    expect(activities[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle high conspiracy scores', async () => {
    const testInput: CreateActivityInput = {
      cat_id: testCatId,
      activity_type: 'world domination planning',
      description: 'Caught making detailed blueprints with paw prints',
      conspiracy_score: 10
    };

    const result = await createActivity(testInput);

    expect(result.conspiracy_score).toEqual(10);
    expect(result.activity_type).toEqual('world domination planning');
  });

  it('should handle low conspiracy scores', async () => {
    const testInput: CreateActivityInput = {
      cat_id: testCatId,
      activity_type: 'innocent napping',
      description: 'Sleeping peacefully in a sunbeam',
      conspiracy_score: 1
    };

    const result = await createActivity(testInput);

    expect(result.conspiracy_score).toEqual(1);
    expect(result.activity_type).toEqual('innocent napping');
  });


});
