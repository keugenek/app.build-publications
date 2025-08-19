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

  // Helper to create a test task directly in database
  const createTestTask = async () => {
    const result = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        is_completed: false,
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update task title', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
  });

  it('should update task description', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Original Task'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
  });

  it('should set description to null', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
  });

  it('should mark task as completed and set completed_at', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      is_completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.is_completed).toEqual(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at).not.toBeNull();
  });

  it('should mark completed task as incomplete and clear completed_at', async () => {
    const task = await createTestTask();
    
    // First mark as completed
    await updateTask({
      id: task.id,
      is_completed: true
    });

    // Then mark as incomplete
    const updateInput: UpdateTaskInput = {
      id: task.id,
      is_completed: false
    };

    const result = await updateTask(updateInput);

    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Multi-update Title',
      description: 'Multi-update description',
      is_completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Multi-update Title');
    expect(result.description).toEqual('Multi-update description');
    expect(result.is_completed).toEqual(true);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Database Update Test',
      is_completed: true
    };

    await updateTask(updateInput);

    // Query database directly to verify changes
    const savedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(savedTask).toHaveLength(1);
    expect(savedTask[0].title).toEqual('Database Update Test');
    expect(savedTask[0].is_completed).toEqual(true);
    expect(savedTask[0].completed_at).toBeInstanceOf(Date);
  });

  it('should return unchanged task if no updates provided', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Original Task');
    expect(result.description).toEqual('Original description');
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/task with id 99999 not found/i);
  });

  it('should preserve created_at timestamp', async () => {
    const task = await createTestTask();
    const originalCreatedAt = task.created_at;
    
    // Add a small delay to ensure timestamp would be different if changed
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
