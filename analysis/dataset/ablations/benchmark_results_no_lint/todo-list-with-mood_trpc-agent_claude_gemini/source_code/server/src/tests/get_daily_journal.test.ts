import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type GetDailyJournalInput } from '../schema';
import { getDailyJournal } from '../handlers/get_daily_journal';

describe('getDailyJournal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily journal entries for a single date', async () => {
    const testDate = '2024-01-15';
    
    // Create test data for the specific date
    await db.insert(tasksTable).values([
      { name: 'Task 1', is_completed: false, created_at: new Date('2024-01-15T10:00:00Z') },
      { name: 'Task 2', is_completed: true, created_at: new Date('2024-01-15T14:00:00Z') }
    ]).execute();

    await db.insert(moodEntriesTable).values({
      mood_score: 4,
      notes: 'Feeling good today',
      entry_date: testDate
    }).execute();

    const input: GetDailyJournalInput = {
      start_date: testDate
    };

    const result = await getDailyJournal(input);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(testDate);
    expect(result[0].tasks).toHaveLength(2);
    expect(result[0].mood_entry).not.toBeNull();
    expect(result[0].mood_entry!.mood_score).toBe(4);
    expect(result[0].mood_entry!.notes).toBe('Feeling good today');
  });

  it('should return daily journal entries for a date range', async () => {
    // Create test data across multiple dates
    await db.insert(tasksTable).values([
      { name: 'Task Jan 15', created_at: new Date('2024-01-15T10:00:00Z') },
      { name: 'Task Jan 16', created_at: new Date('2024-01-16T11:00:00Z') },
      { name: 'Task Jan 17', created_at: new Date('2024-01-17T12:00:00Z') }
    ]).execute();

    await db.insert(moodEntriesTable).values([
      { mood_score: 3, notes: 'Okay day', entry_date: '2024-01-15' },
      { mood_score: 5, notes: 'Great day!', entry_date: '2024-01-17' }
    ]).execute();

    const input: GetDailyJournalInput = {
      start_date: '2024-01-15',
      end_date: '2024-01-17'
    };

    const result = await getDailyJournal(input);

    expect(result).toHaveLength(3);
    
    // Check dates are sorted correctly
    expect(result[0].date).toBe('2024-01-15');
    expect(result[1].date).toBe('2024-01-16');
    expect(result[2].date).toBe('2024-01-17');

    // Check Jan 15 data
    expect(result[0].tasks).toHaveLength(1);
    expect(result[0].tasks[0].name).toBe('Task Jan 15');
    expect(result[0].mood_entry!.mood_score).toBe(3);

    // Check Jan 16 data (no mood entry)
    expect(result[1].tasks).toHaveLength(1);
    expect(result[1].tasks[0].name).toBe('Task Jan 16');
    expect(result[1].mood_entry).toBeNull();

    // Check Jan 17 data
    expect(result[2].tasks).toHaveLength(1);
    expect(result[2].tasks[0].name).toBe('Task Jan 17');
    expect(result[2].mood_entry!.mood_score).toBe(5);
  });

  it('should return empty arrays for days with no data', async () => {
    const input: GetDailyJournalInput = {
      start_date: '2024-01-20',
      end_date: '2024-01-22'
    };

    const result = await getDailyJournal(input);

    expect(result).toHaveLength(3);
    
    result.forEach(entry => {
      expect(entry.tasks).toHaveLength(0);
      expect(entry.mood_entry).toBeNull();
    });
    
    expect(result[0].date).toBe('2024-01-20');
    expect(result[1].date).toBe('2024-01-21');
    expect(result[2].date).toBe('2024-01-22');
  });

  it('should handle tasks and mood entries with different date boundaries', async () => {
    // Create tasks that span across different times of day
    await db.insert(tasksTable).values([
      { name: 'Early morning task', created_at: new Date('2024-01-15T00:30:00Z') },
      { name: 'Late night task', created_at: new Date('2024-01-15T23:45:00Z') }
    ]).execute();

    // Create mood entry for the same date
    await db.insert(moodEntriesTable).values({
      mood_score: 2,
      notes: 'Stressful day',
      entry_date: '2024-01-15'
    }).execute();

    const input: GetDailyJournalInput = {
      start_date: '2024-01-15'
    };

    const result = await getDailyJournal(input);

    expect(result).toHaveLength(1);
    expect(result[0].tasks).toHaveLength(2);
    expect(result[0].mood_entry!.mood_score).toBe(2);
  });

  it('should handle mood entries with null notes', async () => {
    await db.insert(moodEntriesTable).values({
      mood_score: 3,
      notes: null,
      entry_date: '2024-01-15'
    }).execute();

    const input: GetDailyJournalInput = {
      start_date: '2024-01-15'
    };

    const result = await getDailyJournal(input);

    expect(result).toHaveLength(1);
    expect(result[0].mood_entry!.notes).toBeNull();
  });

  it('should filter tasks correctly by creation date boundaries', async () => {
    // Create tasks just outside the date range
    await db.insert(tasksTable).values([
      { name: 'Task before range', created_at: new Date('2024-01-14T23:59:59Z') },
      { name: 'Task in range start', created_at: new Date('2024-01-15T00:00:00Z') },
      { name: 'Task in range end', created_at: new Date('2024-01-15T23:59:59Z') },
      { name: 'Task after range', created_at: new Date('2024-01-16T00:00:00Z') }
    ]).execute();

    const input: GetDailyJournalInput = {
      start_date: '2024-01-15'
    };

    const result = await getDailyJournal(input);

    expect(result).toHaveLength(1);
    expect(result[0].tasks).toHaveLength(2);
    expect(result[0].tasks.map(t => t.name)).toContain('Task in range start');
    expect(result[0].tasks.map(t => t.name)).toContain('Task in range end');
    expect(result[0].tasks.map(t => t.name)).not.toContain('Task before range');
    expect(result[0].tasks.map(t => t.name)).not.toContain('Task after range');
  });

  it('should validate returned data types and structure', async () => {
    await db.insert(tasksTable).values({
      name: 'Test Task',
      is_completed: true,
      created_at: new Date('2024-01-15T10:00:00Z')
    }).execute();

    await db.insert(moodEntriesTable).values({
      mood_score: 4,
      notes: 'Good mood',
      entry_date: '2024-01-15'
    }).execute();

    const input: GetDailyJournalInput = {
      start_date: '2024-01-15'
    };

    const result = await getDailyJournal(input);

    expect(result).toHaveLength(1);
    
    const entry = result[0];
    expect(typeof entry.date).toBe('string');
    expect(Array.isArray(entry.tasks)).toBe(true);
    expect(entry.mood_entry).not.toBeNull();

    // Validate task structure
    const task = entry.tasks[0];
    expect(typeof task.id).toBe('number');
    expect(typeof task.name).toBe('string');
    expect(typeof task.is_completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);

    // Validate mood entry structure
    const moodEntry = entry.mood_entry!;
    expect(typeof moodEntry.id).toBe('number');
    expect(typeof moodEntry.mood_score).toBe('number');
    expect(typeof moodEntry.notes).toBe('string');
    expect(moodEntry.entry_date).toBeInstanceOf(Date);
    expect(moodEntry.created_at).toBeInstanceOf(Date);
  });
});
