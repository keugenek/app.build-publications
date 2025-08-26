import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type GetHistoricalEntriesInput } from '../schema';
import { getHistoricalEntries } from '../handlers/get_historical_entries';

describe('getHistoricalEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no entries exist', async () => {
    const input: GetHistoricalEntriesInput = {};
    const result = await getHistoricalEntries(input);
    
    expect(result).toEqual([]);
  });

  it('should return daily entries with tasks only', async () => {
    // Create test tasks on specific dates
    const today = new Date('2023-12-01T10:00:00Z');
    const yesterday = new Date('2023-11-30T15:00:00Z');
    
    await db.insert(tasksTable).values([
      {
        description: 'Today task 1',
        completed: false,
        created_at: today,
        updated_at: today
      },
      {
        description: 'Today task 2',
        completed: true,
        created_at: today,
        updated_at: today,
        completed_at: today
      },
      {
        description: 'Yesterday task',
        completed: false,
        created_at: yesterday,
        updated_at: yesterday
      }
    ]);

    const input: GetHistoricalEntriesInput = {};
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(2);
    
    // Results should be ordered by date descending (most recent first)
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result[1].date.toISOString().split('T')[0]).toEqual('2023-11-30');
    
    // Check tasks for first date
    expect(result[0].tasks).toHaveLength(2);
    expect(result[0].tasks[0].description).toEqual('Today task 1');
    expect(result[0].tasks[1].description).toEqual('Today task 2');
    expect(result[0].mood_entry).toBeNull();
    
    // Check tasks for second date
    expect(result[1].tasks).toHaveLength(1);
    expect(result[1].tasks[0].description).toEqual('Yesterday task');
    expect(result[1].mood_entry).toBeNull();
  });

  it('should return daily entries with mood entries only', async () => {
    // Create test mood entries
    await db.insert(moodEntriesTable).values([
      {
        date: '2023-12-01',
        mood_score: 4,
        note: 'Feeling good today',
        created_at: new Date('2023-12-01T10:00:00Z'),
        updated_at: new Date('2023-12-01T10:00:00Z')
      },
      {
        date: '2023-11-30',
        mood_score: 3,
        note: null,
        created_at: new Date('2023-11-30T10:00:00Z'),
        updated_at: new Date('2023-11-30T10:00:00Z')
      }
    ]);

    const input: GetHistoricalEntriesInput = {};
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(2);
    
    // Check mood entries
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result[0].tasks).toHaveLength(0);
    expect(result[0].mood_entry).not.toBeNull();
    expect(result[0].mood_entry!.mood_score).toEqual(4);
    expect(result[0].mood_entry!.note).toEqual('Feeling good today');
    
    expect(result[1].date.toISOString().split('T')[0]).toEqual('2023-11-30');
    expect(result[1].tasks).toHaveLength(0);
    expect(result[1].mood_entry).not.toBeNull();
    expect(result[1].mood_entry!.mood_score).toEqual(3);
    expect(result[1].mood_entry!.note).toBeNull();
  });

  it('should return daily entries with both tasks and mood entries', async () => {
    const testDate = new Date('2023-12-01T10:00:00Z');
    
    // Create task and mood entry for the same date
    await db.insert(tasksTable).values({
      description: 'Test task',
      completed: false,
      created_at: testDate,
      updated_at: testDate
    });

    await db.insert(moodEntriesTable).values({
      date: '2023-12-01',
      mood_score: 5,
      note: 'Great day!',
      created_at: testDate,
      updated_at: testDate
    });

    const input: GetHistoricalEntriesInput = {};
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(1);
    
    const dailyEntry = result[0];
    expect(dailyEntry.date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(dailyEntry.tasks).toHaveLength(1);
    expect(dailyEntry.tasks[0].description).toEqual('Test task');
    expect(dailyEntry.mood_entry).not.toBeNull();
    expect(dailyEntry.mood_entry!.mood_score).toEqual(5);
    expect(dailyEntry.mood_entry!.note).toEqual('Great day!');
  });

  it('should filter entries by date range', async () => {
    // Create entries across multiple dates
    await db.insert(tasksTable).values([
      {
        description: 'Old task',
        completed: false,
        created_at: new Date('2023-11-01T10:00:00Z'),
        updated_at: new Date('2023-11-01T10:00:00Z')
      },
      {
        description: 'In range task 1',
        completed: false,
        created_at: new Date('2023-11-15T10:00:00Z'),
        updated_at: new Date('2023-11-15T10:00:00Z')
      },
      {
        description: 'In range task 2',
        completed: false,
        created_at: new Date('2023-11-25T10:00:00Z'),
        updated_at: new Date('2023-11-25T10:00:00Z')
      },
      {
        description: 'Future task',
        completed: false,
        created_at: new Date('2023-12-15T10:00:00Z'),
        updated_at: new Date('2023-12-15T10:00:00Z')
      }
    ]);

    const input: GetHistoricalEntriesInput = {
      start_date: '2023-11-10',
      end_date: '2023-11-30'
    };
    
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(2);
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2023-11-25');
    expect(result[1].date.toISOString().split('T')[0]).toEqual('2023-11-15');
  });

  it('should filter entries by start date only', async () => {
    // Create entries across multiple dates
    await db.insert(moodEntriesTable).values([
      {
        date: '2023-11-01',
        mood_score: 3,
        note: 'Old entry',
        created_at: new Date('2023-11-01T10:00:00Z'),
        updated_at: new Date('2023-11-01T10:00:00Z')
      },
      {
        date: '2023-11-20',
        mood_score: 4,
        note: 'Recent entry',
        created_at: new Date('2023-11-20T10:00:00Z'),
        updated_at: new Date('2023-11-20T10:00:00Z')
      }
    ]);

    const input: GetHistoricalEntriesInput = {
      start_date: '2023-11-15'
    };
    
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2023-11-20');
    expect(result[0].mood_entry!.note).toEqual('Recent entry');
  });

  it('should filter entries by end date only', async () => {
    // Create entries across multiple dates
    await db.insert(moodEntriesTable).values([
      {
        date: '2023-11-01',
        mood_score: 3,
        note: 'Early entry',
        created_at: new Date('2023-11-01T10:00:00Z'),
        updated_at: new Date('2023-11-01T10:00:00Z')
      },
      {
        date: '2023-11-20',
        mood_score: 4,
        note: 'Late entry',
        created_at: new Date('2023-11-20T10:00:00Z'),
        updated_at: new Date('2023-11-20T10:00:00Z')
      }
    ]);

    const input: GetHistoricalEntriesInput = {
      end_date: '2023-11-15'
    };
    
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2023-11-01');
    expect(result[0].mood_entry!.note).toEqual('Early entry');
  });

  it('should respect limit parameter', async () => {
    // Create multiple entries
    const dates = ['2023-12-01', '2023-11-30', '2023-11-29', '2023-11-28', '2023-11-27'];
    
    for (let i = 0; i < dates.length; i++) {
      await db.insert(moodEntriesTable).values({
        date: dates[i],
        mood_score: i + 1,
        note: `Entry ${i + 1}`,
        created_at: new Date(`${dates[i]}T10:00:00Z`),
        updated_at: new Date(`${dates[i]}T10:00:00Z`)
      });
    }

    const input: GetHistoricalEntriesInput = {
      limit: 3
    };
    
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(3);
    // Should be ordered by date descending
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result[1].date.toISOString().split('T')[0]).toEqual('2023-11-30');
    expect(result[2].date.toISOString().split('T')[0]).toEqual('2023-11-29');
  });

  it('should handle date range with limit', async () => {
    // Create multiple entries
    const dates = ['2023-11-25', '2023-11-20', '2023-11-15', '2023-11-10', '2023-11-05'];
    
    for (let i = 0; i < dates.length; i++) {
      await db.insert(tasksTable).values({
        description: `Task ${i + 1}`,
        completed: false,
        created_at: new Date(`${dates[i]}T10:00:00Z`),
        updated_at: new Date(`${dates[i]}T10:00:00Z`)
      });
    }

    const input: GetHistoricalEntriesInput = {
      start_date: '2023-11-08',
      end_date: '2023-11-22',
      limit: 2
    };
    
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(2);
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2023-11-20');
    expect(result[1].date.toISOString().split('T')[0]).toEqual('2023-11-15');
  });

  it('should handle entries spanning multiple days correctly', async () => {
    // Create tasks at different times of the same day
    const morning = new Date('2023-12-01T08:00:00Z');
    const afternoon = new Date('2023-12-01T14:00:00Z');
    const evening = new Date('2023-12-01T20:00:00Z');
    
    await db.insert(tasksTable).values([
      {
        description: 'Morning task',
        completed: false,
        created_at: morning,
        updated_at: morning
      },
      {
        description: 'Afternoon task',
        completed: true,
        created_at: afternoon,
        updated_at: afternoon,
        completed_at: afternoon
      },
      {
        description: 'Evening task',
        completed: false,
        created_at: evening,
        updated_at: evening
      }
    ]);

    await db.insert(moodEntriesTable).values({
      date: '2023-12-01',
      mood_score: 4,
      note: 'Good day overall',
      created_at: afternoon,
      updated_at: afternoon
    });

    const input: GetHistoricalEntriesInput = {};
    const result = await getHistoricalEntries(input);
    
    expect(result).toHaveLength(1);
    
    const dailyEntry = result[0];
    expect(dailyEntry.date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(dailyEntry.tasks).toHaveLength(3);
    expect(dailyEntry.mood_entry).not.toBeNull();
    expect(dailyEntry.mood_entry!.mood_score).toEqual(4);
    
    // Verify all tasks from the same day are included
    const taskDescriptions = dailyEntry.tasks.map(task => task.description);
    expect(taskDescriptions).toContain('Morning task');
    expect(taskDescriptions).toContain('Afternoon task');
    expect(taskDescriptions).toContain('Evening task');
  });
});
