import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
  try {
    // First, get the current task to check if completed status is changing
    const currentTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (currentTask.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const existing = currentTask[0];

    // Prepare update values
    const updateValues: any = {
      updated_at: new Date()
    };

    // Only update fields that are provided
    if (input.description !== undefined) {
      updateValues.description = input.description;
    }

    if (input.completed !== undefined) {
      updateValues.completed = input.completed;
      
      // If task is being marked as completed and wasn't completed before
      if (input.completed && !existing.completed) {
        updateValues.completed_at = new Date();
      }
      // If task is being marked as not completed, clear completed_at
      else if (!input.completed && existing.completed) {
        updateValues.completed_at = null;
      }
    }

    // Update the task
    const result = await db.update(tasksTable)
      .set(updateValues)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
}
