import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input with required fields
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

// Test input with null description
const testInputNullDescription: CreateTaskInput = {
  title: 'Test Task Without Description',
  description: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with description', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a task with null description', async () => {
    const result = await createTask(testInputNullDescription);

    // Basic field validation
    expect(result.title).toEqual('Test Task Without Description');
    expect(result.description).toBeNull();
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].is_completed).toEqual(false);
    expect(tasks[0].completed_at).toBeNull();
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should save task with null description to database', async () => {
    const result = await createTask(testInputNullDescription);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task Without Description');
    expect(tasks[0].description).toBeNull();
    expect(tasks[0].is_completed).toEqual(false);
    expect(tasks[0].completed_at).toBeNull();
  });

  it('should create multiple tasks with unique IDs', async () => {
    const task1 = await createTask({
      title: 'First Task',
      description: 'First description'
    });

    const task2 = await createTask({
      title: 'Second Task',
      description: null
    });

    // Verify unique IDs
    expect(task1.id).not.toEqual(task2.id);
    expect(task1.title).toEqual('First Task');
    expect(task2.title).toEqual('Second Task');

    // Verify both exist in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
    
    const taskTitles = allTasks.map(task => task.title);
    expect(taskTitles).toContain('First Task');
    expect(taskTitles).toContain('Second Task');
  });

  it('should handle timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createTask(testInput);
    const afterCreation = new Date();

    // Verify created_at is within reasonable time range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Verify completed_at is null for new tasks
    expect(result.completed_at).toBeNull();
  });
});
