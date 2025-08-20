import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type GetDailyEntryInput } from '../schema';
import { getDailyEntry } from '../handlers/get_daily_entry';

describe('getDailyEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testDate = '2024-01-15';
  const testInput: GetDailyEntryInput = {
    date: testDate
  };

  it('should return empty daily entry when no data exists', async () => {
    const result = await getDailyEntry(testInput);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.tasks).toEqual([]);
    expect(result.mood_entry).toBeNull();
  });

  it('should return tasks created on the target date', async () => {
    // Create tasks on the target date
    const targetDateTime = new Date('2024-01-15T10:30:00Z');
    await db.insert(tasksTable).values([
      {
        description: 'Morning task',
        completed: false,
        created_at: targetDateTime,
        updated_at: targetDateTime
      },
      {
        description: 'Evening task',
        completed: true,
        created_at: new Date('2024-01-15T20:15:00Z'),
        updated_at: new Date('2024-01-15T20:15:00Z'),
        completed_at: new Date('2024-01-15T20:30:00Z')
      }
    ]).execute();

    // Create task on different date (should not be included)
    await db.insert(tasksTable).values({
      description: 'Different day task',
      completed: false,
      created_at: new Date('2024-01-16T10:00:00Z'),
      updated_at: new Date('2024-01-16T10:00:00Z')
    }).execute();

    const result = await getDailyEntry(testInput);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].description).toEqual('Morning task');
    expect(result.tasks[0].completed).toEqual(false);
    expect(result.tasks[1].description).toEqual('Evening task');
    expect(result.tasks[1].completed).toEqual(true);
    expect(result.tasks[1].completed_at).toBeInstanceOf(Date);
    expect(result.mood_entry).toBeNull();
  });

  it('should return mood entry for the target date', async () => {
    // Create mood entry for the target date
    await db.insert(moodEntriesTable).values({
      date: testDate,
      mood_score: 4,
      note: 'Had a great day!',
      created_at: new Date(),
      updated_at: new Date()
    }).execute();

    // Create mood entry for different date (should not be included)
    await db.insert(moodEntriesTable).values({
      date: '2024-01-16',
      mood_score: 2,
      note: 'Not so good',
      created_at: new Date(),
      updated_at: new Date()
    }).execute();

    const result = await getDailyEntry(testInput);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.tasks).toEqual([]);
    expect(result.mood_entry).not.toBeNull();
    expect(result.mood_entry!.mood_score).toEqual(4);
    expect(result.mood_entry!.note).toEqual('Had a great day!');
    expect(result.mood_entry!.date).toEqual(new Date(testDate));
    expect(result.mood_entry!.created_at).toBeInstanceOf(Date);
    expect(result.mood_entry!.updated_at).toBeInstanceOf(Date);
  });

  it('should return complete daily entry with both tasks and mood', async () => {
    // Create tasks for the target date
    await db.insert(tasksTable).values([
      {
        description: 'Complete project',
        completed: true,
        created_at: new Date('2024-01-15T09:00:00Z'),
        updated_at: new Date('2024-01-15T09:00:00Z'),
        completed_at: new Date('2024-01-15T17:30:00Z')
      },
      {
        description: 'Review documents',
        completed: false,
        created_at: new Date('2024-01-15T14:20:00Z'),
        updated_at: new Date('2024-01-15T14:20:00Z')
      }
    ]).execute();

    // Create mood entry for the target date
    await db.insert(moodEntriesTable).values({
      date: testDate,
      mood_score: 5,
      note: 'Productive day!',
      created_at: new Date(),
      updated_at: new Date()
    }).execute();

    const result = await getDailyEntry(testInput);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].description).toEqual('Complete project');
    expect(result.tasks[0].completed).toEqual(true);
    expect(result.tasks[1].description).toEqual('Review documents');
    expect(result.tasks[1].completed).toEqual(false);
    expect(result.mood_entry).not.toBeNull();
    expect(result.mood_entry!.mood_score).toEqual(5);
    expect(result.mood_entry!.note).toEqual('Productive day!');
  });

  it('should handle mood entry without note', async () => {
    // Create mood entry without note
    await db.insert(moodEntriesTable).values({
      date: testDate,
      mood_score: 3,
      note: null,
      created_at: new Date(),
      updated_at: new Date()
    }).execute();

    const result = await getDailyEntry(testInput);

    expect(result.mood_entry).not.toBeNull();
    expect(result.mood_entry!.mood_score).toEqual(3);
    expect(result.mood_entry!.note).toBeNull();
  });

  it('should filter tasks correctly by date boundaries', async () => {
    // Create tasks at edge of date boundaries
    await db.insert(tasksTable).values([
      {
        description: 'Late previous day',
        completed: false,
        created_at: new Date('2024-01-14T23:59:59Z'),
        updated_at: new Date('2024-01-14T23:59:59Z')
      },
      {
        description: 'Start of target day',
        completed: false,
        created_at: new Date('2024-01-15T00:00:01Z'),
        updated_at: new Date('2024-01-15T00:00:01Z')
      },
      {
        description: 'End of target day',
        completed: false,
        created_at: new Date('2024-01-15T23:59:58Z'),
        updated_at: new Date('2024-01-15T23:59:58Z')
      },
      {
        description: 'Early next day',
        completed: false,
        created_at: new Date('2024-01-16T00:00:01Z'),
        updated_at: new Date('2024-01-16T00:00:01Z')
      }
    ]).execute();

    const result = await getDailyEntry(testInput);

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks.map(t => t.description)).toContain('Start of target day');
    expect(result.tasks.map(t => t.description)).toContain('End of target day');
    expect(result.tasks.map(t => t.description)).not.toContain('Late previous day');
    expect(result.tasks.map(t => t.description)).not.toContain('Early next day');
  });

  it('should handle multiple mood entries on same date by returning first one', async () => {
    // Create multiple mood entries for the same date (edge case)
    await db.insert(moodEntriesTable).values([
      {
        date: testDate,
        mood_score: 3,
        note: 'First entry',
        created_at: new Date('2024-01-15T08:00:00Z'),
        updated_at: new Date('2024-01-15T08:00:00Z')
      },
      {
        date: testDate,
        mood_score: 4,
        note: 'Second entry',
        created_at: new Date('2024-01-15T18:00:00Z'),
        updated_at: new Date('2024-01-15T18:00:00Z')
      }
    ]).execute();

    const result = await getDailyEntry(testInput);

    expect(result.mood_entry).not.toBeNull();
    expect(result.mood_entry!.mood_score).toEqual(3);
    expect(result.mood_entry!.note).toEqual('First entry');
  });
});
