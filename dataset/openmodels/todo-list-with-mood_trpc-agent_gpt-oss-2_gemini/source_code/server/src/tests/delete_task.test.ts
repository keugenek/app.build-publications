import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteTask } from '../handlers/delete_task';

describe('deleteTask handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task and return its data', async () => {
    // Insert a task directly
    const [inserted] = await db
      .insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Task description',
        // completed defaults to false
      })
      .returning()
      .execute();

    // Ensure task was created
    expect(inserted.id).toBeDefined();

    // Delete the task via handler
    const deleted = await deleteTask(inserted.id);

    // Verify returned data matches inserted values
    expect(deleted.id).toBe(inserted.id);
    expect(deleted.title).toBe('Test Task');
    expect(deleted.description).toBe('Task description');
    expect(deleted.completed).toBe(false);
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Verify task is no longer in the database
    const remaining = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, inserted.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent task', async () => {
    await expect(deleteTask(9999)).rejects.toThrow(/not found/i);
  });
});
