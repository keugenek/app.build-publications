import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { getTasks } from '../handlers/get_tasks';
import { eq } from 'drizzle-orm';

// Sample task input
const sampleTask: Omit<Task, 'id' | 'created_at'> = {
  title: 'Sample Task',
  description: null,
  completed: false,
};

describe('getTasks handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no tasks exist', async () => {
    const tasks = await getTasks();
    expect(tasks).toEqual([]);
  });

  it('should retrieve all tasks from the database', async () => {
    // Insert a task directly into the DB
    const inserted = await db
      .insert(tasksTable)
      .values({
        title: sampleTask.title,
        description: sampleTask.description,
        completed: sampleTask.completed,
      })
      .returning()
      .execute();

    const expected = inserted[0];

    const tasks = await getTasks();
    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.id).toBeDefined();
    expect(task.title).toBe(expected.title);
    expect(task.description).toBeNull();
    expect(task.completed).toBe(expected.completed);
    expect(task.created_at).toBeInstanceOf(Date);
  });

  it('should correctly map description when present', async () => {
    const description = 'Detailed description';
    await db
      .insert(tasksTable)
      .values({
        title: 'Task with description',
        description,
        completed: true,
      })
      .execute();

    const tasks = await getTasks();
    const task = tasks.find(t => t.title === 'Task with description');
    expect(task).toBeDefined();
    expect(task?.description).toBe(description);
  });
});
