import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyEntriesTable } from '../db/schema';
import { type UpdateDailyEntryInput } from '../schema';
import { updateDailyEntry } from '../handlers/update_daily_entry';
import { eq } from 'drizzle-orm';

// Test inputs
const testUpdateMoodInput: UpdateDailyEntryInput = {
  id: 1,
  mood: 'happy'
};

const testUpdateNotesInput: UpdateDailyEntryInput = {
  id: 1,
  notes: 'Updated notes for today'
};

const testUpdateBothInput: UpdateDailyEntryInput = {
  id: 1,
  mood: 'very_happy',
  notes: 'Great day with updated notes'
};

describe('updateDailyEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test daily entry
  const createTestDailyEntry = async () => {
    const result = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-15',
        mood: 'neutral',
        notes: 'Initial notes'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update only mood when mood is provided', async () => {
    const initialEntry = await createTestDailyEntry();
    const result = await updateDailyEntry(testUpdateMoodInput);

    expect(result.id).toEqual(initialEntry.id);
    expect(result.mood).toEqual('happy');
    expect(result.notes).toEqual('Initial notes'); // Should remain unchanged
    expect(result.date).toEqual(new Date(initialEntry.date));
    expect(result.created_at).toEqual(initialEntry.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > initialEntry.updated_at).toBe(true);
  });

  it('should update only notes when notes is provided', async () => {
    const initialEntry = await createTestDailyEntry();
    const result = await updateDailyEntry(testUpdateNotesInput);

    expect(result.id).toEqual(initialEntry.id);
    expect(result.mood).toEqual('neutral'); // Should remain unchanged
    expect(result.notes).toEqual('Updated notes for today');
    expect(result.date).toEqual(new Date(initialEntry.date));
    expect(result.created_at).toEqual(initialEntry.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > initialEntry.updated_at).toBe(true);
  });

  it('should update both mood and notes when both are provided', async () => {
    const initialEntry = await createTestDailyEntry();
    const result = await updateDailyEntry(testUpdateBothInput);

    expect(result.id).toEqual(initialEntry.id);
    expect(result.mood).toEqual('very_happy');
    expect(result.notes).toEqual('Great day with updated notes');
    expect(result.date).toEqual(new Date(initialEntry.date));
    expect(result.created_at).toEqual(initialEntry.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > initialEntry.updated_at).toBe(true);
  });

  it('should update mood to null when mood is explicitly set to null', async () => {
    await createTestDailyEntry();
    const result = await updateDailyEntry({
      id: 1,
      mood: null
    });

    expect(result.mood).toBeNull();
  });

  it('should update notes to null when notes is explicitly set to null', async () => {
    await createTestDailyEntry();
    const result = await updateDailyEntry({
      id: 1,
      notes: null
    });

    expect(result.notes).toBeNull();
  });

  it('should persist changes to database', async () => {
    await createTestDailyEntry();
    const result = await updateDailyEntry(testUpdateBothInput);

    // Query database to verify changes were persisted
    const updatedEntries = await db.select()
      .from(dailyEntriesTable)
      .where(eq(dailyEntriesTable.id, result.id))
      .execute();

    expect(updatedEntries).toHaveLength(1);
    expect(updatedEntries[0].mood).toEqual('very_happy');
    expect(updatedEntries[0].notes).toEqual('Great day with updated notes');
    expect(updatedEntries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when daily entry does not exist', async () => {
    const nonExistentInput: UpdateDailyEntryInput = {
      id: 999,
      mood: 'happy'
    };

    await expect(updateDailyEntry(nonExistentInput))
      .rejects
      .toThrow(/Daily entry with id 999 not found/i);
  });

  it('should update only updated_at timestamp when no other fields provided', async () => {
    const initialEntry = await createTestDailyEntry();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result = await updateDailyEntry({ id: 1 });

    expect(result.id).toEqual(initialEntry.id);
    expect(result.mood).toEqual(initialEntry.mood);
    expect(result.notes).toEqual(initialEntry.notes);
    expect(result.date).toEqual(new Date(initialEntry.date));
    expect(result.created_at).toEqual(initialEntry.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > initialEntry.updated_at).toBe(true);
  });
});
