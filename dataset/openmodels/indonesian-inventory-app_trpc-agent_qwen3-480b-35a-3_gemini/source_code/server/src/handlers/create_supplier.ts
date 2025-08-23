import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput, type Supplier } from '../schema';

export const createSupplier = async (input: CreateSupplierInput): Promise<Supplier> => {
  try {
    // Insert supplier record
    const result = await db.insert(suppliersTable)
      .values({
        name: input.name,
        contact: input.contact,
        email: input.email,
        phone: input.phone,
        address: input.address
      })
      .returning()
      .execute();

    // Return the created supplier
    return result[0];
  } catch (error) {
    console.error('Supplier creation failed:', error);
    throw error;
  }
};
