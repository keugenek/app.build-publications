import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyEntriesTable } from '../db/schema';
import { type GetDailyEntriesInput, type CreateDailyEntryInput } from '../schema';
import { getDailyEntries } from '../handlers/get_daily_entries';


describe('getDailyEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test daily entries
  const createTestEntry = async (entryData: CreateDailyEntryInput) => {
    return await db.insert(dailyEntriesTable)
      .values({
        date: entryData.date.toISOString().split('T')[0], // Convert to date string
        mood: entryData.mood,
        notes: entryData.notes
      })
      .returning()
      .execute();
  };

  it('should return all daily entries when no filters are provided', async () => {
    // Create test entries
    const today = new Date('2024-01-15');
    const yesterday = new Date('2024-01-14');
    const dayBefore = new Date('2024-01-13');

    await createTestEntry({
      date: today,
      mood: 'happy',
      notes: 'Great day today!'
    });

    await createTestEntry({
      date: yesterday,
      mood: 'neutral',
      notes: 'Average day'
    });

    await createTestEntry({
      date: dayBefore,
      mood: 'sad',
      notes: 'Not feeling great'
    });

    const results = await getDailyEntries();

    expect(results).toHaveLength(3);
    expect(results[0].date).toEqual(today); // Most recent first
    expect(results[1].date).toEqual(yesterday);
    expect(results[2].date).toEqual(dayBefore);
  });

  it('should filter entries by start_date', async () => {
    const jan10 = new Date('2024-01-10');
    const jan15 = new Date('2024-01-15');
    const jan20 = new Date('2024-01-20');

    await createTestEntry({
      date: jan10,
      mood: 'sad',
      notes: 'Early entry'
    });

    await createTestEntry({
      date: jan15,
      mood: 'happy',
      notes: 'Middle entry'
    });

    await createTestEntry({
      date: jan20,
      mood: 'very_happy',
      notes: 'Late entry'
    });

    const results = await getDailyEntries({
      start_date: new Date('2024-01-15')
    });

    expect(results).toHaveLength(2);
    expect(results[0].date).toEqual(jan20); // Most recent first
    expect(results[1].date).toEqual(jan15);
  });

  it('should filter entries by end_date', async () => {
    const jan10 = new Date('2024-01-10');
    const jan15 = new Date('2024-01-15');
    const jan20 = new Date('2024-01-20');

    await createTestEntry({
      date: jan10,
      mood: 'sad',
      notes: 'Early entry'
    });

    await createTestEntry({
      date: jan15,
      mood: 'happy',
      notes: 'Middle entry'
    });

    await createTestEntry({
      date: jan20,
      mood: 'very_happy',
      notes: 'Late entry'
    });

    const results = await getDailyEntries({
      end_date: new Date('2024-01-15')
    });

    expect(results).toHaveLength(2);
    expect(results[0].date).toEqual(jan15); // Most recent first
    expect(results[1].date).toEqual(jan10);
  });

  it('should filter entries by date range', async () => {
    const jan5 = new Date('2024-01-05');
    const jan10 = new Date('2024-01-10');
    const jan15 = new Date('2024-01-15');
    const jan20 = new Date('2024-01-20');
    const jan25 = new Date('2024-01-25');

    await createTestEntry({ date: jan5, mood: 'sad', notes: 'Too early' });
    await createTestEntry({ date: jan10, mood: 'neutral', notes: 'In range 1' });
    await createTestEntry({ date: jan15, mood: 'happy', notes: 'In range 2' });
    await createTestEntry({ date: jan20, mood: 'very_happy', notes: 'In range 3' });
    await createTestEntry({ date: jan25, mood: 'sad', notes: 'Too late' });

    const results = await getDailyEntries({
      start_date: new Date('2024-01-10'),
      end_date: new Date('2024-01-20')
    });

    expect(results).toHaveLength(3);
    expect(results[0].date).toEqual(jan20); // Most recent first
    expect(results[1].date).toEqual(jan15);
    expect(results[2].date).toEqual(jan10);
  });

  it('should return empty array when no entries match filter', async () => {
    await createTestEntry({
      date: new Date('2024-01-10'),
      mood: 'happy',
      notes: 'Only entry'
    });

    const results = await getDailyEntries({
      start_date: new Date('2024-01-20'),
      end_date: new Date('2024-01-25')
    });

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no entries exist', async () => {
    const results = await getDailyEntries();
    expect(results).toHaveLength(0);
  });

  it('should handle entries with nullable fields correctly', async () => {
    await createTestEntry({
      date: new Date('2024-01-15'),
      mood: null,
      notes: null
    });

    await createTestEntry({
      date: new Date('2024-01-16'),
      mood: 'happy',
      notes: 'Good day!'
    });

    const results = await getDailyEntries();

    expect(results).toHaveLength(2);
    expect(results[0].mood).toEqual('happy');
    expect(results[0].notes).toEqual('Good day!');
    expect(results[1].mood).toBeNull();
    expect(results[1].notes).toBeNull();
  });

  it('should preserve created_at and updated_at timestamps', async () => {
    await createTestEntry({
      date: new Date('2024-01-15'),
      mood: 'happy',
      notes: 'Test entry'
    });

    const results = await getDailyEntries();

    expect(results).toHaveLength(1);
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
    expect(results[0].id).toBeDefined();
  });

  it('should handle edge case with same start_date and end_date', async () => {
    const targetDate = new Date('2024-01-15');
    const dayBefore = new Date('2024-01-14');
    const dayAfter = new Date('2024-01-16');

    await createTestEntry({ date: dayBefore, mood: 'sad', notes: 'Day before' });
    await createTestEntry({ date: targetDate, mood: 'happy', notes: 'Target day' });
    await createTestEntry({ date: dayAfter, mood: 'neutral', notes: 'Day after' });

    const results = await getDailyEntries({
      start_date: targetDate,
      end_date: targetDate
    });

    expect(results).toHaveLength(1);
    expect(results[0].date).toEqual(targetDate);
    expect(results[0].notes).toEqual('Target day');
  });
});
