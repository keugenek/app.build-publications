import { db } from '../db';
import { eq } from 'drizzle-orm';
import { tasksTable } from '../db/schema';
import type { NewTask } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';

/**
 * Handler to update an existing task.
 * Performs an UPDATE query on the tasks table, applying only the fields
 * provided in the input. Returns the updated task record.
 */
export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Build the fields to update conditionally
    const updateFields: Partial<NewTask> = {};

    if (input.title !== undefined) updateFields.title = input.title;
    if (input.description !== undefined) updateFields.description = input.description;
    if (input.completed !== undefined) updateFields.completed = input.completed;
    if (input.due_date !== undefined) updateFields.due_date = input.due_date;

    // Perform the update and return the updated row
    const result = await db
      .update(tasksTable)
      .set(updateFields)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    // If no row was affected, throw an error
    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    // The result already has correct Date types for timestamps
    return result[0];
  } catch (error) {
    console.error('Failed to update task:', error);
    throw error;
  }
};
