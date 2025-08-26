import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type UpdateSupplierInput, type Supplier } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSupplier = async (input: UpdateSupplierInput): Promise<Supplier | null> => {
  try {
    // Build the update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.contact !== undefined) updateData.contact = input.contact;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.address !== undefined) updateData.address = input.address;

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update supplier record
    const result = await db.update(suppliersTable)
      .set(updateData)
      .where(eq(suppliersTable.id, input.id))
      .returning()
      .execute();

    // Return null if no supplier was found/updated
    if (result.length === 0) {
      return null;
    }

    // Return the updated supplier
    return result[0];
  } catch (error) {
    console.error('Supplier update failed:', error);
    throw error;
  }
};
