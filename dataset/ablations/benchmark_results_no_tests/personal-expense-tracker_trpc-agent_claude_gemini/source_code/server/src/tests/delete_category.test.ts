import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing category', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Delete the category
    const result = await deleteCategory(categoryId);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the category is actually deleted from the database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should cascade delete related transactions', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a related transaction
    await db.insert(transactionsTable)
      .values({
        amount: '100.50',
        date: new Date(),
        description: 'Test transaction',
        type: 'expense',
        category_id: categoryId
      })
      .execute();

    // Verify transaction exists before deletion
    const transactionsBefore = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.category_id, categoryId))
      .execute();

    expect(transactionsBefore).toHaveLength(1);

    // Delete the category
    const result = await deleteCategory(categoryId);

    expect(result.success).toBe(true);

    // Verify the related transaction is also deleted (cascade delete)
    const transactionsAfter = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.category_id, categoryId))
      .execute();

    expect(transactionsAfter).toHaveLength(0);
  });

  it('should cascade delete related budgets', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a related budget
    await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        amount: '500.00',
        month: 12,
        year: 2024
      })
      .execute();

    // Verify budget exists before deletion
    const budgetsBefore = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, categoryId))
      .execute();

    expect(budgetsBefore).toHaveLength(1);

    // Delete the category
    const result = await deleteCategory(categoryId);

    expect(result.success).toBe(true);

    // Verify the related budget is also deleted (cascade delete)
    const budgetsAfter = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, categoryId))
      .execute();

    expect(budgetsAfter).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    const nonExistentId = 99999;

    // Attempt to delete non-existent category
    await expect(deleteCategory(nonExistentId))
      .rejects
      .toThrow(/category with id 99999 not found/i);
  });

  it('should cascade delete both transactions and budgets', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create multiple related records
    await db.insert(transactionsTable)
      .values([
        {
          amount: '100.50',
          date: new Date(),
          description: 'Test transaction 1',
          type: 'expense',
          category_id: categoryId
        },
        {
          amount: '75.25',
          date: new Date(),
          description: 'Test transaction 2',
          type: 'income',
          category_id: categoryId
        }
      ])
      .execute();

    await db.insert(budgetsTable)
      .values([
        {
          category_id: categoryId,
          amount: '500.00',
          month: 12,
          year: 2024
        },
        {
          category_id: categoryId,
          amount: '600.00',
          month: 11,
          year: 2024
        }
      ])
      .execute();

    // Verify related records exist before deletion
    const transactionsBefore = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.category_id, categoryId))
      .execute();

    const budgetsBefore = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, categoryId))
      .execute();

    expect(transactionsBefore).toHaveLength(2);
    expect(budgetsBefore).toHaveLength(2);

    // Delete the category
    const result = await deleteCategory(categoryId);

    expect(result.success).toBe(true);

    // Verify all related records are deleted
    const transactionsAfter = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.category_id, categoryId))
      .execute();

    const budgetsAfter = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, categoryId))
      .execute();

    expect(transactionsAfter).toHaveLength(0);
    expect(budgetsAfter).toHaveLength(0);

    // Verify the category itself is deleted
    const categoriesAfter = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categoriesAfter).toHaveLength(0);
  });
});
