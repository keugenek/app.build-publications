import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a task for testing
const createTestTask = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      description: input.description || null,
      completed: input.completed || false
    })
    .returning()
    .execute();
    
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a task title', async () => {
    // Create a test task first
    const task = await createTestTask({
      title: 'Original Task',
      description: 'Original description',
      completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    // Verify the update
    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(task.updated_at.getTime());
  });

  it('should update task completion status', async () => {
    // Create a test task first
    const task = await createTestTask({
      title: 'Test Task',
      description: null,
      completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: task.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify the update
    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Test Task');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(task.updated_at.getTime());
  });

  it('should update multiple fields at once', async () => {
    // Create a test task first
    const task = await createTestTask({
      title: 'Original Task',
      description: 'Original description',
      completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Completely Updated Task',
      description: 'New description',
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Completely Updated Task');
    expect(result.description).toEqual('New description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(task.updated_at.getTime());
  });

  it('should save updated task to database', async () => {
    // Create a test task first
    const task = await createTestTask({
      title: 'Test Task',
      description: 'Test description',
      completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Database Updated Task'
    };

    const result = await updateTask(updateInput);

    // Query the database to verify the update was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toEqual(task.id);
    expect(tasks[0].title).toEqual('Database Updated Task');
    expect(tasks[0].description).toEqual('Test description');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
    expect(new Date(tasks[0].updated_at).getTime()).toBeGreaterThanOrEqual(task.updated_at.getTime());
  });

  it('should throw an error when trying to update a non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'Non-existent task'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });
});
