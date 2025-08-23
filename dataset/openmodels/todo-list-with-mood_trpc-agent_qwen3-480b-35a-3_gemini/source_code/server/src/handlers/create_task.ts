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
        completed: input.completed
      })
      .returning()
      .execute();

    // Return the created task
    const task = result[0];
    return {
      ...task,
      created_at: new Date(task.created_at),
      updated_at: new Date(task.updated_at)
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
