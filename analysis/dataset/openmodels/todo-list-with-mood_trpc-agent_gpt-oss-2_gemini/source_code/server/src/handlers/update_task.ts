import { db } from '../db';
import { eq } from 'drizzle-orm';
import { tasksTable, type NewTask } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';

/**
 * Update an existing task. Only the fields provided in the input are updated.
 * Returns the full Task object after the update.
 */
export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Build a partial update object containing only defined fields
    const updates: Partial<NewTask> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.completed !== undefined) updates.completed = input.completed;

    // Perform the update and return the updated row
    const result = await db
      .update(tasksTable)
      .set(updates)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description ?? null,
      completed: updated.completed,
      created_at: updated.created_at,
    } as Task;
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
