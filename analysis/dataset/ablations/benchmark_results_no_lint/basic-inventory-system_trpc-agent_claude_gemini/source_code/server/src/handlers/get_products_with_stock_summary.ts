import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type ProductWithStockSummary } from '../schema';
import { sql } from 'drizzle-orm';

export async function getProductsWithStockSummary(): Promise<ProductWithStockSummary[]> {
  try {
    // Query products with aggregated transaction data using LEFT JOIN and GROUP BY
    const results = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        sku: productsTable.sku,
        stock_level: productsTable.stock_level,
        created_at: productsTable.created_at,
        updated_at: productsTable.updated_at,
        total_stock_in: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'stock_in' THEN ${transactionsTable.quantity} ELSE 0 END), 0)`.as('total_stock_in'),
        total_stock_out: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'stock_out' THEN ${transactionsTable.quantity} ELSE 0 END), 0)`.as('total_stock_out')
      })
      .from(productsTable)
      .leftJoin(transactionsTable, sql`${productsTable.id} = ${transactionsTable.product_id}`)
      .groupBy(
        productsTable.id,
        productsTable.name,
        productsTable.sku,
        productsTable.stock_level,
        productsTable.created_at,
        productsTable.updated_at
      )
      .execute();

    // Convert string totals to numbers since SQL aggregations return strings
    return results.map(result => ({
      ...result,
      total_stock_in: parseInt(result.total_stock_in.toString()),
      total_stock_out: parseInt(result.total_stock_out.toString())
    }));
  } catch (error) {
    console.error('Failed to fetch products with stock summary:', error);
    throw error;
  }
}
