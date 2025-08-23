import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Prepare update data - only include fields that are provided
    const updateData: Partial<typeof tasksTable.$inferInsert> = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    // Update task record
    const result = await db.update(tasksTable)
      .set({
        ...updateData,
        updated_at: new Date() // Always update the timestamp
      })
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
      created_at: new Date(task.created_at),
      updated_at: new Date(task.updated_at)
    };
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
