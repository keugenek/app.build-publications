import { db } from '../db';
import { productsTable, stockMovementsTable } from '../db/schema';
import { type CreateStockMovementInput, type StockMovement } from '../schema';
import { eq } from 'drizzle-orm';

export const createStockMovement = async (input: CreateStockMovementInput): Promise<StockMovement> => {
  try {
    return await db.transaction(async (tx) => {
      // 1. Validate that the product exists and get current stock level
      const product = await tx.select()
        .from(productsTable)
        .where(eq(productsTable.id, input.product_id))
        .execute();

      if (product.length === 0) {
        throw new Error(`Product with ID ${input.product_id} not found`);
      }

      const currentStock = product[0].stock_level;

      // 2. For 'stock-out' movements, ensure sufficient stock is available
      if (input.movement_type === 'stock-out' && currentStock < input.quantity) {
        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${input.quantity}`);
      }

      // 3. Calculate new stock level based on movement type
      const newStockLevel = input.movement_type === 'stock-in' 
        ? currentStock + input.quantity 
        : currentStock - input.quantity;

      // 4. Update the product's stock_level
      await tx.update(productsTable)
        .set({ 
          stock_level: newStockLevel,
          updated_at: new Date()
        })
        .where(eq(productsTable.id, input.product_id))
        .execute();

      // 5. Create the stock movement record
      const result = await tx.insert(stockMovementsTable)
        .values({
          product_id: input.product_id,
          movement_type: input.movement_type,
          quantity: input.quantity,
          notes: input.notes || null
        })
        .returning()
        .execute();

      return result[0];
    });
  } catch (error) {
    console.error('Stock movement creation failed:', error);
    throw error;
  }
};
