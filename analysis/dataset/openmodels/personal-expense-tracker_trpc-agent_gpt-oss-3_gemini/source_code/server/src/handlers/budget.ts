import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateBudgetInput, type UpdateBudgetInput, type Budget } from '../schema';
import { type NewBudget } from '../db/schema';

/** Create a new budget entry */
export const createBudget = async (input: CreateBudgetInput): Promise<Budget> => {
  try {
    const result = await db
      .insert(budgetsTable)
      .values({
        category_id: input.category_id,
        amount: input.amount.toString(), // numeric column stores as string
      })
      .returning()
      .execute();

    const row = result[0];
    return {
      ...row,
      amount: parseFloat(row.amount), // convert back to number
    } as Budget;
  } catch (error) {
    console.error('Failed to create budget:', error);
    throw error;
  }
};

/** Retrieve all budgets */
export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const rows = await db.select().from(budgetsTable).execute();
    return rows.map((row) => ({
      ...row,
      amount: parseFloat(row.amount),
    })) as Budget[];
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    throw error;
  }
};

/** Update an existing budget */
export const updateBudget = async (input: UpdateBudgetInput): Promise<Budget> => {
  try {
    // Build set object conditionally
    const setObj: Partial<NewBudget> = {};
    if (input.category_id !== undefined) setObj.category_id = input.category_id;
    if (input.amount !== undefined) setObj.amount = input.amount.toString(); // numeric column expects string

    const result = await db
      .update(budgetsTable)
      .set(setObj)
      .where(eq(budgetsTable.id, input.id))
      .returning()
      .execute();

    const row = result[0];
    return {
      ...row,
      amount: parseFloat(row.amount),
    } as Budget;
  } catch (error) {
    console.error('Failed to update budget:', error);
    throw error;
  }
};
