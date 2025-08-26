import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';

describe('getWellnessEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch wellness entries for a specific user', async () => {
    const userId = 'test-user-123';
    
    // Insert test data
    const entry1 = await db.insert(wellnessEntriesTable).values({
      user_id: userId,
      sleep_hours: '7.5',
      stress_level: 5,
      caffeine_intake: 2,
      alcohol_intake: 1,
      wellness_score: '85.5',
      created_at: new Date('2023-01-01')
    }).returning().execute().then(result => result[0]);
    
    const entry2 = await db.insert(wellnessEntriesTable).values({
      user_id: userId,
      sleep_hours: '6.0',
      stress_level: 8,
      caffeine_intake: 3,
      alcohol_intake: 0,
      wellness_score: '70.0',
      created_at: new Date('2023-01-02')
    }).returning().execute().then(result => result[0]);
    
    // Insert entry for different user (should not be returned)
    await db.insert(wellnessEntriesTable).values({
      user_id: 'other-user-456',
      sleep_hours: '8.0',
      stress_level: 3,
      caffeine_intake: 1,
      alcohol_intake: 0,
      wellness_score: '90.0',
      created_at: new Date('2023-01-03')
    }).execute();
    
    // Fetch entries for our user
    const entries = await getWellnessEntries(userId);
    
    expect(entries).toHaveLength(2);
    entries.forEach(entry => {
      expect(entry.user_id).toBe(userId);
      expect(typeof entry.sleep_hours).toBe('number');
      expect(typeof entry.wellness_score).toBe('number');
      expect(entry.created_at).toBeInstanceOf(Date);
    });
    
    // Verify the entries are returned in descending order by date (newest first)
    expect(entries[0].id).toBe(entry2.id);
    expect(entries[1].id).toBe(entry1.id);
  });

  it('should filter entries by date range', async () => {
    const userId = 'test-user-123';
    const startDate = new Date('2023-01-02');
    const endDate = new Date('2023-01-04');
    
    // Insert test data with different dates
    await db.insert(wellnessEntriesTable).values({
      user_id: userId,
      sleep_hours: '7.0',
      stress_level: 4,
      caffeine_intake: 1,
      alcohol_intake: 0,
      wellness_score: '80.0',
      created_at: new Date('2023-01-01') // Before range
    }).execute();
    
    const expectedEntry = await db.insert(wellnessEntriesTable).values({
      user_id: userId,
      sleep_hours: '8.0',
      stress_level: 3,
      caffeine_intake: 0,
      alcohol_intake: 0,
      wellness_score: '90.0',
      created_at: new Date('2023-01-03') // Within range
    }).returning().execute().then(result => result[0]);
    
    await db.insert(wellnessEntriesTable).values({
      user_id: userId,
      sleep_hours: '6.5',
      stress_level: 6,
      caffeine_intake: 2,
      alcohol_intake: 1,
      wellness_score: '75.0',
      created_at: new Date('2023-01-05') // After range
    }).execute();
    
    // Fetch entries within date range
    const entries = await getWellnessEntries(userId, { 
      startDate, 
      endDate 
    });
    
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(expectedEntry.id);
    expect(entries[0].sleep_hours).toBe(parseFloat(expectedEntry.sleep_hours));
    expect(entries[0].wellness_score).toBe(parseFloat(expectedEntry.wellness_score));
  });

  it('should support pagination with limit and offset', async () => {
    const userId = 'test-user-123';
    
    // Insert multiple entries
    const insertedEntries = [];
    for (let i = 1; i <= 5; i++) {
      const entry = await db.insert(wellnessEntriesTable).values({
        user_id: userId,
        sleep_hours: (7 + i).toString(),
        stress_level: i,
        caffeine_intake: i,
        alcohol_intake: i % 2,
        wellness_score: (70 + i * 2).toString(),
        created_at: new Date(`2023-01-0${i}`)
      }).returning().execute().then(result => result[0]);
      
      insertedEntries.push(entry);
    }
    
    // Test limit
    const firstPage = await getWellnessEntries(userId, {
      limit: 2
    });
    
    expect(firstPage).toHaveLength(2);
    
    // Test offset
    const secondPage = await getWellnessEntries(userId, {
      limit: 2,
      offset: 2
    });
    
    expect(secondPage).toHaveLength(2);
    
    // Verify no overlap between pages
    const firstPageIds = firstPage.map(e => e.id);
    const secondPageIds = secondPage.map(e => e.id);
    expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
  });

  it('should return empty array when no entries exist for user', async () => {
    const entries = await getWellnessEntries('non-existent-user');
    expect(entries).toHaveLength(0);
  });

  it('should handle case with no filters provided', async () => {
    const userId = 'test-user-789';
    
    // Insert test data
    const insertedEntry = await db.insert(wellnessEntriesTable).values({
      user_id: userId,
      sleep_hours: '7.5',
      stress_level: 5,
      caffeine_intake: 2,
      alcohol_intake: 1,
      wellness_score: '85.5',
      created_at: new Date()
    }).returning().execute().then(result => result[0]);
    
    // Fetch without any filters
    const entries = await getWellnessEntries(userId);
    
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(insertedEntry.id);
    expect(entries[0].user_id).toBe(userId);
    expect(typeof entries[0].sleep_hours).toBe('number');
    expect(typeof entries[0].wellness_score).toBe('number');
  });
});
