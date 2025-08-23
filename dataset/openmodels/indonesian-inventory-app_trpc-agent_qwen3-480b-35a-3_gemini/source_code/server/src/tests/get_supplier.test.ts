import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { getSupplier } from '../handlers/get_supplier';

describe('getSupplier', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a test supplier
    await db.insert(suppliersTable).values({
      name: 'Test Supplier',
      contact: 'John Doe',
      email: 'john@test.com',
      phone: '123-456-7890',
      address: '123 Test St, Test City'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should retrieve an existing supplier by ID', async () => {
    // First, find the supplier we created
    const suppliers = await db.select().from(suppliersTable).execute();
    const testSupplier = suppliers[0];
    
    const result = await getSupplier(testSupplier.id);
    
    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: testSupplier.id,
      name: 'Test Supplier',
      contact: 'John Doe',
      email: 'john@test.com',
      phone: '123-456-7890',
      address: '123 Test St, Test City',
      created_at: expect.any(Date)
    });
  });

  it('should return null for non-existent supplier ID', async () => {
    const result = await getSupplier(99999);
    expect(result).toBeNull();
  });

  it('should handle supplier with nullable fields', async () => {
    // Insert a supplier with minimal information
    const result = await db.insert(suppliersTable).values({
      name: 'Minimal Supplier',
      contact: null,
      email: null,
      phone: null,
      address: null
    }).returning().execute();
    
    const supplierId = result[0].id;
    const retrievedSupplier = await getSupplier(supplierId);
    
    expect(retrievedSupplier).toEqual({
      id: supplierId,
      name: 'Minimal Supplier',
      contact: null,
      email: null,
      phone: null,
      address: null,
      created_at: expect.any(Date)
    });
  });
});
