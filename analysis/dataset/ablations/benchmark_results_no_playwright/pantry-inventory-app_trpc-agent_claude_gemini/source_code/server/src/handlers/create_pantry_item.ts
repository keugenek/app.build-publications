import { db } from '../db';
import { pantryItemsTable, notificationsTable } from '../db/schema';
import { type CreatePantryItemInput, type PantryItem } from '../schema';

export const createPantryItem = async (input: CreatePantryItemInput): Promise<PantryItem> => {
  try {
    // Insert pantry item record
    const result = await db.insert(pantryItemsTable)
      .values({
        name: input.name,
        quantity: input.quantity.toString(), // Convert number to string for numeric column
        unit: input.unit,
        expiry_date: input.expiry_date
      })
      .returning()
      .execute();

    const pantryItem = result[0];

    // Check if item is expiring soon (within 7 days) or already expired
    const now = new Date();
    const expiryDate = new Date(pantryItem.expiry_date);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Create notifications for expiring or expired items
    if (daysUntilExpiry <= 0) {
      // Item is already expired
      await db.insert(notificationsTable)
        .values({
          pantry_item_id: pantryItem.id,
          message: `${pantryItem.name} has expired`,
          notification_type: 'expired'
        })
        .execute();
    } else if (daysUntilExpiry <= 7) {
      // Item is expiring within 7 days
      await db.insert(notificationsTable)
        .values({
          pantry_item_id: pantryItem.id,
          message: `${pantryItem.name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
          notification_type: 'expiring_soon'
        })
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...pantryItem,
      quantity: parseFloat(pantryItem.quantity), // Convert string back to number
      // Add computed fields for convenience
      is_expired: daysUntilExpiry <= 0,
      days_until_expiry: daysUntilExpiry
    };
  } catch (error) {
    console.error('Pantry item creation failed:', error);
    throw error;
  }
};
