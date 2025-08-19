import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { getDailySummary } from '../handlers/get_daily_summary';

describe('getDailySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary for date with no data', async () => {
    const testDate = '2024-01-15';
    const result = await getDailySummary(testDate);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.completed_tasks).toEqual([]);
    expect(result.mood_entry).toBeNull();
    expect(result.total_tasks).toEqual(0);
    expect(result.completed_tasks_count).toEqual(0);
  });

  it('should return summary with completed tasks for the day', async () => {
    const testDate = '2024-01-15';
    const testDateTime = new Date('2024-01-15T14:30:00Z');
    
    // Create tasks
    await db.insert(tasksTable).values([
      {
        title: 'Completed Task 1',
        description: 'First completed task',
        is_completed: true,
        completed_at: testDateTime,
        created_at: new Date('2024-01-15T10:00:00Z')
      },
      {
        title: 'Completed Task 2',
        description: 'Second completed task',
        is_completed: true,
        completed_at: new Date('2024-01-15T16:45:00Z'),
        created_at: new Date('2024-01-15T11:00:00Z')
      },
      {
        title: 'Incomplete Task',
        description: 'Not completed',
        is_completed: false,
        created_at: new Date('2024-01-15T12:00:00Z')
      },
      {
        title: 'Task from different day',
        description: 'Completed on different day',
        is_completed: true,
        completed_at: new Date('2024-01-16T14:30:00Z'),
        created_at: new Date('2024-01-15T13:00:00Z')
      }
    ]).execute();

    const result = await getDailySummary(testDate);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.completed_tasks).toHaveLength(2);
    expect(result.completed_tasks[0].title).toEqual('Completed Task 1');
    expect(result.completed_tasks[1].title).toEqual('Completed Task 2');
    expect(result.total_tasks).toEqual(4); // All tasks created on this date
    expect(result.completed_tasks_count).toEqual(2);
    expect(result.mood_entry).toBeNull();
  });

  it('should return summary with mood entry for the day', async () => {
    const testDate = '2024-01-15';
    
    // Create mood entries
    await db.insert(moodEntriesTable).values([
      {
        mood_rating: 4,
        note: 'Great day!',
        date: '2024-01-15',
        created_at: new Date('2024-01-15T20:00:00Z')
      },
      {
        mood_rating: 3,
        note: 'Different day',
        date: '2024-01-16',
        created_at: new Date('2024-01-16T20:00:00Z')
      }
    ]).execute();

    const result = await getDailySummary(testDate);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.completed_tasks).toEqual([]);
    expect(result.mood_entry).not.toBeNull();
    expect(result.mood_entry!.mood_rating).toEqual(4);
    expect(result.mood_entry!.note).toEqual('Great day!');
    expect(result.mood_entry!.date).toEqual(new Date('2024-01-15'));
    expect(result.total_tasks).toEqual(0);
    expect(result.completed_tasks_count).toEqual(0);
  });

  it('should return comprehensive summary with both tasks and mood', async () => {
    const testDate = '2024-01-15';
    
    // Create tasks
    await db.insert(tasksTable).values([
      {
        title: 'Morning Task',
        description: 'Completed in morning',
        is_completed: true,
        completed_at: new Date('2024-01-15T09:00:00Z'),
        created_at: new Date('2024-01-15T08:00:00Z')
      },
      {
        title: 'Evening Task',
        description: 'Completed in evening',
        is_completed: true,
        completed_at: new Date('2024-01-15T21:00:00Z'),
        created_at: new Date('2024-01-15T08:30:00Z')
      },
      {
        title: 'Pending Task',
        description: 'Still pending',
        is_completed: false,
        created_at: new Date('2024-01-15T09:30:00Z')
      }
    ]).execute();

    // Create mood entry
    await db.insert(moodEntriesTable).values({
      mood_rating: 5,
      note: 'Perfect productive day!',
      date: '2024-01-15',
      created_at: new Date('2024-01-15T22:00:00Z')
    }).execute();

    const result = await getDailySummary(testDate);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.completed_tasks).toHaveLength(2);
    expect(result.completed_tasks[0].title).toEqual('Morning Task');
    expect(result.completed_tasks[1].title).toEqual('Evening Task');
    expect(result.mood_entry).not.toBeNull();
    expect(result.mood_entry!.mood_rating).toEqual(5);
    expect(result.mood_entry!.note).toEqual('Perfect productive day!');
    expect(result.total_tasks).toEqual(3);
    expect(result.completed_tasks_count).toEqual(2);
  });

  it('should handle edge case with completed task but no completed_at timestamp', async () => {
    const testDate = '2024-01-15';
    
    // Create task marked as completed but without completed_at timestamp
    await db.insert(tasksTable).values({
      title: 'Edge Case Task',
      description: 'Completed but no timestamp',
      is_completed: true,
      completed_at: null, // No completion timestamp
      created_at: new Date('2024-01-15T10:00:00Z')
    }).execute();

    const result = await getDailySummary(testDate);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.completed_tasks).toHaveLength(0); // Should not include tasks without completed_at
    expect(result.total_tasks).toEqual(1);
    expect(result.completed_tasks_count).toEqual(0);
  });

  it('should handle multiple mood entries for same date', async () => {
    const testDate = '2024-01-15';
    
    // Create multiple mood entries for the same date (edge case)
    await db.insert(moodEntriesTable).values([
      {
        mood_rating: 3,
        note: 'Morning mood',
        date: '2024-01-15',
        created_at: new Date('2024-01-15T08:00:00Z')
      },
      {
        mood_rating: 4,
        note: 'Evening mood',
        date: '2024-01-15',
        created_at: new Date('2024-01-15T20:00:00Z')
      }
    ]).execute();

    const result = await getDailySummary(testDate);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.mood_entry).not.toBeNull();
    // Should return the first one found (database order)
    expect(result.mood_entry!.mood_rating).toEqual(3);
    expect(result.mood_entry!.note).toEqual('Morning mood');
  });

  it('should handle tasks completed at edge of day boundaries', async () => {
    const testDate = '2024-01-15';
    
    await db.insert(tasksTable).values([
      {
        title: 'Start of Day Task',
        description: 'Completed at start of day',
        is_completed: true,
        completed_at: new Date('2024-01-15T00:00:00Z'),
        created_at: new Date('2024-01-14T23:00:00Z')
      },
      {
        title: 'End of Day Task',
        description: 'Completed at end of day',
        is_completed: true,
        completed_at: new Date('2024-01-15T23:59:59Z'),
        created_at: new Date('2024-01-15T23:00:00Z')
      },
      {
        title: 'Next Day Task',
        description: 'Completed next day',
        is_completed: true,
        completed_at: new Date('2024-01-16T00:00:01Z'),
        created_at: new Date('2024-01-15T23:30:00Z')
      }
    ]).execute();

    const result = await getDailySummary(testDate);

    expect(result.date).toEqual(new Date(testDate));
    expect(result.completed_tasks).toHaveLength(2); // Should include start and end of day, not next day
    expect(result.completed_tasks.some(task => task.title === 'Start of Day Task')).toBe(true);
    expect(result.completed_tasks.some(task => task.title === 'End of Day Task')).toBe(true);
    expect(result.completed_tasks.some(task => task.title === 'Next Day Task')).toBe(false);
  });
});
