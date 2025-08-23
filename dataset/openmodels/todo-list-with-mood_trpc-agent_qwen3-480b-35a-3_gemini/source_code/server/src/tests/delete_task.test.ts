import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // First create a task to delete
    const newTask = await db.insert(tasksTable)
      .values({
        title: 'Test Task to Delete',
        description: 'A task that will be deleted',
        completed: false
      })
      .returning()
      .execute();
    
    const taskId = newTask[0].id;
    
    // Delete the task
    const result = await deleteTask(taskId);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify task no longer exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    expect(tasks).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const result = await deleteTask(99999);
    
    // Should return false for non-existent task
    expect(result).toBe(false);
  });

  it('should handle deletion of multiple tasks correctly', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({ title: 'Task 1', description: 'First task' })
      .returning()
      .execute();
    
    const task2 = await db.insert(tasksTable)
      .values({ title: 'Task 2', description: 'Second task' })
      .returning()
      .execute();
    
    // Delete one task
    const result1 = await deleteTask(task1[0].id);
    expect(result1).toBe(true);
    
    // Verify only one task was deleted
    const remainingTasks = await db.select().from(tasksTable).execute();
    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].id).toBe(task2[0].id);
    
    // Delete the second task
    const result2 = await deleteTask(task2[0].id);
    expect(result2).toBe(true);
    
    // Verify no tasks remain
    const finalTasks = await db.select().from(tasksTable).execute();
    expect(finalTasks).toHaveLength(0);
  });
});
