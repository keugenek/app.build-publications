import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteIpAddress } from '../handlers/delete_ip_address';

describe('deleteIpAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an IP address by ID', async () => {
    // First create a hardware asset to reference
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        description: 'A test server'
      })
      .returning()
      .execute();
    
    const hardwareAsset = hardwareResult[0];

    // Create an IP address to delete
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        status: 'allocated',
        hardware_asset_id: hardwareAsset.id
      })
      .returning()
      .execute();
    
    const ipAddress = ipResult[0];
    
    // Delete the IP address
    const result = await deleteIpAddress(ipAddress.id);
    
    // Verify the deletion was successful
    expect(result).toBe(true);
    
    // Verify the IP address no longer exists in the database
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress.id))
      .execute();
    
    expect(ipAddresses).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent IP address', async () => {
    // Try to delete an IP address that doesn't exist
    const result = await deleteIpAddress(99999);
    
    // Should return false since no record was deleted
    expect(result).toBe(false);
  });
});
