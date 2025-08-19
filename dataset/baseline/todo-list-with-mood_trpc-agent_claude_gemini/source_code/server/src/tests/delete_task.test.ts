import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for creating tasks
const testTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing deletion'
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a task first
    const insertResult = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;

    // Verify task exists
    const tasksBeforeDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasksBeforeDelete).toHaveLength(1);

    // Delete the task
    await deleteTask(taskId);

    // Verify task was deleted
    const tasksAfterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasksAfterDelete).toHaveLength(0);
  });

  it('should throw error when task does not exist', async () => {
    const nonExistentId = 999;

    // Verify task doesn't exist
    const existingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, nonExistentId))
      .execute();
    expect(existingTasks).toHaveLength(0);

    // Attempt to delete non-existent task should throw
    await expect(deleteTask(nonExistentId)).rejects.toThrow(/Task with ID 999 not found/i);
  });

  it('should delete completed task', async () => {
    // Create a completed task
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'A completed task for testing',
        is_completed: true,
        completed_at: new Date()
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;

    // Verify task exists and is completed
    const tasksBeforeDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasksBeforeDelete).toHaveLength(1);
    expect(tasksBeforeDelete[0].is_completed).toBe(true);

    // Delete the completed task
    await deleteTask(taskId);

    // Verify task was deleted
    const tasksAfterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasksAfterDelete).toHaveLength(0);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task'
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task'
      })
      .returning()
      .execute();

    const task1Id = task1Result[0].id;
    const task2Id = task2Result[0].id;

    // Verify both tasks exist
    const allTasksBefore = await db.select()
      .from(tasksTable)
      .execute();
    expect(allTasksBefore).toHaveLength(2);

    // Delete only the first task
    await deleteTask(task1Id);

    // Verify first task was deleted but second task remains
    const task1After = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1Id))
      .execute();
    expect(task1After).toHaveLength(0);

    const task2After = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2Id))
      .execute();
    expect(task2After).toHaveLength(1);
    expect(task2After[0].title).toEqual('Task 2');
  });
});
