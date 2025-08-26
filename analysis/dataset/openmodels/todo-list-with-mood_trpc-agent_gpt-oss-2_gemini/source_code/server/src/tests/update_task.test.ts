import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update only provided fields', async () => {
    // Insert initial task
    const [initial] = await db
      .insert(tasksTable)
      .values({
        title: 'Initial Title',
        description: 'Initial description',
        completed: false,
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: initial.id,
      title: 'Updated Title',
      // description omitted -> should remain unchanged
      completed: true,
    };

    const updated = await updateTask(updateInput);

    // Verify returned object reflects updates
    expect(updated.id).toBe(initial.id);
    expect(updated.title).toBe('Updated Title');
    expect(updated.description).toBe('Initial description'); // unchanged
    expect(updated.completed).toBe(true);
    expect(updated.created_at).toBeInstanceOf(Date);

    // Verify database state matches
    const [dbTask] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, initial.id))
      .execute();

    expect(dbTask.title).toBe('Updated Title');
    expect(dbTask.description).toBe('Initial description');
    expect(dbTask.completed).toBe(true);
  });

  it('should handle updating nullable description to null', async () => {
    const [initial] = await db
      .insert(tasksTable)
      .values({
        title: 'Task with description',
        description: 'Some description',
        completed: false,
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: initial.id,
      description: null, // explicitly set to null
    };

    const updated = await updateTask(updateInput);
    expect(updated.description).toBeNull();

    const [dbTask] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, initial.id))
      .execute();
    expect(dbTask.description).toBeNull();
  });
});
