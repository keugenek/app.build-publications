import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      description: input.description,
      completed: false
    })
    .returning()
    .execute();
    
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title', async () => {
    // Create a test task first
    const task = await createTestTask({
      title: 'Original Task',
      description: 'Original description'
    });

    // Update the task title
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    // Validate the returned task
    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at).not.toBeNull();

    // Verify the update was saved to database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(dbTask).toHaveLength(1);
    expect(dbTask[0].title).toEqual('Updated Task Title');
    expect(dbTask[0].description).toEqual('Original description');
    expect(dbTask[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update task description', async () => {
    // Create a test task first
    const task = await createTestTask({
      title: 'Test Task',
      description: 'Original description'
    });

    // Update the task description
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    // Validate the returned task
    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toBe(false);

    // Verify the update was saved to database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(dbTask).toHaveLength(1);
    expect(dbTask[0].description).toEqual('Updated description');
  });

  it('should update task completion status', async () => {
    // Create a test task first
    const task = await createTestTask({
      title: 'Test Task',
      description: 'Test description'
    });

    // Update the task completion status
    const updateInput: UpdateTaskInput = {
      id: task.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Validate the returned task
    expect(result.id).toEqual(task.id);
    expect(result.completed).toBe(true);

    // Verify the update was saved to database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(dbTask).toHaveLength(1);
    expect(dbTask[0].completed).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    // Create a test task first
    const task = await createTestTask({
      title: 'Original Task',
      description: 'Original description'
    });

    // Update multiple fields
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Completely Updated Task',
      description: 'Completely updated description',
      completed: true
    };

    const result = await updateTask(updateInput);

    // Validate the returned task
    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Completely Updated Task');
    expect(result.description).toEqual('Completely updated description');
    expect(result.completed).toBe(true);

    // Verify the update was saved to database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(dbTask).toHaveLength(1);
    expect(dbTask[0].title).toEqual('Completely Updated Task');
    expect(dbTask[0].description).toEqual('Completely updated description');
    expect(dbTask[0].completed).toBe(true);
  });

  it('should throw an error when task is not found', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTask(updateInput))
      .rejects
      .toThrow(/Task with id 99999 not found/);
  });
});
