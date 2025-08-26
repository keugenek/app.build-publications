import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';
import { type Task } from '../schema';
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
        title: 'First Task',
        description: 'First task description',
        completed: false
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Second Task',
        description: 'Second task description',
        completed: true
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const task3 = await db.insert(tasksTable)
      .values({
        title: 'Third Task',
        description: 'Third task description',
        completed: false
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const result = await getTasks();

    // Should return all tasks
    expect(result).toHaveLength(3);

    // Should be ordered by creation date (ascending)
    expect(result[0].id).toEqual(task1.id);
    expect(result[1].id).toEqual(task2.id);
    expect(result[2].id).toEqual(task3.id);

    // Verify task structure
    const firstTask = result[0];
    expect(firstTask).toEqual({
      id: task1.id,
      title: 'First Task',
      description: 'First task description',
      completed: false,
      created_at: expect.any(Date),
      updated_at: expect.any(Date) || null
    });
  });

  it('should handle tasks with null descriptions', async () => {
    // Insert task with null description
    await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTasks();
    
    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].title).toEqual('Task with null description');
  });

  it('should properly convert date fields', async () => {
    // Insert a task
    const insertedTask = await db.insert(tasksTable)
      .values({
        title: 'Date Test Task',
        description: 'Testing date conversion',
        completed: false
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const result = await getTasks();
    
    expect(result).toHaveLength(1);
    
    const task = result[0];
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
    
    // Dates should match the inserted task
    expect(task.created_at.getTime()).toBeGreaterThanOrEqual(new Date(insertedTask.created_at).getTime());
  });
});
