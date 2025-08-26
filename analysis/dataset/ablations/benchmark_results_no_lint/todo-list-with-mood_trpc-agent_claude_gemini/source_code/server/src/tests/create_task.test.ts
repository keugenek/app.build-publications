import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  name: 'Complete project documentation'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with correct properties', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.name).toEqual('Complete project documentation');
    expect(result.is_completed).toBe(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toEqual('Complete project documentation');
    expect(tasks[0].is_completed).toBe(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple tasks with unique ids', async () => {
    const input1: CreateTaskInput = { name: 'Task 1' };
    const input2: CreateTaskInput = { name: 'Task 2' };

    const task1 = await createTask(input1);
    const task2 = await createTask(input2);

    expect(task1.id).not.toEqual(task2.id);
    expect(task1.name).toEqual('Task 1');
    expect(task2.name).toEqual('Task 2');
    expect(task1.is_completed).toBe(false);
    expect(task2.is_completed).toBe(false);
  });

  it('should handle tasks with various name lengths', async () => {
    const shortNameInput: CreateTaskInput = { name: 'A' };
    const longNameInput: CreateTaskInput = { 
      name: 'This is a very long task name that contains many characters and should still work properly'
    };

    const shortTask = await createTask(shortNameInput);
    const longTask = await createTask(longNameInput);

    expect(shortTask.name).toEqual('A');
    expect(longTask.name).toEqual('This is a very long task name that contains many characters and should still work properly');
    expect(shortTask.is_completed).toBe(false);
    expect(longTask.is_completed).toBe(false);
  });

  it('should set created_at and updated_at to same time initially', async () => {
    const result = await createTask(testInput);

    // Times should be very close (within a few milliseconds)
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});
