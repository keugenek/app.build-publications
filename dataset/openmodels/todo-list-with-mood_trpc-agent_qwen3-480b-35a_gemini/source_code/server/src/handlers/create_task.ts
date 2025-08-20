import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description,
      })
      .returning()
      .execute();

    // Return the created task
    return result[0];
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
