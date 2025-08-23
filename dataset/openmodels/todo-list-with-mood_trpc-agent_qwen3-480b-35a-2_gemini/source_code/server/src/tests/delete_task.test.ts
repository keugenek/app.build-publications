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
    // First, create a task to delete
    const newTask = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing deletion',
        due_date: new Date(),
        completed: false
      })
      .returning()
      .execute();
    
    const taskId = newTask[0].id;
    
    // Delete the task
    const result = await deleteTask(taskId);
    
    // Check that the deletion was successful
    expect(result).toBe(true);
    
    // Verify the task no longer exists in the database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    expect(tasks).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const result = await deleteTask(99999); // Using a high ID that shouldn't exist
    
    // Check that the deletion returned false
    expect(result).toBe(false);
  });

  it('should only delete the specified task', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        due_date: new Date(),
        completed: false
      })
      .returning()
      .execute();
    
    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        due_date: new Date(),
        completed: false
      })
      .returning()
      .execute();
    
    const taskId1 = task1[0].id;
    const taskId2 = task2[0].id;
    
    // Delete only the first task
    const result = await deleteTask(taskId1);
    
    expect(result).toBe(true);
    
    // Verify first task is deleted
    const tasks1 = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId1))
      .execute();
    
    expect(tasks1).toHaveLength(0);
    
    // Verify second task still exists
    const tasks2 = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId2))
      .execute();
    
    expect(tasks2).toHaveLength(1);
    expect(tasks2[0].id).toBe(taskId2);
  });
});
