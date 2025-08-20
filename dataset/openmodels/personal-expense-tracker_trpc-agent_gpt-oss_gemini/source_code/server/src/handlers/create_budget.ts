import { type CreateBudgetInput, type Budget } from '../schema';
import { db } from '../db';
import { budgetsTable } from '../db/schema';


/**
 * Creates a new budget record in the database.
 * Numeric fields are stored as strings in PostgreSQL numeric columns,
 * so we convert numbers to strings on insert and back to numbers on return.
 */
export const createBudget = async (input: CreateBudgetInput): Promise<Budget> => {
  const result = await db
    .insert(budgetsTable)
    .values({
      category_id: input.category_id,
      amount: input.amount.toString(), // numeric stored as string
      month: input.month,
      year: input.year,
    })
    .returning()
    .execute();

  const row = result[0];
  return {
    ...row,
    amount: parseFloat(row.amount), // convert back to number
  } as Budget;
};

/**
 * Retrieves all budgets from the database, applying numeric conversion.
 */
export const getBudgets = async (): Promise<Budget[]> => {
  const rows = await db.select().from(budgetsTable).execute();
  return rows.map(row => ({
    ...row,
    amount: parseFloat(row.amount),
  } as Budget));
};
