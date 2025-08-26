import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type UpdateItemInput, type Item } from '../schema';
import { eq } from 'drizzle-orm';

export const updateItem = async (input: UpdateItemInput): Promise<Item> => {
  try {
    // Check if item exists
    const existingItem = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Item with id ${input.id} not found`);
    }

    // Build update data object with only provided fields
    const updateData: Partial<typeof itemsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.code !== undefined) {
      updateData.code = input.code;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.stock !== undefined) {
      updateData.stock = input.stock;
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date();

    // Update item record
    const result = await db.update(itemsTable)
      .set(updateData)
      .where(eq(itemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update item with id ${input.id}`);
    }

    const updatedItem = result[0];
    
    // Convert to the expected schema type
    return {
      id: updatedItem.id,
      name: updatedItem.name,
      code: updatedItem.code,
      description: updatedItem.description ?? null,
      stock: updatedItem.stock,
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at
    };
  } catch (error) {
    console.error('Item update failed:', error);
    throw error;
  }
};
