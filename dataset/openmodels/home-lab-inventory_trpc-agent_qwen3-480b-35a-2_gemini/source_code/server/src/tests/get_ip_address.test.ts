import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, ipAddressesTable } from '../db/schema';
import { getIpAddress } from '../handlers/get_ip_address';
import { eq } from 'drizzle-orm';

describe('getIpAddress', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset first (needed for foreign key constraint)
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        description: 'A test server'
      })
      .returning()
      .execute();
    
    const hardwareAsset = hardwareResult[0];
    
    // Create an IP address for testing
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        status: 'allocated',
        hardware_asset_id: hardwareAsset.id
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch an existing IP address by ID', async () => {
    // Get the IP address we created
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.ip_address, '192.168.1.100'))
      .execute();
    
    const testIpAddress = ipAddresses[0];
    const result = await getIpAddress(testIpAddress.id);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testIpAddress.id);
    expect(result?.ip_address).toEqual('192.168.1.100');
    expect(result?.status).toEqual('allocated');
    expect(result?.hardware_asset_id).toEqual(testIpAddress.hardware_asset_id);
    expect(result?.software_asset_id).toBeNull();
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent IP address', async () => {
    const result = await getIpAddress(99999);
    expect(result).toBeNull();
  });
});
