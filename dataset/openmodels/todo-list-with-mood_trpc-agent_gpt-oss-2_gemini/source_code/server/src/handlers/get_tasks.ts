import { type Task } from '../schema';
import { db } from '../db';
import { tasksTable } from '../db/schema';

export const getTasks = async (): Promise<Task[]> => {
  // Fetch all tasks from the database
  try {
    const rows = await db.select().from(tasksTable).execute();
    // The rows already match the Zod Task shape (created_at is a Date, etc.)
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      completed: row.completed,
      created_at: row.created_at
    }));
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw error;
  }
  
};
