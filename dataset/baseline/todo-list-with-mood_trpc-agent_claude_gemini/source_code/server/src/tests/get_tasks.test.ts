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
  });

  it('should return all tasks', async () => {
    // Create test tasks with individual inserts to ensure different timestamps
    await db.insert(tasksTable).values({
      title: 'First Task',
      description: 'First task description',
      is_completed: false,
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable).values({
      title: 'Second Task',
      description: null,
      is_completed: true,
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable).values({
      title: 'Third Task',
      description: 'Third task description',
      is_completed: false,
    }).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Third Task'); // Should be newest first
    expect(result[1].title).toEqual('Second Task');
    expect(result[2].title).toEqual('First Task');
  });

  it('should return tasks with correct field types', async () => {
    await db.insert(tasksTable).values({
      title: 'Test Task',
      description: 'Test description',
      is_completed: true,
    }).execute();

    const result = await getTasks();
    const task = result[0];

    expect(task.id).toBeTypeOf('number');
    expect(task.title).toBeTypeOf('string');
    expect(task.description).toBeTypeOf('string');
    expect(task.is_completed).toBeTypeOf('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.completed_at).toBeNull();
  });

  it('should handle null description field', async () => {
    await db.insert(tasksTable).values({
      title: 'Task without description',
      description: null,
      is_completed: false,
    }).execute();

    const result = await getTasks();
    const task = result[0];

    expect(task.description).toBeNull();
    expect(task.title).toEqual('Task without description');
    expect(task.is_completed).toBe(false);
  });

  it('should return tasks ordered by creation date descending', async () => {
    // Create tasks with small delay to ensure different timestamps
    await db.insert(tasksTable).values({
      title: 'Oldest Task',
      description: 'Created first',
      is_completed: false,
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable).values({
      title: 'Middle Task',
      description: 'Created second',
      is_completed: false,
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable).values({
      title: 'Newest Task',
      description: 'Created last',
      is_completed: false,
    }).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Newest Task');
    expect(result[1].title).toEqual('Middle Task');
    expect(result[2].title).toEqual('Oldest Task');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle completed tasks with completion timestamp', async () => {
    const completedAt = new Date();
    await db.insert(tasksTable).values({
      title: 'Completed Task',
      description: 'This task is done',
      is_completed: true,
      completed_at: completedAt,
    }).execute();

    const result = await getTasks();
    const task = result[0];

    expect(task.is_completed).toBe(true);
    expect(task.completed_at).toBeInstanceOf(Date);
    expect(task.completed_at?.getTime()).toBeCloseTo(completedAt.getTime(), -1);
  });
});
