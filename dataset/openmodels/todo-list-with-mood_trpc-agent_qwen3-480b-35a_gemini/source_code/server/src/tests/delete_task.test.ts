import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test data
const createTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

const createTaskInDB = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      description: input.description
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a task to delete
    const task = await createTaskInDB(createTaskInput);
    
    // Delete the task
    const deleteInput: DeleteTaskInput = { id: task.id };
    const result = await deleteTask(deleteInput);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify task no longer exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();
    
    expect(tasks).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent task', async () => {
    const deleteInput: DeleteTaskInput = { id: 99999 }; // Non-existent ID
    const result = await deleteTask(deleteInput);
    
    expect(result).toBe(false);
  });

  it('should only delete the specified task', async () => {
    // Create multiple tasks
    const task1 = await createTaskInDB(createTaskInput);
    const task2Input: CreateTaskInput = {
      title: 'Another Task',
      description: 'Second task for testing'
    };
    const task2 = await createTaskInDB(task2Input);
    
    // Delete only the first task
    const deleteInput: DeleteTaskInput = { id: task1.id };
    const result = await deleteTask(deleteInput);
    
    expect(result).toBe(true);
    
    // Verify first task is deleted
    const tasks1 = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1.id))
      .execute();
    expect(tasks1).toHaveLength(0);
    
    // Verify second task still exists
    const tasks2 = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2.id))
      .execute();
    expect(tasks2).toHaveLength(1);
    expect(tasks2[0].title).toEqual('Another Task');
  });
});
