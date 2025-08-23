import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput, type UpdateSupplierInput } from '../schema';
import { updateSupplier } from '../handlers/update_supplier';
import { eq } from 'drizzle-orm';

// Test data for creating a supplier
const createSupplierInput: CreateSupplierInput = {
  name: 'Test Supplier',
  contact: 'John Doe',
  email: 'john@test.com',
  phone: '123-456-7890',
  address: '123 Test Street'
};

// Helper function to create a supplier for testing
const createTestSupplier = async () => {
  const result = await db.insert(suppliersTable)
    .values(createSupplierInput)
    .returning()
    .execute();
  return result[0];
};

describe('updateSupplier', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a supplier with all fields', async () => {
    // Create a supplier first
    const supplier = await createTestSupplier();
    
    // Update all fields
    const updateInput: UpdateSupplierInput = {
      id: supplier.id,
      name: 'Updated Supplier',
      contact: 'Jane Doe',
      email: 'jane@test.com',
      phone: '098-765-4321',
      address: '456 Updated Street'
    };
    
    const result = await updateSupplier(updateInput);
    
    // Basic field validation
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(supplier.id);
    expect(result!.name).toEqual('Updated Supplier');
    expect(result!.contact).toEqual('Jane Doe');
    expect(result!.email).toEqual('jane@test.com');
    expect(result!.phone).toEqual('098-765-4321');
    expect(result!.address).toEqual('456 Updated Street');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update a supplier with partial fields', async () => {
    // Create a supplier first
    const supplier = await createTestSupplier();
    
    // Update only name and phone
    const updateInput: UpdateSupplierInput = {
      id: supplier.id,
      name: 'Partially Updated Supplier',
      phone: '555-555-5555'
    };
    
    const result = await updateSupplier(updateInput);
    
    // Check updated fields
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(supplier.id);
    expect(result!.name).toEqual('Partially Updated Supplier');
    expect(result!.phone).toEqual('555-555-5555');
    
    // Check that other fields remain unchanged
    expect(result!.contact).toEqual(supplier.contact);
    expect(result!.email).toEqual(supplier.email);
    expect(result!.address).toEqual(supplier.address);
  });

  it('should save updated supplier to database', async () => {
    // Create a supplier first
    const supplier = await createTestSupplier();
    
    // Update the supplier
    const updateInput: UpdateSupplierInput = {
      id: supplier.id,
      name: 'Database Updated Supplier',
      email: 'dbupdated@test.com'
    };
    
    await updateSupplier(updateInput);
    
    // Query the database to verify the update was saved
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, supplier.id))
      .execute();
    
    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toEqual('Database Updated Supplier');
    expect(suppliers[0].email).toEqual('dbupdated@test.com');
    expect(suppliers[0].contact).toEqual(supplier.contact);
  });

  it('should return null when supplier is not found', async () => {
    // Try to update a non-existent supplier
    const updateInput: UpdateSupplierInput = {
      id: 99999,
      name: 'Non-existent Supplier'
    };
    
    const result = await updateSupplier(updateInput);
    expect(result).toBeNull();
  });

  it('should return null when no fields are provided to update', async () => {
    // Create a supplier first
    const supplier = await createTestSupplier();
    
    // Try to update with no fields
    const updateInput: UpdateSupplierInput = {
      id: supplier.id
      // No other fields provided
    };
    
    const result = await updateSupplier(updateInput);
    expect(result).toBeNull();
  });
});
