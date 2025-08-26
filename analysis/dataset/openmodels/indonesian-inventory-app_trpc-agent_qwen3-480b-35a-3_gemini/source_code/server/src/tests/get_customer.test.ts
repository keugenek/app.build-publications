import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { getCustomer } from '../handlers/get_customer';
import { eq } from 'drizzle-orm';

describe('getCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch an existing customer by ID', async () => {
    // First create a test customer
    const testCustomer = {
      name: 'Test Customer',
      contact: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address: '123 Main St'
    };

    const inserted = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const customerId = inserted[0].id;

    // Test the handler
    const result = await getCustomer(customerId);

    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: customerId,
      name: 'Test Customer',
      contact: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      created_at: expect.any(Date)
    });
  });

  it('should return null for a non-existent customer', async () => {
    const result = await getCustomer(99999);
    expect(result).toBeNull();
  });

  it('should handle customer with nullable fields', async () => {
    // Create a customer with some nullable fields
    const testCustomer = {
      name: 'Minimal Customer',
      contact: null,
      email: null,
      phone: null,
      address: null
    };

    const inserted = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const customerId = inserted[0].id;

    // Test the handler
    const result = await getCustomer(customerId);

    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: customerId,
      name: 'Minimal Customer',
      contact: null,
      email: null,
      phone: null,
      address: null,
      created_at: expect.any(Date)
    });
  });

  it('should preserve customer creation timestamp', async () => {
    // Create a customer
    const testCustomer = {
      name: 'Timestamp Customer',
      contact: 'Jane Doe',
      email: 'jane@example.com',
      phone: '987-654-3210',
      address: '456 Oak Ave'
    };

    const inserted = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const customerId = inserted[0].id;
    const createdAt = inserted[0].created_at;

    // Test the handler
    const result = await getCustomer(customerId);

    expect(result).not.toBeNull();
    expect(result!.created_at).toEqual(createdAt);
    expect(result!.created_at).toBeInstanceOf(Date);
  });
});
