import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyEntriesTable, tasksTable } from '../db/schema';
import { getDailyEntryByDate } from '../handlers/get_daily_entry_by_date';

describe('getDailyEntryByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no entry exists for the given date', async () => {
    const testDate = new Date('2024-01-15');
    const result = await getDailyEntryByDate(testDate);
    
    expect(result).toBeNull();
  });

  it('should return daily entry without tasks when entry exists but has no tasks', async () => {
    // Create a daily entry without tasks
    const testDate = new Date('2024-01-15');
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-15',
        mood: 'happy',
        notes: 'A good day with no specific tasks'
      })
      .returning()
      .execute();

    const result = await getDailyEntryByDate(testDate);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(dailyEntryResult[0].id);
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.mood).toBe('happy');
    expect(result!.notes).toBe('A good day with no specific tasks');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.tasks).toEqual([]);
  });

  it('should return daily entry with associated tasks', async () => {
    // Create a daily entry
    const testDate = new Date('2024-01-15');
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-15',
        mood: 'neutral',
        notes: 'A productive day'
      })
      .returning()
      .execute();

    const dailyEntryId = dailyEntryResult[0].id;

    // Create tasks associated with this entry
    await db.insert(tasksTable)
      .values([
        {
          title: 'Complete project',
          description: 'Finish the important project',
          is_completed: true,
          daily_entry_id: dailyEntryId,
          completed_at: new Date('2024-01-15T14:30:00Z')
        },
        {
          title: 'Review documents',
          description: null,
          is_completed: false,
          daily_entry_id: dailyEntryId,
          completed_at: null
        },
        {
          title: 'Call client',
          description: 'Follow up on project status',
          is_completed: true,
          daily_entry_id: dailyEntryId,
          completed_at: new Date('2024-01-15T16:00:00Z')
        }
      ])
      .execute();

    const result = await getDailyEntryByDate(testDate);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(dailyEntryId);
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.mood).toBe('neutral');
    expect(result!.notes).toBe('A productive day');
    expect(result!.tasks).toHaveLength(3);

    // Verify task details
    const completedTasks = result!.tasks.filter(task => task.is_completed);
    const incompleteTasks = result!.tasks.filter(task => !task.is_completed);
    
    expect(completedTasks).toHaveLength(2);
    expect(incompleteTasks).toHaveLength(1);

    // Check specific task details
    const projectTask = result!.tasks.find(task => task.title === 'Complete project');
    expect(projectTask).toBeDefined();
    expect(projectTask!.description).toBe('Finish the important project');
    expect(projectTask!.is_completed).toBe(true);
    expect(projectTask!.completed_at).toBeInstanceOf(Date);
    expect(projectTask!.daily_entry_id).toBe(dailyEntryId);

    const reviewTask = result!.tasks.find(task => task.title === 'Review documents');
    expect(reviewTask).toBeDefined();
    expect(reviewTask!.description).toBeNull();
    expect(reviewTask!.is_completed).toBe(false);
    expect(reviewTask!.completed_at).toBeNull();
  });

  it('should handle daily entry with null mood and notes', async () => {
    const testDate = new Date('2024-02-01');
    await db.insert(dailyEntriesTable)
      .values({
        date: '2024-02-01',
        mood: null,
        notes: null
      })
      .execute();

    const result = await getDailyEntryByDate(testDate);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(new Date('2024-02-01'));
    expect(result!.mood).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.tasks).toEqual([]);
  });

  it('should correctly handle date boundaries and timezone independence', async () => {
    // Create entries for different dates
    await db.insert(dailyEntriesTable)
      .values([
        {
          date: '2024-01-14',
          mood: 'sad',
          notes: 'Yesterday'
        },
        {
          date: '2024-01-15',
          mood: 'happy',
          notes: 'Today'
        },
        {
          date: '2024-01-16',
          mood: 'very_happy',
          notes: 'Tomorrow'
        }
      ])
      .execute();

    // Test that we get the correct entry for each date
    const yesterday = await getDailyEntryByDate(new Date('2024-01-14'));
    const today = await getDailyEntryByDate(new Date('2024-01-15'));
    const tomorrow = await getDailyEntryByDate(new Date('2024-01-16'));

    expect(yesterday!.mood).toBe('sad');
    expect(yesterday!.notes).toBe('Yesterday');

    expect(today!.mood).toBe('happy');
    expect(today!.notes).toBe('Today');

    expect(tomorrow!.mood).toBe('very_happy');
    expect(tomorrow!.notes).toBe('Tomorrow');

    // Test date that doesn't exist
    const nonExistent = await getDailyEntryByDate(new Date('2024-01-17'));
    expect(nonExistent).toBeNull();
  });

  it('should return tasks in insertion order', async () => {
    const testDate = new Date('2024-03-01');
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-03-01',
        mood: 'very_sad',
        notes: 'Overwhelming day'
      })
      .returning()
      .execute();

    const dailyEntryId = dailyEntryResult[0].id;

    // Insert tasks in a specific order
    const taskResults = await db.insert(tasksTable)
      .values([
        {
          title: 'First task',
          description: 'This was created first',
          is_completed: false,
          daily_entry_id: dailyEntryId
        },
        {
          title: 'Second task',
          description: 'This was created second',
          is_completed: true,
          daily_entry_id: dailyEntryId,
          completed_at: new Date()
        },
        {
          title: 'Third task',
          description: 'This was created third',
          is_completed: false,
          daily_entry_id: dailyEntryId
        }
      ])
      .returning()
      .execute();

    const result = await getDailyEntryByDate(testDate);

    expect(result).not.toBeNull();
    expect(result!.tasks).toHaveLength(3);
    
    // Verify tasks are returned with proper IDs and in database order
    expect(result!.tasks[0].id).toBe(taskResults[0].id);
    expect(result!.tasks[0].title).toBe('First task');
    expect(result!.tasks[1].id).toBe(taskResults[1].id);
    expect(result!.tasks[1].title).toBe('Second task');
    expect(result!.tasks[2].id).toBe(taskResults[2].id);
    expect(result!.tasks[2].title).toBe('Third task');
  });
});
