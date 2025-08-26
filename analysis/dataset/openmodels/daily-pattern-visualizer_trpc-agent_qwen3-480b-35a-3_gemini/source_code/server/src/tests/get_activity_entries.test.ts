import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { type CreateActivityEntryInput } from '../schema';
import { getActivityEntries } from '../handlers/get_activity_entries';
import { eq } from 'drizzle-orm';

// Test data
const testEntry1: CreateActivityEntryInput = {
  user_id: 'user-123',
  date: new Date('2023-01-15'),
  sleep_hours: 7.5,
  work_hours: 8.0,
  social_time: 2.0,
  screen_time: 4.5,
  emotional_energy: 7
};

const testEntry2: CreateActivityEntryInput = {
  user_id: 'user-123',
  date: new Date('2023-01-16'),
  sleep_hours: 6.0,
  work_hours: 9.0,
  social_time: 1.5,
  screen_time: 5.0,
  emotional_energy: 6
};

const otherUserEntry: CreateActivityEntryInput = {
  user_id: 'user-456',
  date: new Date('2023-01-15'),
  sleep_hours: 8.0,
  work_hours: 7.5,
  social_time: 3.0,
  screen_time: 3.5,
  emotional_energy: 8
};

describe('getActivityEntries', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(activityEntriesTable).values({
      ...testEntry1,
      sleep_hours: testEntry1.sleep_hours.toString(),
      work_hours: testEntry1.work_hours.toString(),
      social_time: testEntry1.social_time.toString(),
      screen_time: testEntry1.screen_time.toString()
    }).execute();
    
    await db.insert(activityEntriesTable).values({
      ...testEntry2,
      sleep_hours: testEntry2.sleep_hours.toString(),
      work_hours: testEntry2.work_hours.toString(),
      social_time: testEntry2.social_time.toString(),
      screen_time: testEntry2.screen_time.toString()
    }).execute();
    
    await db.insert(activityEntriesTable).values({
      ...otherUserEntry,
      sleep_hours: otherUserEntry.sleep_hours.toString(),
      work_hours: otherUserEntry.work_hours.toString(),
      social_time: otherUserEntry.social_time.toString(),
      screen_time: otherUserEntry.screen_time.toString()
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch activity entries for a specific user', async () => {
    const results = await getActivityEntries('user-123');
    
    // Should return 2 entries for user-123
    expect(results).toHaveLength(2);
    
    // Check that all fields are properly converted and present
    const entry1 = results.find(e => e.date.toDateString() === testEntry1.date.toDateString());
    const entry2 = results.find(e => e.date.toDateString() === testEntry2.date.toDateString());
    
    expect(entry1).toBeDefined();
    expect(entry2).toBeDefined();
    
    // Check entry1 fields
    expect(entry1!.id).toBeTypeOf('number');
    expect(entry1!.user_id).toEqual('user-123');
    expect(entry1!.date).toEqual(testEntry1.date);
    expect(entry1!.sleep_hours).toBeCloseTo(7.5);
    expect(entry1!.work_hours).toBeCloseTo(8.0);
    expect(entry1!.social_time).toBeCloseTo(2.0);
    expect(entry1!.screen_time).toBeCloseTo(4.5);
    expect(entry1!.emotional_energy).toEqual(7);
    expect(entry1!.created_at).toBeInstanceOf(Date);
    expect(entry1!.updated_at).toBeInstanceOf(Date);
    
    // Check entry2 fields
    expect(entry2!.id).toBeTypeOf('number');
    expect(entry2!.user_id).toEqual('user-123');
    expect(entry2!.date).toEqual(testEntry2.date);
    expect(entry2!.sleep_hours).toBeCloseTo(6.0);
    expect(entry2!.work_hours).toBeCloseTo(9.0);
    expect(entry2!.social_time).toBeCloseTo(1.5);
    expect(entry2!.screen_time).toBeCloseTo(5.0);
    expect(entry2!.emotional_energy).toEqual(6);
    expect(entry2!.created_at).toBeInstanceOf(Date);
    expect(entry2!.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof entry1!.sleep_hours).toBe('number');
    expect(typeof entry1!.work_hours).toBe('number');
    expect(typeof entry1!.social_time).toBe('number');
    expect(typeof entry1!.screen_time).toBe('number');
  });

  it('should return empty array when user has no entries', async () => {
    const results = await getActivityEntries('user-nonexistent');
    expect(results).toHaveLength(0);
  });

  it('should not return entries for other users', async () => {
    const results = await getActivityEntries('user-123');
    
    // Should not contain entries for user-456
    const otherUserEntries = results.filter(e => e.user_id === 'user-456');
    expect(otherUserEntries).toHaveLength(0);
    
    // All entries should belong to user-123
    results.forEach(entry => {
      expect(entry.user_id).toEqual('user-123');
    });
  });

  it('should save entries to database correctly', async () => {
    // Test that data was actually saved to database properly
    const dbEntries = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.user_id, 'user-123'))
      .execute();
    
    expect(dbEntries).toHaveLength(2);
    
    const dbEntry1 = dbEntries.find(e => e.date.toDateString() === testEntry1.date.toDateString());
    expect(dbEntry1).toBeDefined();
    expect(parseFloat(dbEntry1!.sleep_hours)).toBeCloseTo(7.5);
    expect(parseFloat(dbEntry1!.work_hours)).toBeCloseTo(8.0);
    expect(parseFloat(dbEntry1!.social_time)).toBeCloseTo(2.0);
    expect(parseFloat(dbEntry1!.screen_time)).toBeCloseTo(4.5);
  });
});
