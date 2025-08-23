import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';
import { eq } from 'drizzle-orm';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return all tasks ordered by creation date', async () => {
    // Insert test data
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        completed: false
      })
      .returning()
      .execute();

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        completed: true
      })
      .returning()
      .execute();

    const result = await getTasks();

    // Verify we got the tasks back
    expect(result).toHaveLength(2);
    
    // Verify the order (should be by creation date)
    expect(result[0].id).toEqual(task1[0].id);
    expect(result[1].id).toEqual(task2[0].id);
    
    // Verify task data
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].description).toEqual('First task');
    expect(result[0].completed).toBe(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    expect(result[1].title).toEqual('Task 2');
    expect(result[1].description).toEqual('Second task');
    expect(result[1].completed).toBe(true);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should correctly handle tasks with null descriptions', async () => {
    // Insert task with null description
    await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const result = await getTasks();
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Task with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
  });
});
