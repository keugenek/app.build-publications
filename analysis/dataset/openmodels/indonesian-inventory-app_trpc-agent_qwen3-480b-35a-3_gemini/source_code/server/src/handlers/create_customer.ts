import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    // Insert customer record
    const result = await db.insert(customersTable)
      .values({
        name: input.name,
        contact: input.contact,
        email: input.email,
        phone: input.phone,
        address: input.address
      })
      .returning()
      .execute();

    const customer = result[0];
    return {
      ...customer,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      contact: customer.contact
    };
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};
