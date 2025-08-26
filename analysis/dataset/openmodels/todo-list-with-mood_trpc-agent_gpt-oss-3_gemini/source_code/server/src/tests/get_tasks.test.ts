import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { getTasks } from '../handlers/get_tasks';
import { eq } from 'drizzle-orm';

describe('getTasks handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all tasks from the database', async () => {
    // Insert a task
    const insertResult = await db
      .insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        completed: false,
        // due_date can be null
      })
      .returning()
      .execute();

    const insertedTask = insertResult[0];

    // Call handler
    const tasks = await getTasks();

    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('A task for testing');
    expect(task.completed).toBe(false);
    // Ensure IDs match
    expect(task.id).toBe(insertedTask.id);
    // created_at should be a Date instance
    expect(task.created_at).toBeInstanceOf(Date);
    // due_date can be null
    expect(task.due_date).toBeNull();
  });

  it('should correctly map nullable fields', async () => {
    // Insert a task with null description and due_date
    const insertResult = await db
      .insert(tasksTable)
      .values({
        title: 'Nullable Task',
        description: null,
        completed: true,
        due_date: null,
      })
      .returning()
      .execute();

    const tasks = await getTasks();
    const task = tasks.find(t => t.id === insertResult[0].id);
    expect(task).toBeDefined();
    expect(task?.description).toBeNull();
    expect(task?.due_date).toBeNull();
    expect(task?.completed).toBe(true);
  });
});
