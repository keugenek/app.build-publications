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
        daily_entry_id: input.daily_entry_id,
        is_completed: false, // Tasks start as incomplete by default
      })
      .returning()
      .execute();

    // Return the created task
    const task = result[0];
    return {
      ...task,
      // Convert timestamps to Date objects for consistent API
      created_at: new Date(task.created_at),
      completed_at: task.completed_at ? new Date(task.completed_at) : null,
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
