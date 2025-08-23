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
        due_date: input.due_date,
        completed: false
      })
      .returning()
      .execute();

    const task = result[0];
    return {
      ...task,
      due_date: task.due_date,
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
