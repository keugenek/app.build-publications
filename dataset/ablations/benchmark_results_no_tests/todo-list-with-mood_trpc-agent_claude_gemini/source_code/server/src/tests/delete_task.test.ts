import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyEntriesTable, tasksTable } from '../db/schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a daily entry first
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-01',
        mood: 'happy',
        notes: 'Test day'
      })
      .returning()
      .execute();
    
    const dailyEntryId = dailyEntryResult[0].id;

    // Create a task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing deletion',
        daily_entry_id: dailyEntryId,
        is_completed: false
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Verify task exists before deletion
    const tasksBefore = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasksBefore).toHaveLength(1);
    expect(tasksBefore[0].title).toEqual('Test Task');

    // Delete the task
    const result = await deleteTask(taskId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify task no longer exists in database
    const tasksAfter = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasksAfter).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task', async () => {
    const nonExistentTaskId = 99999;

    // Attempt to delete non-existent task
    const result = await deleteTask(nonExistentTaskId);

    // Should return false indicating no task was deleted
    expect(result).toBe(false);
  });

  it('should delete completed task successfully', async () => {
    // Create a daily entry first
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-02',
        mood: 'neutral',
        notes: null
      })
      .returning()
      .execute();

    const dailyEntryId = dailyEntryResult[0].id;

    // Create a completed task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: null,
        daily_entry_id: dailyEntryId,
        is_completed: true,
        completed_at: new Date()
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Delete the completed task
    const result = await deleteTask(taskId);

    // Should return true
    expect(result).toBe(true);

    // Verify task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should not affect other tasks when deleting a specific task', async () => {
    // Create a daily entry
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-03',
        mood: 'sad',
        notes: 'Multiple tasks day'
      })
      .returning()
      .execute();

    const dailyEntryId = dailyEntryResult[0].id;

    // Create multiple tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        daily_entry_id: dailyEntryId,
        is_completed: false
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        daily_entry_id: dailyEntryId,
        is_completed: true
      })
      .returning()
      .execute();

    const task1Id = task1Result[0].id;
    const task2Id = task2Result[0].id;

    // Delete only the first task
    const result = await deleteTask(task1Id);

    expect(result).toBe(true);

    // Verify first task is deleted
    const task1After = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1Id))
      .execute();

    expect(task1After).toHaveLength(0);

    // Verify second task still exists
    const task2After = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2Id))
      .execute();

    expect(task2After).toHaveLength(1);
    expect(task2After[0].title).toEqual('Task 2');
    expect(task2After[0].is_completed).toBe(true);
  });

  it('should handle deletion of task with null description', async () => {
    // Create a daily entry
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-04',
        mood: null,
        notes: null
      })
      .returning()
      .execute();

    const dailyEntryId = dailyEntryResult[0].id;

    // Create a task with null description
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        daily_entry_id: dailyEntryId,
        is_completed: false
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Delete the task
    const result = await deleteTask(taskId);

    expect(result).toBe(true);

    // Verify task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });
});
