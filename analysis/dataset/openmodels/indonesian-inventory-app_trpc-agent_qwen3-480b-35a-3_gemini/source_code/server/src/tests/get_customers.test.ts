import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';
import { getCustomers } from '../handlers/get_customers';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no customers exist', async () => {
    const result = await getCustomers();
    expect(result).toEqual([]);
  });

  it('should return all customers when they exist', async () => {
    // Insert test customers
    const testCustomers = [
      {
        name: 'John Doe',
        contact: 'John',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St'
      },
      {
        name: 'Jane Smith',
        contact: 'Jane',
        email: 'jane@example.com',
        phone: '0987654321',
        address: '456 Oak Ave'
      }
    ];

    // Insert customers into database
    await db.insert(customersTable).values(testCustomers).execute();

    // Fetch customers
    const result = await getCustomers();

    // Verify we got the correct number of customers
    expect(result).toHaveLength(2);

    // Verify the structure and data of each customer
    result.forEach((customer, index) => {
      expect(customer).toMatchObject({
        id: expect.any(Number),
        name: testCustomers[index].name,
        contact: testCustomers[index].contact,
        email: testCustomers[index].email,
        phone: testCustomers[index].phone,
        address: testCustomers[index].address,
        created_at: expect.any(Date)
      });
    });

    // Verify specific values for the first customer
    const firstCustomer = result[0];
    expect(firstCustomer.name).toBe('John Doe');
    expect(firstCustomer.email).toBe('john@example.com');
  });

  it('should handle customers with nullable fields', async () => {
    // Insert a customer with nullable fields set to null
    const customerWithNulls = {
      name: 'Null Customer',
      contact: null,
      email: null,
      phone: null,
      address: null
    };

    await db.insert(customersTable).values(customerWithNulls).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'Null Customer',
      contact: null,
      email: null,
      phone: null,
      address: null,
      created_at: expect.any(Date)
    });
  });
});
