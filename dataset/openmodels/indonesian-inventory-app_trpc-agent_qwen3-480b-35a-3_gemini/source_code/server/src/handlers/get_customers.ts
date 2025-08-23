import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const results = await db.select().from(customersTable).execute();
    
    // Convert numeric fields back to numbers (though customers table has none)
    return results.map(customer => ({
      ...customer,
      created_at: customer.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
};
