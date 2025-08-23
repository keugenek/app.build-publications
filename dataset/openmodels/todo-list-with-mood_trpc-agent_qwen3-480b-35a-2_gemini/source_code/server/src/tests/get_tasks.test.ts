import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { getTasks } from '../handlers/get_tasks';
import { eq } from 'drizzle-orm';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should fetch all tasks from the database', async () => {
    // Insert test data
    const testTasks = [
      {
        title: 'Task 1',
        description: 'First test task',
        due_date: new Date('2023-12-31'),
        completed: false
      },
      {
        title: 'Task 2',
        description: 'Second test task',
        due_date: new Date('2024-01-15'),
        completed: true
      }
    ];

    // Insert tasks into database
    for (const task of testTasks) {
      await db.insert(tasksTable)
        .values(task)
        .execute();
    }

    // Fetch tasks using handler
    const result = await getTasks();

    // Validate result
    expect(result).toHaveLength(2);
    
    // Check first task
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].description).toEqual('First test task');
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].due_date.getTime()).toEqual(new Date('2023-12-31').getTime());
    expect(result[0].completed).toBe(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second task
    expect(result[1].title).toEqual('Task 2');
    expect(result[1].description).toEqual('Second test task');
    expect(result[1].due_date).toBeInstanceOf(Date);
    expect(result[1].due_date.getTime()).toEqual(new Date('2024-01-15').getTime());
    expect(result[1].completed).toBe(true);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should handle tasks with null descriptions', async () => {
    // Insert test data with null description
    await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        due_date: new Date('2023-12-31'),
        completed: false
      })
      .execute();

    // Fetch tasks using handler
    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Task with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].due_date).toBeInstanceOf(Date);
  });
});
