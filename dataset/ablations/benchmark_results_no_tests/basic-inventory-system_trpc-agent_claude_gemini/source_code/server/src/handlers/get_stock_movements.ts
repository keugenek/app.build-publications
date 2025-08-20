import { db } from '../db';
import { stockMovementsTable, productsTable } from '../db/schema';
import { type StockMovementWithProduct } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getStockMovements = async (): Promise<StockMovementWithProduct[]> => {
  try {
    // Query stock movements with associated product details
    const results = await db.select()
      .from(stockMovementsTable)
      .innerJoin(productsTable, eq(stockMovementsTable.product_id, productsTable.id))
      .orderBy(desc(stockMovementsTable.created_at))
      .execute();

    // Transform the joined result structure to match the expected schema
    return results.map(result => ({
      id: result.stock_movements.id,
      product_id: result.stock_movements.product_id,
      movement_type: result.stock_movements.movement_type,
      quantity: result.stock_movements.quantity,
      notes: result.stock_movements.notes,
      created_at: result.stock_movements.created_at,
      product: {
        id: result.products.id,
        name: result.products.name,
        sku: result.products.sku,
        stock_level: result.products.stock_level,
        created_at: result.products.created_at,
        updated_at: result.products.updated_at
      }
    }));
  } catch (error) {
    console.error('Failed to fetch stock movements:', error);
    throw error;
  }
};
