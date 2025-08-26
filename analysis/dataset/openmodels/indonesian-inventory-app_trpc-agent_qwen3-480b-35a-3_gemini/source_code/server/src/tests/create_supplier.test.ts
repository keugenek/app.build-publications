import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput } from '../schema';
import { createSupplier } from '../handlers/create_supplier';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateSupplierInput = {
  name: 'Test Supplier',
  contact: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  address: '123 Main St'
};

describe('createSupplier', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a supplier', async () => {
    const result = await createSupplier(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Supplier');
    expect(result.contact).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.phone).toEqual('123-456-7890');
    expect(result.address).toEqual('123 Main St');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save supplier to database', async () => {
    const result = await createSupplier(testInput);

    // Query using proper drizzle syntax
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, result.id))
      .execute();

    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toEqual('Test Supplier');
    expect(suppliers[0].contact).toEqual('John Doe');
    expect(suppliers[0].email).toEqual('john@example.com');
    expect(suppliers[0].phone).toEqual('123-456-7890');
    expect(suppliers[0].address).toEqual('123 Main St');
    expect(suppliers[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const inputWithNulls: CreateSupplierInput = {
      name: 'Supplier with Nulls',
      contact: null,
      email: null,
      phone: null,
      address: null
    };

    const result = await createSupplier(inputWithNulls);

    expect(result.name).toEqual('Supplier with Nulls');
    expect(result.contact).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
