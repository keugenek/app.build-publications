import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type CreateItemInput, type Item } from '../schema';

export const createItem = async (input: CreateItemInput): Promise<Item> => {
  try {
    // Insert item record
    const result = await db.insert(itemsTable)
      .values({
        name: input.name,
        code: input.code,
        description: input.description,
        stock: input.stock
      })
      .returning()
      .execute();

    // Return the created item
    const item = result[0];
    return {
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    };
  } catch (error) {
    console.error('Item creation failed:', error);
    throw error;
  }
};
