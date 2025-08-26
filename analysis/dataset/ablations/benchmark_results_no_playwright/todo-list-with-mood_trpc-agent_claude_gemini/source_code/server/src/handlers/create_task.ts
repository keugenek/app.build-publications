import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Insert task record with default values
    const result = await db.insert(tasksTable)
      .values({
        description: input.description,
        completed: false, // Default value
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: null // Default to null - only set when completed
      })
      .returning()
      .execute();

    // Return the created task
    const task = result[0];
    return {
      ...task,
      // Ensure dates are properly typed
      created_at: new Date(task.created_at),
      updated_at: new Date(task.updated_at),
      completed_at: task.completed_at ? new Date(task.completed_at) : null
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
