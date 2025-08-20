import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type GetProductByIdInput, type ProductWithTransactions } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductWithTransactions(input: GetProductByIdInput): Promise<ProductWithTransactions | null> {
  try {
    // First, get the product
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (products.length === 0) {
      return null;
    }

    const product = products[0];

    // Get all transactions for this product
    const transactions = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, input.id))
      .execute();

    // Return the product with its transactions
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      stock_level: product.stock_level,
      created_at: product.created_at,
      updated_at: product.updated_at,
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        product_id: transaction.product_id,
        transaction_type: transaction.transaction_type,
        quantity: transaction.quantity,
        notes: transaction.notes,
        created_at: transaction.created_at
      }))
    };
  } catch (error) {
    console.error('Failed to get product with transactions:', error);
    throw error;
  }
}
