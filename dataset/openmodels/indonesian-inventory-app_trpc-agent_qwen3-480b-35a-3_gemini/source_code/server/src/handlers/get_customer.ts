import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const getCustomer = async (id: number): Promise<Customer | null> => {
  try {
    const result = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const customer = result[0];
    return {
      id: customer.id,
      name: customer.name,
      contact: customer.contact,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      created_at: customer.created_at
    };
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    throw error;
  }
};
