import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category successfully', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF5733'
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Delete the category
    const result = await deleteCategory(categoryId);

    expect(result.success).toBe(true);

    // Verify the category was deleted
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(deletedCategory).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteCategory(nonExistentId))
      .rejects
      .toThrow(/Category with id 999 not found/i);
  });

  it('should prevent deletion when category has related transactions', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Category with Transactions',
        color: '#FF5733'
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Create a transaction using this category
    await db.insert(transactionsTable)
      .values({
        amount: '100.00',
        description: 'Test transaction',
        type: 'expense',
        category_id: categoryId,
        transaction_date: new Date()
      })
      .execute();

    // Try to delete the category
    await expect(deleteCategory(categoryId))
      .rejects
      .toThrow(/Cannot delete category with existing transactions. Found 1 related transactions./i);

    // Verify the category still exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(existingCategory).toHaveLength(1);
  });

  it('should prevent deletion when category has related budgets', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Category with Budgets',
        color: '#33FF57'
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Create a budget using this category
    await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        monthly_limit: '500.00',
        month: 12,
        year: 2024
      })
      .execute();

    // Try to delete the category
    await expect(deleteCategory(categoryId))
      .rejects
      .toThrow(/Cannot delete category with existing budgets. Found 1 related budgets./i);

    // Verify the category still exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(existingCategory).toHaveLength(1);
  });

  it('should prevent deletion when category has both transactions and budgets', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Category with Everything',
        color: '#5733FF'
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Create a transaction using this category
    await db.insert(transactionsTable)
      .values({
        amount: '75.50',
        description: 'Test transaction',
        type: 'income',
        category_id: categoryId,
        transaction_date: new Date()
      })
      .execute();

    // Create a budget using this category
    await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        monthly_limit: '300.00',
        month: 6,
        year: 2024
      })
      .execute();

    // Try to delete the category - should fail on transactions check first
    await expect(deleteCategory(categoryId))
      .rejects
      .toThrow(/Cannot delete category with existing transactions/i);

    // Verify the category still exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(existingCategory).toHaveLength(1);
  });

  it('should handle multiple related transactions correctly', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Category with Multiple Transactions',
        color: '#FF33A1'
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Create multiple transactions using this category
    await db.insert(transactionsTable)
      .values([
        {
          amount: '50.00',
          description: 'Transaction 1',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date()
        },
        {
          amount: '75.00',
          description: 'Transaction 2',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date()
        },
        {
          amount: '25.50',
          description: 'Transaction 3',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date()
        }
      ])
      .execute();

    // Try to delete the category
    await expect(deleteCategory(categoryId))
      .rejects
      .toThrow(/Cannot delete category with existing transactions. Found 3 related transactions./i);

    // Verify the category still exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(existingCategory).toHaveLength(1);
  });
});
