import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  // Placeholder implementation – in real code, insert into DB and return created task
  return {
    id: 0,
    title: input.title,
    description: input.description ?? null,
    completed: input.completed ?? false,
    created_at: new Date(),
  } as Task;
};
