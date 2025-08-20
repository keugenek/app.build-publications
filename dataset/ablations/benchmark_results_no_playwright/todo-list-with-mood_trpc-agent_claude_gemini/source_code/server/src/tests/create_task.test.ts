import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateTaskInput = {
  description: 'Complete project documentation'
};

const testInputMinimal: CreateTaskInput = {
  description: 'A'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with valid input', async () => {
    const result = await createTask(testInput);

    // Verify task properties
    expect(result.description).toEqual('Complete project documentation');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toEqual('Complete project documentation');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
    expect(tasks[0].completed_at).toBeNull();
  });

  it('should handle minimal description length', async () => {
    const result = await createTask(testInputMinimal);

    expect(result.description).toEqual('A');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple tasks with unique IDs', async () => {
    const task1 = await createTask({ description: 'First task' });
    const task2 = await createTask({ description: 'Second task' });

    expect(task1.id).not.toEqual(task2.id);
    expect(task1.description).toEqual('First task');
    expect(task2.description).toEqual('Second task');
    
    // Verify both tasks exist in database
    const allTasks = await db.select().from(tasksTable).execute();
    expect(allTasks).toHaveLength(2);
  });

  it('should set proper default timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createTask(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle special characters in description', async () => {
    const specialInput: CreateTaskInput = {
      description: 'Task with special chars: @#$%^&*()_+-={}[]|\\:";\'<>?,./'
    };

    const result = await createTask(specialInput);

    expect(result.description).toEqual(specialInput.description);
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
  });

  it('should handle unicode characters in description', async () => {
    const unicodeInput: CreateTaskInput = {
      description: 'Unicode task: 你好 🌟 café naïve résumé'
    };

    const result = await createTask(unicodeInput);

    expect(result.description).toEqual(unicodeInput.description);
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
  });
});
