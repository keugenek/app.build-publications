import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { deleteCustomer } from '../handlers/delete_customer';
import { eq } from 'drizzle-orm';

describe('deleteCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing customer', async () => {
    // First create a customer directly in the database
    const [customer] = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        contact: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St'
      })
      .returning()
      .execute();

    // Delete the customer
    const result = await deleteCustomer(customer.id);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify customer no longer exists in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id))
      .execute();

    expect(customers).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent customer', async () => {
    // Try to delete a customer that doesn't exist
    const result = await deleteCustomer(99999);

    // Should return false since no customer was deleted
    expect(result).toBe(false);
  });

  it('should only delete the specified customer', async () => {
    // Create multiple customers directly in the database
    const [customer1] = await db.insert(customersTable)
      .values({
        name: 'Customer 1',
        contact: 'Contact 1',
        email: 'customer1@example.com',
        phone: '111-111-1111',
        address: 'Address 1'
      })
      .returning()
      .execute();

    const [customer2] = await db.insert(customersTable)
      .values({
        name: 'Customer 2',
        contact: 'Contact 2',
        email: 'customer2@example.com',
        phone: '222-222-2222',
        address: 'Address 2'
      })
      .returning()
      .execute();

    // Delete only the first customer
    const result = await deleteCustomer(customer1.id);
    expect(result).toBe(true);

    // Verify customer1 is deleted
    const customers1 = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customer1.id))
      .execute();
    expect(customers1).toHaveLength(0);

    // Verify customer2 still exists
    const customers2 = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customer2.id))
      .execute();
    expect(customers2).toHaveLength(1);
    expect(customers2[0].name).toBe('Customer 2');
  });
});
