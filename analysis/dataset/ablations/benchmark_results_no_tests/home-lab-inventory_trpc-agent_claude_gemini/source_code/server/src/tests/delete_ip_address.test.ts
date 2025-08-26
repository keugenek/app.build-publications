import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type IdInput, type CreateIpAddressInput } from '../schema';
import { deleteIpAddress } from '../handlers/delete_ip_address';
import { eq } from 'drizzle-orm';

// Test input data
const testHardwareAsset = {
  name: 'Test Server',
  type: 'server' as const,
  status: 'active' as const
};

const testSoftwareAsset = {
  name: 'Test VM',
  type: 'virtual_machine' as const,
  status: 'running' as const
};

const testIpAddressInput: CreateIpAddressInput = {
  ip_address: '192.168.1.100',
  subnet: '192.168.1.0/24',
  assignment_type: 'hardware',
  hardware_asset_id: null,
  software_asset_id: null,
  description: 'Test IP address',
  is_reserved: false
};

describe('deleteIpAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing IP address', async () => {
    // Create a test IP address
    const ipResult = await db.insert(ipAddressesTable)
      .values(testIpAddressInput)
      .returning()
      .execute();

    const ipAddress = ipResult[0];

    // Delete the IP address
    const result = await deleteIpAddress({ id: ipAddress.id });

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the IP address was deleted from database
    const remainingIps = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress.id))
      .execute();

    expect(remainingIps).toHaveLength(0);
  });

  it('should return false when IP address does not exist', async () => {
    const nonExistentId = 99999;

    // Try to delete non-existent IP address
    const result = await deleteIpAddress({ id: nonExistentId });

    // Should return false for non-existent record
    expect(result).toBe(false);
  });

  it('should delete IP address assigned to hardware asset', async () => {
    // Create a hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset)
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create IP address assigned to hardware
    const ipInput = {
      ...testIpAddressInput,
      hardware_asset_id: hardwareAsset.id,
      assignment_type: 'hardware' as const
    };

    const ipResult = await db.insert(ipAddressesTable)
      .values(ipInput)
      .returning()
      .execute();

    const ipAddress = ipResult[0];

    // Delete the IP address
    const result = await deleteIpAddress({ id: ipAddress.id });

    expect(result).toBe(true);

    // Verify deletion
    const remainingIps = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress.id))
      .execute();

    expect(remainingIps).toHaveLength(0);

    // Verify hardware asset still exists (cascade shouldn't delete it)
    const hardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAsset.id))
      .execute();

    expect(hardwareAssets).toHaveLength(1);
  });

  it('should delete IP address assigned to software asset', async () => {
    // Create a hardware asset first (for hosting the software)
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset)
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create a software asset
    const softwareInput = {
      ...testSoftwareAsset,
      host_hardware_id: hardwareAsset.id
    };

    const softwareResult = await db.insert(softwareAssetsTable)
      .values(softwareInput)
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Create IP address assigned to software
    const ipInput = {
      ...testIpAddressInput,
      software_asset_id: softwareAsset.id,
      assignment_type: 'software' as const,
      ip_address: '192.168.1.101'
    };

    const ipResult = await db.insert(ipAddressesTable)
      .values(ipInput)
      .returning()
      .execute();

    const ipAddress = ipResult[0];

    // Delete the IP address
    const result = await deleteIpAddress({ id: ipAddress.id });

    expect(result).toBe(true);

    // Verify deletion
    const remainingIps = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress.id))
      .execute();

    expect(remainingIps).toHaveLength(0);

    // Verify software asset still exists
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(softwareAssets).toHaveLength(1);
  });

  it('should delete reserved IP address', async () => {
    // Create a reserved IP address
    const reservedIpInput = {
      ...testIpAddressInput,
      ip_address: '192.168.1.1',
      is_reserved: true,
      description: 'Gateway IP - Reserved'
    };

    const ipResult = await db.insert(ipAddressesTable)
      .values(reservedIpInput)
      .returning()
      .execute();

    const ipAddress = ipResult[0];

    // Delete the reserved IP address
    const result = await deleteIpAddress({ id: ipAddress.id });

    expect(result).toBe(true);

    // Verify deletion
    const remainingIps = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress.id))
      .execute();

    expect(remainingIps).toHaveLength(0);
  });

  it('should handle multiple deletions correctly', async () => {
    // Create multiple IP addresses
    const ip1Result = await db.insert(ipAddressesTable)
      .values({ ...testIpAddressInput, ip_address: '192.168.1.10' })
      .returning()
      .execute();

    const ip2Result = await db.insert(ipAddressesTable)
      .values({ ...testIpAddressInput, ip_address: '192.168.1.11' })
      .returning()
      .execute();

    const ip1 = ip1Result[0];
    const ip2 = ip2Result[0];

    // Delete first IP
    const result1 = await deleteIpAddress({ id: ip1.id });
    expect(result1).toBe(true);

    // Delete second IP
    const result2 = await deleteIpAddress({ id: ip2.id });
    expect(result2).toBe(true);

    // Try to delete first IP again (should return false)
    const result3 = await deleteIpAddress({ id: ip1.id });
    expect(result3).toBe(false);

    // Verify both IPs are deleted
    const remainingIps = await db.select()
      .from(ipAddressesTable)
      .execute();

    expect(remainingIps).toHaveLength(0);
  });
});
