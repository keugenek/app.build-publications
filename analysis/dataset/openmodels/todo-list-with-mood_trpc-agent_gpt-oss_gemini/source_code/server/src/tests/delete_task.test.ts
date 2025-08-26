import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteTask } from '../handlers/delete_task';

describe('deleteTask handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task and return true', async () => {
    // Insert a task directly
    const [inserted] = await db
      .insert(tasksTable)
      .values({
        title: 'Sample Task',
        description: 'Task for deletion test',
        completed: false,
        // due_date omitted (nullable)
      })
      .returning()
      .execute();

    const deleted = await deleteTask(inserted.id);
    expect(deleted).toBeTrue();

    // Verify task no longer exists
    const remaining = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, inserted.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should return false when task does not exist', async () => {
    const nonExistentId = 9999;
    const result = await deleteTask(nonExistentId);
    expect(result).toBeFalse();
  });
});
