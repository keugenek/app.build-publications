import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCustomer = async (input: UpdateCustomerInput): Promise<Customer | null> => {
  try {
    // Update customer record
    const result = await db.update(customersTable)
      .set({
        name: input.name,
        contact: input.contact,
        email: input.email,
        phone: input.phone,
        address: input.address
      })
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    // Return null if no customer was found to update
    if (result.length === 0) {
      return null;
    }

    // Return the updated customer
    return result[0];
  } catch (error) {
    console.error('Customer update failed:', error);
    throw error;
  }
};
