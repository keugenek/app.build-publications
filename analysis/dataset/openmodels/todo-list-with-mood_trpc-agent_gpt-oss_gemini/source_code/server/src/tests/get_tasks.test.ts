import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { getTasks } from '../handlers/get_tasks';
import { eq } from 'drizzle-orm';

// Sample task input for insertion
const sampleTask: Partial<Task> = {
  title: 'Test Task',
  description: 'A task for testing',
  completed: false,
  due_date: new Date('2025-01-01')
};

describe('getTasks handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no tasks exist', async () => {
    const tasks = await getTasks();
    expect(tasks).toBeArray();
    expect(tasks).toHaveLength(0);
  });

  it('should retrieve all tasks from the database', async () => {
    // Insert a task directly using drizzle
    await db.insert(tasksTable).values(sampleTask as any).execute();

    const tasks = await getTasks();
    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('A task for testing');
    expect(task.completed).toBe(false);
    expect(task.due_date).toBeInstanceOf(Date);
    expect(task.id).toBeDefined();
    expect(task.created_at).toBeInstanceOf(Date);
  });

  it('should correctly map database fields to Task type', async () => {
    // Insert multiple tasks
    await db.insert(tasksTable).values([
      { title: 'Task 1', description: null, completed: true },
      { title: 'Task 2', description: 'Second task', completed: false }
    ] as any).execute();

    const tasks = await getTasks();
    expect(tasks).toHaveLength(2);
    const [t1, t2] = tasks;
    expect(t1.title).toBe('Task 1');
    expect(t1.description).toBeNull();
    expect(t1.completed).toBe(true);
    expect(t2.title).toBe('Task 2');
    expect(t2.description).toBe('Second task');
    expect(t2.completed).toBe(false);
  });
});
