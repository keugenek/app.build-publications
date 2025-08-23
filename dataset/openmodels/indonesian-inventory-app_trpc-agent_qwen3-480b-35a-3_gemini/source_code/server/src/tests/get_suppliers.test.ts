import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { getSuppliers } from '../handlers/get_suppliers';

describe('getSuppliers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no suppliers exist', async () => {
    const result = await getSuppliers();
    expect(result).toEqual([]);
  });

  it('should return all suppliers when they exist', async () => {
    // Insert test suppliers
    const testSuppliers = [
      {
        name: 'ABC Supply Co.',
        contact: 'John Smith',
        email: 'john@abcsupply.com',
        phone: '123-456-7890',
        address: '123 Main St, City, State 12345'
      },
      {
        name: 'XYZ Distributors',
        contact: 'Jane Doe',
        email: 'jane@xyzdistributors.com',
        phone: '098-765-4321',
        address: '456 Oak Ave, Town, State 67890'
      }
    ];

    const insertedSuppliers = await db.insert(suppliersTable)
      .values(testSuppliers)
      .returning()
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(2);
    
    // Validate the structure and data of returned suppliers
    const sortedResult = result.sort((a, b) => a.id - b.id);
    const sortedInserted = insertedSuppliers.sort((a, b) => a.id - b.id);
    
    for (let i = 0; i < result.length; i++) {
      expect(sortedResult[i].id).toEqual(sortedInserted[i].id);
      expect(sortedResult[i].name).toEqual(sortedInserted[i].name);
      expect(sortedResult[i].contact).toEqual(sortedInserted[i].contact);
      expect(sortedResult[i].email).toEqual(sortedInserted[i].email);
      expect(sortedResult[i].phone).toEqual(sortedInserted[i].phone);
      expect(sortedResult[i].address).toEqual(sortedInserted[i].address);
      expect(sortedResult[i].created_at).toBeInstanceOf(Date);
    }
  });

  it('should handle suppliers with null fields correctly', async () => {
    // Insert supplier with null optional fields
    const testSupplier = {
      name: 'Minimal Supplier',
      contact: null,
      email: null,
      phone: null,
      address: null
    };

    await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Supplier');
    expect(result[0].contact).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
