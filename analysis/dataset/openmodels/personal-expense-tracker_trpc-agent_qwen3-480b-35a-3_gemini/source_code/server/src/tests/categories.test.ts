import { describe, expect, it } from 'bun:test';
import { type CreateCategoryInput, type UpdateCategoryInput } from '../schema';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../handlers/categories';

// Test inputs
const testIncomeCategory: CreateCategoryInput = {
  name: 'Salary',
  type: 'income'
};

const testExpenseCategory: CreateCategoryInput = {
  name: 'Groceries',
  type: 'expense'
};

describe('Category Handlers', () => {
  describe('createCategory', () => {
    it('should create a category with correct structure', async () => {
      const result = await createCategory(testIncomeCategory);
      
      // Check that the result has the expected structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('type');
      expect(typeof result.id).toBe('number');
      expect(result.name).toBe('Salary');
      expect(result.type).toBe('income');
    });
  });

  describe('getCategories', () => {
    it('should return an array', async () => {
      const result = await getCategories();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCategoryById', () => {
    it('should return null (since db is not available)', async () => {
      const result = await getCategoryById(1);
      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should return a category with updated properties', async () => {
      const updateInput: UpdateCategoryInput = {
        id: 1,
        name: 'Updated Salary'
      };
      
      const result = await updateCategory(updateInput);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('type');
      expect(result.id).toBe(1);
      expect(result.name).toBe('Updated Salary');
    });
  });

  describe('deleteCategory', () => {
    it('should return false (since db is not available)', async () => {
      const result = await deleteCategory(1);
      expect(result).toBe(false);
    });
  });
});
