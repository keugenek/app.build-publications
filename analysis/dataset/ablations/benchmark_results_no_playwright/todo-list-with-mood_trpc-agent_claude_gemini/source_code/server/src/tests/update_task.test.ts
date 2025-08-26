import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (description: string = 'Test task'): Promise<number> => {
  const result = await db.insert(tasksTable)
    .values({ description })
    .returning()
    .execute();
  return result[0].id;
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task description', async () => {
    const taskId = await createTestTask('Original task');

    const input: UpdateTaskInput = {
      id: taskId,
      description: 'Updated task description'
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.description).toEqual('Updated task description');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should update task completion status to true and set completed_at', async () => {
    const taskId = await createTestTask('Test task');

    const input: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.description).toEqual('Test task');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at).not.toBeNull();
  });

  it('should update task completion status to false and clear completed_at', async () => {
    // Create a completed task first
    const taskId = await createTestTask('Test task');
    await db.update(tasksTable)
      .set({ 
        completed: true, 
        completed_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, taskId))
      .execute();

    const input: UpdateTaskInput = {
      id: taskId,
      completed: false
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.description).toEqual('Test task');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should update both description and completion status', async () => {
    const taskId = await createTestTask('Original task');

    const input: UpdateTaskInput = {
      id: taskId,
      description: 'Updated and completed task',
      completed: true
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.description).toEqual('Updated and completed task');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should not change completed_at when task remains completed', async () => {
    // Create a completed task first
    const taskId = await createTestTask('Test task');
    const originalCompletedAt = new Date('2024-01-01T10:00:00Z');
    await db.update(tasksTable)
      .set({ 
        completed: true, 
        completed_at: originalCompletedAt,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, taskId))
      .execute();

    const input: UpdateTaskInput = {
      id: taskId,
      description: 'Updated description',
      completed: true
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.completed_at).toEqual(originalCompletedAt);
  });

  it('should not change completed_at when task remains incomplete', async () => {
    const taskId = await createTestTask('Test task');

    const input: UpdateTaskInput = {
      id: taskId,
      description: 'Updated description',
      completed: false
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false);
    expect(result.completed_at).toBeNull();
  });

  it('should save updated task to database', async () => {
    const taskId = await createTestTask('Original task');

    const input: UpdateTaskInput = {
      id: taskId,
      description: 'Updated task',
      completed: true
    };

    const result = await updateTask(input);

    // Verify the task was actually saved to database
    const savedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(savedTask).toHaveLength(1);
    expect(savedTask[0].id).toEqual(result.id);
    expect(savedTask[0].description).toEqual('Updated task');
    expect(savedTask[0].completed).toEqual(true);
    expect(savedTask[0].completed_at).toBeInstanceOf(Date);
    expect(savedTask[0].updated_at).toBeInstanceOf(Date);
  });

  it('should preserve original timestamps when only updating specific fields', async () => {
    const taskId = await createTestTask('Original task');
    
    // Get original timestamps
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    const originalCreatedAt = originalTask[0].created_at;

    const input: UpdateTaskInput = {
      id: taskId,
      description: 'Updated description'
    };

    const result = await updateTask(input);

    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt!.getTime());
  });

  it('should throw error when task does not exist', async () => {
    const input: UpdateTaskInput = {
      id: 999999, // Non-existent ID
      description: 'This should fail'
    };

    await expect(updateTask(input)).rejects.toThrow(/Task with id 999999 not found/i);
  });
});
