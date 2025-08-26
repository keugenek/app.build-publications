import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Build the update values object with only provided fields
    const updateValues: Partial<typeof tasksTable.$inferInsert> = {};
    
    if (input.title !== undefined) {
      updateValues.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateValues.description = input.description;
    }
    
    if (input.completed !== undefined) {
      updateValues.completed = input.completed;
    }

    // Update the task record
    const result = await db.update(tasksTable)
      .set({
        ...updateValues,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const task = result[0];
    return {
      ...task,
      created_at: new Date(task.created_at),
      updated_at: task.updated_at ? new Date(task.updated_at) : null
    };
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
