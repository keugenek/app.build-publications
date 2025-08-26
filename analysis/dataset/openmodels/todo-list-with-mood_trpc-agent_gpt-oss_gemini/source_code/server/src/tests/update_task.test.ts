import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper to create a task directly in the DB
const createTaskInDB = async (overrides?: Partial<UpdateTaskInput & { title: string }>): Promise<Task> => {
  const base = {
    title: 'Initial Task',
    description: 'Initial description',
    completed: false,
    due_date: new Date('2025-01-01'),
  };
  const input = { ...base, ...overrides };
  const result = await db
    .insert(tasksTable)
    .values({
      title: input.title,
      description: input.description,
      completed: input.completed,
      due_date: input.due_date,
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateTask handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and returns the updated task', async () => {
    const original = await createTaskInDB();

    const updateInput: UpdateTaskInput = {
      id: original.id,
      title: 'Updated Title',
      completed: true,
    };

    const updated = await updateTask(updateInput);

    // Verify returned object reflects updates
    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe('Updated Title');
    expect(updated.completed).toBe(true);
    // Unchanged fields should retain original values
    expect(updated.description).toBe(original.description);
    expect(updated.due_date!.getTime()).toBe(original.due_date!.getTime());

    // Verify database record is updated
    const dbTask = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, original.id))
      .execute();

    expect(dbTask).toHaveLength(1);
    const dbRecord = dbTask[0];
    expect(dbRecord.title).toBe('Updated Title');
    expect(dbRecord.completed).toBe(true);
    expect(dbRecord.description).toBe(original.description);
  });

  it('throws an error when task does not exist', async () => {
    const nonExistentInput: UpdateTaskInput = {
      id: 9999,
      title: 'Should Fail',
    };

    await expect(updateTask(nonExistentInput)).rejects.toThrow(/not found/i);
  });
});
