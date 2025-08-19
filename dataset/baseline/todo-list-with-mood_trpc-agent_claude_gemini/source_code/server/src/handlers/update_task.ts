import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // First, check if the task exists
    const existingTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (existingTask.length === 0) {
      throw new Error(`Task with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.is_completed !== undefined) {
      updateData.is_completed = input.is_completed;
      
      // Set completed_at when marking as completed, clear it when marking as incomplete
      updateData.completed_at = input.is_completed ? new Date() : null;
    }

    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      // Return existing task if no updates provided
      return existingTask[0];
    }

    // Update the task
    const result = await db.update(tasksTable)
      .set(updateData)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
