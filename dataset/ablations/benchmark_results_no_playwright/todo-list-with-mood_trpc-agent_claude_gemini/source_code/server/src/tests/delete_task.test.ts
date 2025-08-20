import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Test task to delete',
        completed: false
      })
      .returning()
      .execute();

    const testTask = createResult[0];
    const deleteInput: DeleteTaskInput = {
      id: testTask.id
    };

    // Delete the task
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task was actually deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task', async () => {
    const deleteInput: DeleteTaskInput = {
      id: 999999 // Non-existent ID
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should only delete the specified task', async () => {
    // Create multiple test tasks
    const createResult = await db.insert(tasksTable)
      .values([
        {
          description: 'Task 1',
          completed: false
        },
        {
          description: 'Task 2', 
          completed: true
        },
        {
          description: 'Task 3',
          completed: false
        }
      ])
      .returning()
      .execute();

    const taskToDelete = createResult[1]; // Delete the middle task
    const deleteInput: DeleteTaskInput = {
      id: taskToDelete.id
    };

    // Delete one specific task
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the specified task was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.map(t => t.description)).toEqual(['Task 1', 'Task 3']);
    
    // Verify the deleted task is gone
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskToDelete.id))
      .execute();
    
    expect(deletedTask).toHaveLength(0);
  });

  it('should delete completed task successfully', async () => {
    // Create a completed task
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Completed task',
        completed: true,
        completed_at: new Date()
      })
      .returning()
      .execute();

    const completedTask = createResult[0];
    const deleteInput: DeleteTaskInput = {
      id: completedTask.id
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, completedTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should handle multiple delete operations correctly', async () => {
    // Create test tasks
    const createResult = await db.insert(tasksTable)
      .values([
        { description: 'Task A', completed: false },
        { description: 'Task B', completed: true }
      ])
      .returning()
      .execute();

    const [taskA, taskB] = createResult;

    // Delete first task
    const deleteResultA = await deleteTask({ id: taskA.id });
    expect(deleteResultA.success).toBe(true);

    // Delete second task
    const deleteResultB = await deleteTask({ id: taskB.id });
    expect(deleteResultB.success).toBe(true);

    // Try to delete already deleted task
    const deleteResultC = await deleteTask({ id: taskA.id });
    expect(deleteResultC.success).toBe(false);

    // Verify no tasks remain
    const allTasks = await db.select().from(tasksTable).execute();
    expect(allTasks).toHaveLength(0);
  });
});
