import { type CreateCategoryInput, type UpdateCategoryInput, type Category } from '../schema';

/**
 * Dummy implementation for creating a new category.
 * In a real implementation this would INSERT into the DB and return the created record.
 */
export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  return {
    id: 0, // placeholder ID
    name: input.name,
    description: input.description ?? null,
  } as Category;
};

/**
 * Dummy implementation for fetching all categories.
 */
export const getCategories = async (): Promise<Category[]> => {
  return [];
};

/**
 * Dummy stub for updating a category.
 */
export const updateCategory = async (input: UpdateCategoryInput): Promise<Category> => {
  return {
    id: input.id,
    name: input.name ?? 'Updated Name',
    description: input.description ?? null,
  } as Category;
};
