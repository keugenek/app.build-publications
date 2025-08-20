import { type CreateTaskInput, type Task } from '../schema';

/**
 * Placeholder handler to create a new task.
 * In a real implementation this would insert into the DB and return the created record.
 */
export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  return Promise.resolve({
    id: 0, // placeholder ID
    title: input.title,
    description: input.description ?? null,
    completed: input.completed ?? false,
    due_date: input.due_date ?? null,
    created_at: new Date(),
  });
};
