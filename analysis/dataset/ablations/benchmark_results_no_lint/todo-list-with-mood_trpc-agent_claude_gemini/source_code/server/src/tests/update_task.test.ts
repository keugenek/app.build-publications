import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task completion status from false to true', async () => {
    // Create a test task first
    const taskResult = await db.insert(tasksTable)
      .values({
        name: 'Test Task',
        is_completed: false
      })
      .returning()
      .execute();
    
    const createdTask = taskResult[0];
    const originalUpdatedAt = createdTask.updated_at;

    // Wait a moment to ensure updated_at timestamp changes
    await new Promise(resolve => setTimeout(resolve, 50));

    // Update task to completed
    const input: UpdateTaskInput = {
      id: createdTask.id,
      is_completed: true
    };

    const result = await updateTask(input);

    // Verify the result
    expect(result.id).toEqual(createdTask.id);
    expect(result.name).toEqual('Test Task');
    expect(result.is_completed).toBe(true);
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task completion status from true to false', async () => {
    // Create a completed test task
    const taskResult = await db.insert(tasksTable)
      .values({
        name: 'Completed Task',
        is_completed: true
      })
      .returning()
      .execute();
    
    const createdTask = taskResult[0];

    // Update task to incomplete
    const input: UpdateTaskInput = {
      id: createdTask.id,
      is_completed: false
    };

    const result = await updateTask(input);

    // Verify the result
    expect(result.id).toEqual(createdTask.id);
    expect(result.name).toEqual('Completed Task');
    expect(result.is_completed).toBe(false);
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        name: 'Persistence Test Task',
        is_completed: false
      })
      .returning()
      .execute();
    
    const createdTask = taskResult[0];

    // Update the task
    const input: UpdateTaskInput = {
      id: createdTask.id,
      is_completed: true
    };

    await updateTask(input);

    // Verify changes were persisted by querying directly
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].is_completed).toBe(true);
    expect(updatedTasks[0].name).toEqual('Persistence Test Task');
    expect(updatedTasks[0].updated_at.getTime()).toBeGreaterThanOrEqual(createdTask.updated_at.getTime());
  });

  it('should throw error when task does not exist', async () => {
    const input: UpdateTaskInput = {
      id: 99999, // Non-existent task ID
      is_completed: true
    };

    await expect(updateTask(input)).rejects.toThrow(/Task with id 99999 not found/);
  });

  it('should update updated_at timestamp without changing other fields', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        name: 'Timestamp Test Task',
        is_completed: false
      })
      .returning()
      .execute();
    
    const originalTask = taskResult[0];

    // Wait to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 50));

    // Update with the same completion status (no logical change)
    const input: UpdateTaskInput = {
      id: originalTask.id,
      is_completed: false
    };

    const result = await updateTask(input);

    // Verify only updated_at changed
    expect(result.id).toEqual(originalTask.id);
    expect(result.name).toEqual(originalTask.name);
    expect(result.is_completed).toEqual(originalTask.is_completed);
    expect(result.created_at).toEqual(originalTask.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTask.updated_at.getTime());
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple task updates correctly', async () => {
    // Create multiple test tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        name: 'Task 1',
        is_completed: false
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        name: 'Task 2',
        is_completed: false
      })
      .returning()
      .execute();

    const task1 = task1Result[0];
    const task2 = task2Result[0];

    // Update both tasks
    const input1: UpdateTaskInput = {
      id: task1.id,
      is_completed: true
    };

    const input2: UpdateTaskInput = {
      id: task2.id,
      is_completed: true
    };

    const result1 = await updateTask(input1);
    const result2 = await updateTask(input2);

    // Verify both updates worked correctly
    expect(result1.is_completed).toBe(true);
    expect(result1.name).toEqual('Task 1');
    expect(result2.is_completed).toBe(true);
    expect(result2.name).toEqual('Task 2');

    // Verify in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    const updatedTasks = allTasks.filter(task => 
      task.id === task1.id || task.id === task2.id
    );

    expect(updatedTasks).toHaveLength(2);
    expect(updatedTasks.every(task => task.is_completed)).toBe(true);
  });
});
