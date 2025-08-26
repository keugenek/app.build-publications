import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        name: input.name,
        is_completed: false // Default value as specified in schema
      })
      .returning()
      .execute();

    // Return the created task
    const task = result[0];
    return {
      id: task.id,
      name: task.name,
      is_completed: task.is_completed,
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
