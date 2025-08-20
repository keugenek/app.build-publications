import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all tasks ordered by creation date (newest first)', async () => {
    // Create test tasks with different creation times
    const task1 = await db.insert(tasksTable)
      .values({
        name: 'First Task',
        is_completed: false,
        created_at: new Date('2024-01-01T10:00:00Z'),
        updated_at: new Date('2024-01-01T10:00:00Z')
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        name: 'Second Task',
        is_completed: true,
        created_at: new Date('2024-01-02T10:00:00Z'),
        updated_at: new Date('2024-01-02T10:00:00Z')
      })
      .returning()
      .execute();

    const task3 = await db.insert(tasksTable)
      .values({
        name: 'Third Task',
        is_completed: false,
        created_at: new Date('2024-01-03T10:00:00Z'),
        updated_at: new Date('2024-01-03T10:00:00Z')
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first (task3, task2, task1)
    expect(result[0].name).toEqual('Third Task');
    expect(result[1].name).toEqual('Second Task');
    expect(result[2].name).toEqual('First Task');

    // Verify all fields are properly returned
    expect(result[0].id).toBeDefined();
    expect(result[0].name).toEqual('Third Task');
    expect(result[0].is_completed).toBe(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return tasks with different completion statuses', async () => {
    // Create completed and incomplete tasks
    await db.insert(tasksTable)
      .values({
        name: 'Completed Task',
        is_completed: true
      })
      .execute();

    await db.insert(tasksTable)
      .values({
        name: 'Incomplete Task',
        is_completed: false
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Verify both completion statuses are included
    const completionStatuses = result.map(task => task.is_completed);
    expect(completionStatuses).toContain(true);
    expect(completionStatuses).toContain(false);
  });

  it('should handle tasks with various names correctly', async () => {
    const taskNames = [
      'Simple task',
      'Task with special chars: !@#$%',
      'Very long task name that spans multiple words and contains various punctuation marks, numbers 123, and symbols &*()_+',
      ''  // Empty string (if allowed by validation)
    ];

    // Insert all test tasks
    for (const name of taskNames) {
      await db.insert(tasksTable)
        .values({ name, is_completed: false })
        .execute();
    }

    const result = await getTasks();

    expect(result).toHaveLength(taskNames.length);
    
    // Verify all task names are present
    const resultNames = result.map(task => task.name);
    for (const expectedName of taskNames) {
      expect(resultNames).toContain(expectedName);
    }
  });

  it('should maintain proper data types for all fields', async () => {
    await db.insert(tasksTable)
      .values({
        name: 'Type Test Task',
        is_completed: true
      })
      .execute();

    const result = await getTasks();
    const task = result[0];

    expect(typeof task.id).toBe('number');
    expect(typeof task.name).toBe('string');
    expect(typeof task.is_completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });
});
