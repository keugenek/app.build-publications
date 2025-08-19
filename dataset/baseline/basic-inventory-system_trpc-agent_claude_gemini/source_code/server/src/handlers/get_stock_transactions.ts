import { db } from '../db';
import { stockTransactionsTable, productsTable } from '../db/schema';
import { type StockTransaction } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStockTransactions(): Promise<StockTransaction[]> {
  try {
    // Join stock transactions with products to include product information
    const results = await db.select({
      id: stockTransactionsTable.id,
      product_id: stockTransactionsTable.product_id,
      transaction_type: stockTransactionsTable.transaction_type,
      quantity: stockTransactionsTable.quantity,
      notes: stockTransactionsTable.notes,
      created_at: stockTransactionsTable.created_at,
      // Include product information
      product_name: productsTable.name,
      product_sku: productsTable.sku
    })
    .from(stockTransactionsTable)
    .innerJoin(productsTable, eq(stockTransactionsTable.product_id, productsTable.id))
    .execute();

    // Return stock transactions with basic fields (product info available but not in schema)
    return results.map(result => ({
      id: result.id,
      product_id: result.product_id,
      transaction_type: result.transaction_type,
      quantity: result.quantity,
      notes: result.notes,
      created_at: result.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch stock transactions:', error);
    throw error;
  }
}
