import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyEntriesTable } from '../db/schema';
import { type CreateDailyEntryInput } from '../schema';
import { createDailyEntry } from '../handlers/create_daily_entry';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateDailyEntryInput = {
  date: new Date('2024-01-15'),
  mood: 'happy' as const,
  notes: 'Had a great day today!'
};

// Test input with minimal fields (nulls)
const minimalInput: CreateDailyEntryInput = {
  date: new Date('2024-01-16'),
  mood: null,
  notes: null
};

describe('createDailyEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a daily entry with all fields', async () => {
    const result = await createDailyEntry(testInput);

    // Basic field validation
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.mood).toEqual('happy');
    expect(result.notes).toEqual('Had a great day today!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.id).toBe('number');
  });

  it('should create a daily entry with minimal fields', async () => {
    const result = await createDailyEntry(minimalInput);

    // Basic field validation
    expect(result.date).toEqual(new Date('2024-01-16'));
    expect(result.mood).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.id).toBe('number');
  });

  it('should save daily entry to database', async () => {
    const result = await createDailyEntry(testInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(dailyEntriesTable)
      .where(eq(dailyEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].date).toEqual('2024-01-15'); // Date stored as string in DB
    expect(entries[0].mood).toEqual('happy');
    expect(entries[0].notes).toEqual('Had a great day today!');
    expect(entries[0].created_at).toBeInstanceOf(Date);
    expect(entries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different mood values correctly', async () => {
    const moodValues = ['very_sad', 'sad', 'neutral', 'happy', 'very_happy'] as const;
    
    for (let i = 0; i < moodValues.length; i++) {
      const moodInput: CreateDailyEntryInput = {
        date: new Date(`2024-01-${20 + i}`), // Different dates to avoid constraint violation
        mood: moodValues[i],
        notes: `Testing ${moodValues[i]} mood`
      };

      const result = await createDailyEntry(moodInput);
      expect(result.mood).toEqual(moodValues[i]);
      expect(result.date).toEqual(new Date(`2024-01-${20 + i}`));
    }
  });

  it('should enforce unique date constraint', async () => {
    // Create first entry
    await createDailyEntry(testInput);

    // Try to create another entry with same date
    const duplicateInput: CreateDailyEntryInput = {
      date: new Date('2024-01-15'), // Same date
      mood: 'sad',
      notes: 'Different notes'
    };

    // Should throw error due to unique constraint on date
    await expect(createDailyEntry(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle date conversion correctly', async () => {
    // Test with different date formats
    const dateInput: CreateDailyEntryInput = {
      date: new Date('2024-12-25T15:30:00.000Z'), // Full timestamp
      mood: 'very_happy',
      notes: 'Christmas day!'
    };

    const result = await createDailyEntry(dateInput);

    // Should normalize to date only (no time component)
    expect(result.date).toEqual(new Date('2024-12-25'));
    
    // Verify in database
    const dbEntry = await db.select()
      .from(dailyEntriesTable)
      .where(eq(dailyEntriesTable.id, result.id))
      .execute();

    expect(dbEntry[0].date).toEqual('2024-12-25'); // Stored as date string
  });

  it('should set updated_at timestamp', async () => {
    const before = new Date();
    const result = await createDailyEntry(testInput);
    const after = new Date();

    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
