import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { deleteSupplier } from '../handlers/delete_supplier';
import { eq } from 'drizzle-orm';

describe('deleteSupplier', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing supplier', async () => {
    // First create a supplier to delete
    const newSupplier = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact: 'Test Contact',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: '123 Test Street'
      })
      .returning()
      .execute();
    
    const supplierId = newSupplier[0].id;
    
    // Delete the supplier
    const result = await deleteSupplier(supplierId);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify supplier no longer exists in database
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, supplierId))
      .execute();
    
    expect(suppliers).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent supplier', async () => {
    // Try to delete a supplier that doesn't exist
    const result = await deleteSupplier(99999);
    
    // Should return false since no supplier was deleted
    expect(result).toBe(false);
  });

  it('should properly handle database errors', async () => {
    // Test with an invalid ID type (though TypeScript will prevent this at compile time)
    await expect(deleteSupplier(NaN)).rejects.toThrow();
  });
});
