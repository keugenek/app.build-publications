import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { type CreateActivityEntryInput } from '../schema';
import { getActivityEntry } from '../handlers/get_activity_entry';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateActivityEntryInput = {
  user_id: 'user123',
  date: new Date('2023-01-15'),
  sleep_hours: 8.5,
  work_hours: 7,
  social_time: 2.5,
  screen_time: 4.5,
  emotional_energy: 7
};

describe('getActivityEntry', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a test record directly for testing
    await db.insert(activityEntriesTable).values({
      ...testInput,
      sleep_hours: testInput.sleep_hours.toString(),
      work_hours: testInput.work_hours.toString(),
      social_time: testInput.social_time.toString(),
      screen_time: testInput.screen_time.toString()
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch an existing activity entry by ID', async () => {
    // First get the ID of the inserted record
    const insertedRecords = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.user_id, 'user123'))
      .execute();
    
    expect(insertedRecords).toHaveLength(1);
    const insertedId = insertedRecords[0].id;
    
    // Now test our handler
    const result = await getActivityEntry(insertedId);
    
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    
    if (result) {
      expect(result.id).toEqual(insertedId);
      expect(result.user_id).toEqual('user123');
      expect(result.date).toEqual(new Date('2023-01-15'));
      expect(result.sleep_hours).toEqual(8.5);
      expect(result.work_hours).toEqual(7);
      expect(result.social_time).toEqual(2.5);
      expect(result.screen_time).toEqual(4.5);
      expect(result.emotional_energy).toEqual(7);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(typeof result.sleep_hours).toEqual('number');
      expect(typeof result.work_hours).toEqual('number');
      expect(typeof result.social_time).toEqual('number');
      expect(typeof result.screen_time).toEqual('number');
    }
  });

  it('should return null for non-existent activity entry', async () => {
    const result = await getActivityEntry(99999);
    expect(result).toBeNull();
  });

  it('should properly convert numeric values', async () => {
    // Insert another record with specific numeric values
    const result = await db.insert(activityEntriesTable).values({
      user_id: 'user456',
      date: new Date('2023-02-20'),
      sleep_hours: '6.2',
      work_hours: '8.0',
      social_time: '1.5',
      screen_time: '5.7',
      emotional_energy: 5
    }).returning().execute();
    
    const insertedId = result[0].id;
    const entry = await getActivityEntry(insertedId);
    
    expect(entry).not.toBeNull();
    if (entry) {
      expect(entry.sleep_hours).toEqual(6.2);
      expect(entry.work_hours).toEqual(8.0);
      expect(entry.social_time).toEqual(1.5);
      expect(entry.screen_time).toEqual(5.7);
      expect(typeof entry.sleep_hours).toEqual('number');
      expect(typeof entry.work_hours).toEqual('number');
      expect(typeof entry.social_time).toEqual('number');
      expect(typeof entry.screen_time).toEqual('number');
    }
  });
});
