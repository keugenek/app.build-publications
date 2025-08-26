import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an existing customer', async () => {
    // First create a customer to update using direct DB operation
    const [createdCustomer] = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        contact: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St'
      })
      .returning()
      .execute();
    
    // Update the customer
    const updateData: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Updated Customer',
      contact: 'Jane Smith',
      email: 'jane@example.com',
      phone: '098-765-4321',
      address: '456 Oak Avenue'
    };
    
    const result = await updateCustomer(updateData);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCustomer.id);
    expect(result!.name).toEqual('Updated Customer');
    expect(result!.contact).toEqual('Jane Smith');
    expect(result!.email).toEqual('jane@example.com');
    expect(result!.phone).toEqual('098-765-4321');
    expect(result!.address).toEqual('456 Oak Avenue');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should save updated customer to database', async () => {
    // First create a customer to update using direct DB operation
    const [createdCustomer] = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        contact: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St'
      })
      .returning()
      .execute();
    
    // Update the customer
    const updateData: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Database Updated Customer',
      contact: 'Bob Johnson',
      email: 'bob@example.com'
    };
    
    await updateCustomer(updateData);

    // Query the database to verify the update was saved
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, createdCustomer.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Database Updated Customer');
    expect(customers[0].contact).toEqual('Bob Johnson');
    expect(customers[0].email).toEqual('bob@example.com');
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should return null when trying to update a non-existent customer', async () => {
    // Try to update a customer that doesn't exist
    const updateData: UpdateCustomerInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Customer'
    };
    
    const result = await updateCustomer(updateData);
    
    expect(result).toBeNull();
  });

  it('should partially update a customer', async () => {
    // First create a customer to update using direct DB operation
    const [createdCustomer] = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        contact: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St'
      })
      .returning()
      .execute();
    
    // Only update specific fields
    const updateData: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Partially Updated Customer',
      phone: '555-123-4567'
      // Other fields should remain unchanged
    };
    
    const result = await updateCustomer(updateData);

    // Validate that only the specified fields were updated
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCustomer.id);
    expect(result!.name).toEqual('Partially Updated Customer');
    expect(result!.phone).toEqual('555-123-4567');
    // These should remain unchanged from the original
    expect(result!.contact).toEqual('John Doe');
    expect(result!.email).toEqual('john@example.com');
    expect(result!.address).toEqual('123 Main St');
  });
});
