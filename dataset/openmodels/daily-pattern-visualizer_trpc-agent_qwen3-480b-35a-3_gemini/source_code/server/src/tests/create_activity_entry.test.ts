import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { type CreateActivityEntryInput } from '../schema';
import { createActivityEntry } from '../handlers/create_activity_entry';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateActivityEntryInput = {
  user_id: 'user-123',
  date: new Date('2023-01-15'),
  sleep_hours: 7.5,
  work_hours: 8.0,
  social_time: 2.5,
  screen_time: 4.0,
  emotional_energy: 7
};

describe('createActivityEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an activity entry', async () => {
    const result = await createActivityEntry(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user-123');
    expect(result.date).toEqual(new Date('2023-01-15'));
    expect(result.sleep_hours).toEqual(7.5);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_time).toEqual(2.5);
    expect(result.screen_time).toEqual(4.0);
    expect(result.emotional_energy).toEqual(7);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof result.sleep_hours).toBe('number');
    expect(typeof result.work_hours).toBe('number');
    expect(typeof result.social_time).toBe('number');
    expect(typeof result.screen_time).toBe('number');
  });

  it('should save activity entry to database', async () => {
    const result = await createActivityEntry(testInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].user_id).toEqual('user-123');
    expect(entries[0].date).toEqual(new Date('2023-01-15'));
    expect(parseFloat(entries[0].sleep_hours)).toEqual(7.5);
    expect(parseFloat(entries[0].work_hours)).toEqual(8.0);
    expect(parseFloat(entries[0].social_time)).toEqual(2.5);
    expect(parseFloat(entries[0].screen_time)).toEqual(4.0);
    expect(entries[0].emotional_energy).toEqual(7);
    expect(entries[0].created_at).toBeInstanceOf(Date);
    expect(entries[0].updated_at).toBeInstanceOf(Date);
  });
});
