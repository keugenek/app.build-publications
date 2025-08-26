import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyEntriesTable, tasksTable } from '../db/schema';
import { type CreateDailyEntryInput, type CreateTaskInput } from '../schema';
import { getDailyEntryWithTasks } from '../handlers/get_daily_entry_with_tasks';

// Test data
const testDailyEntry: CreateDailyEntryInput = {
  date: new Date('2024-01-15'),
  mood: 'happy',
  notes: 'Great day for testing!'
};

const testTask1: Omit<CreateTaskInput, 'daily_entry_id'> = {
  title: 'Complete project',
  description: 'Finish the daily tracker implementation'
};

const testTask2: Omit<CreateTaskInput, 'daily_entry_id'> = {
  title: 'Review code',
  description: null
};

describe('getDailyEntryWithTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily entry with all associated tasks', async () => {
    // Create a daily entry
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: testDailyEntry.date.toISOString().split('T')[0], // Convert Date to string
        mood: testDailyEntry.mood,
        notes: testDailyEntry.notes
      })
      .returning()
      .execute();

    const dailyEntry = dailyEntryResult[0];

    // Create tasks for this daily entry
    await db.insert(tasksTable)
      .values([
        {
          title: testTask1.title,
          description: testTask1.description,
          is_completed: false,
          daily_entry_id: dailyEntry.id
        },
        {
          title: testTask2.title,
          description: testTask2.description,
          is_completed: true,
          completed_at: new Date(),
          daily_entry_id: dailyEntry.id
        }
      ])
      .execute();

    // Get daily entry with tasks
    const result = await getDailyEntryWithTasks(dailyEntry.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dailyEntry.id);
    expect(result!.date).toEqual(testDailyEntry.date);
    expect(result!.mood).toEqual('happy');
    expect(result!.notes).toEqual('Great day for testing!');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify tasks are included
    expect(result!.tasks).toHaveLength(2);
    
    const task1 = result!.tasks.find(t => t.title === 'Complete project');
    const task2 = result!.tasks.find(t => t.title === 'Review code');

    expect(task1).toBeDefined();
    expect(task1!.description).toEqual('Finish the daily tracker implementation');
    expect(task1!.is_completed).toBe(false);
    expect(task1!.completed_at).toBeNull();
    expect(task1!.daily_entry_id).toEqual(dailyEntry.id);

    expect(task2).toBeDefined();
    expect(task2!.description).toBeNull();
    expect(task2!.is_completed).toBe(true);
    expect(task2!.completed_at).toBeInstanceOf(Date);
    expect(task2!.daily_entry_id).toEqual(dailyEntry.id);
  });

  it('should return daily entry with empty tasks array when no tasks exist', async () => {
    // Create a daily entry without any tasks
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-16', // Use string format directly
        mood: 'neutral',
        notes: null
      })
      .returning()
      .execute();

    const dailyEntry = dailyEntryResult[0];

    // Get daily entry with tasks
    const result = await getDailyEntryWithTasks(dailyEntry.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dailyEntry.id);
    expect(result!.date).toEqual(new Date('2024-01-16'));
    expect(result!.mood).toEqual('neutral');
    expect(result!.notes).toBeNull();
    expect(result!.tasks).toHaveLength(0);
  });

  it('should return null when daily entry does not exist', async () => {
    const result = await getDailyEntryWithTasks(999);
    expect(result).toBeNull();
  });

  it('should handle daily entry with minimal data and multiple tasks', async () => {
    // Create a minimal daily entry (only date, other fields nullable)
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-17', // Use string format directly
        mood: null,
        notes: null
      })
      .returning()
      .execute();

    const dailyEntry = dailyEntryResult[0];

    // Create multiple tasks with different completion states
    await db.insert(tasksTable)
      .values([
        {
          title: 'Morning routine',
          description: null,
          is_completed: true,
          completed_at: new Date(),
          daily_entry_id: dailyEntry.id
        },
        {
          title: 'Afternoon task',
          description: 'Something to do later',
          is_completed: false,
          daily_entry_id: dailyEntry.id
        },
        {
          title: 'Evening review',
          description: null,
          is_completed: false,
          daily_entry_id: dailyEntry.id
        }
      ])
      .execute();

    const result = await getDailyEntryWithTasks(dailyEntry.id);

    expect(result).not.toBeNull();
    expect(result!.mood).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.tasks).toHaveLength(3);

    // Verify task completion states
    const completedTasks = result!.tasks.filter(t => t.is_completed);
    const incompleteTasks = result!.tasks.filter(t => !t.is_completed);

    expect(completedTasks).toHaveLength(1);
    expect(incompleteTasks).toHaveLength(2);
    expect(completedTasks[0].title).toEqual('Morning routine');
  });

  it('should not return tasks from other daily entries', async () => {
    // Create two daily entries
    const entry1Result = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-18', // Use string format directly
        mood: 'happy',
        notes: 'First entry'
      })
      .returning()
      .execute();

    const entry2Result = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-19', // Use string format directly
        mood: 'sad',
        notes: 'Second entry'
      })
      .returning()
      .execute();

    const entry1 = entry1Result[0];
    const entry2 = entry2Result[0];

    // Create tasks for both entries
    await db.insert(tasksTable)
      .values([
        {
          title: 'Entry 1 Task',
          description: 'Belongs to first entry',
          daily_entry_id: entry1.id
        },
        {
          title: 'Entry 2 Task',
          description: 'Belongs to second entry',
          daily_entry_id: entry2.id
        }
      ])
      .execute();

    // Get first entry with tasks
    const result1 = await getDailyEntryWithTasks(entry1.id);
    expect(result1).not.toBeNull();
    expect(result1!.tasks).toHaveLength(1);
    expect(result1!.tasks[0].title).toEqual('Entry 1 Task');

    // Get second entry with tasks
    const result2 = await getDailyEntryWithTasks(entry2.id);
    expect(result2).not.toBeNull();
    expect(result2!.tasks).toHaveLength(1);
    expect(result2!.tasks[0].title).toEqual('Entry 2 Task');
  });
});
