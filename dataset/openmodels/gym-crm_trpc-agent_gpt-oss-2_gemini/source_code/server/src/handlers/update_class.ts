import { type UpdateClassInput, type Class } from '../schema';

// Placeholder handler for updating a class
export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  // Real implementation should update DB record and return updated class
  return {
    id: input.id,
    name: input.name ?? 'updated name',
    description: input.description ?? 'updated description',
    trainer: input.trainer ?? 'updated trainer',
    capacity: input.capacity ?? 0,
    date: input.date ?? new Date(),
    time: input.time ?? '00:00',
  } as Class;
};
