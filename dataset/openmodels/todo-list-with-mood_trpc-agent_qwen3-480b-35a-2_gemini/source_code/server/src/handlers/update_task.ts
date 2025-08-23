import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Build the update object with only the provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.due_date !== undefined) {
      updateData.due_date = input.due_date;
    }
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the task in the database
    const result = await db.update(tasksTable)
      .set(updateData)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    // Return the updated task
    const task = result[0];
    return {
      ...task,
      due_date: new Date(task.due_date),
      created_at: new Date(task.created_at),
      updated_at: new Date(task.updated_at)
    };
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
