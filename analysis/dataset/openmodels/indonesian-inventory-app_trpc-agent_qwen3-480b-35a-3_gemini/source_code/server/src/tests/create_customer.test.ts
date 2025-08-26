import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateCustomerInput = {
  name: 'Test Customer',
  contact: 'John Doe',
  email: 'john@test.com',
  phone: '123-456-7890',
  address: '123 Test Street'
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Customer');
    expect(result.contact).toEqual('John Doe');
    expect(result.email).toEqual('john@test.com');
    expect(result.phone).toEqual('123-456-7890');
    expect(result.address).toEqual('123 Test Street');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Test Customer');
    expect(customers[0].contact).toEqual('John Doe');
    expect(customers[0].email).toEqual('john@test.com');
    expect(customers[0].phone).toEqual('123-456-7890');
    expect(customers[0].address).toEqual('123 Test Street');
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const inputWithNulls: CreateCustomerInput = {
      name: 'Null Customer',
      contact: null,
      email: null,
      phone: null,
      address: null
    };

    const result = await createCustomer(inputWithNulls);

    expect(result.name).toEqual('Null Customer');
    expect(result.contact).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
