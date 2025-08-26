import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type UpdateIpAddressInput } from '../schema';
import { updateIpAddress } from '../handlers/update_ip_address';
import { eq } from 'drizzle-orm';

describe('updateIpAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testHardwareAssetId: number;
  let testSoftwareAssetId: number;
  let testIpAddressId: number;

  beforeEach(async () => {
    // Create test hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R740',
        description: 'Test hardware for IP address testing'
      })
      .returning()
      .execute();
    testHardwareAssetId = hardwareResult[0].id;

    // Create test software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'Test virtual machine',
        hardware_asset_id: testHardwareAssetId
      })
      .returning()
      .execute();
    testSoftwareAssetId = softwareResult[0].id;

    // Create test IP address
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: testHardwareAssetId,
        software_asset_id: null
      })
      .returning()
      .execute();
    testIpAddressId = ipResult[0].id;
  });

  it('should update IP address with all fields', async () => {
    const input: UpdateIpAddressInput = {
      id: testIpAddressId,
      ip_address: '10.0.0.50',
      subnet_mask: '255.255.0.0',
      hardware_asset_id: null,
      software_asset_id: testSoftwareAssetId
    };

    const result = await updateIpAddress(input);

    expect(result.id).toEqual(testIpAddressId);
    expect(result.ip_address).toEqual('10.0.0.50');
    expect(result.subnet_mask).toEqual('255.255.0.0');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toEqual(testSoftwareAssetId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const input: UpdateIpAddressInput = {
      id: testIpAddressId,
      ip_address: '172.16.0.1'
    };

    const result = await updateIpAddress(input);

    expect(result.id).toEqual(testIpAddressId);
    expect(result.ip_address).toEqual('172.16.0.1');
    expect(result.subnet_mask).toEqual('255.255.255.0'); // Should remain unchanged
    expect(result.hardware_asset_id).toEqual(testHardwareAssetId); // Should remain unchanged
    expect(result.software_asset_id).toBeNull(); // Should remain unchanged
  });

  it('should update database record correctly', async () => {
    const input: UpdateIpAddressInput = {
      id: testIpAddressId,
      ip_address: '192.168.2.200',
      subnet_mask: '255.255.255.128'
    };

    await updateIpAddress(input);

    // Verify database was updated
    const updatedRecord = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, testIpAddressId))
      .execute();

    expect(updatedRecord).toHaveLength(1);
    expect(updatedRecord[0].ip_address).toEqual('192.168.2.200');
    expect(updatedRecord[0].subnet_mask).toEqual('255.255.255.128');
    expect(updatedRecord[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set foreign keys to null', async () => {
    const input: UpdateIpAddressInput = {
      id: testIpAddressId,
      hardware_asset_id: null,
      software_asset_id: null
    };

    const result = await updateIpAddress(input);

    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toBeNull();
  });

  it('should throw error for non-existent IP address', async () => {
    const input: UpdateIpAddressInput = {
      id: 99999,
      ip_address: '10.0.0.1'
    };

    await expect(updateIpAddress(input)).rejects.toThrow(/IP address with ID 99999 not found/i);
  });

  it('should throw error for non-existent hardware asset', async () => {
    const input: UpdateIpAddressInput = {
      id: testIpAddressId,
      hardware_asset_id: 99999
    };

    await expect(updateIpAddress(input)).rejects.toThrow(/Hardware asset with ID 99999 not found/i);
  });

  it('should throw error for non-existent software asset', async () => {
    const input: UpdateIpAddressInput = {
      id: testIpAddressId,
      software_asset_id: 99999
    };

    await expect(updateIpAddress(input)).rejects.toThrow(/Software asset with ID 99999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalRecord = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, testIpAddressId))
      .execute();
    const originalTimestamp = originalRecord[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateIpAddressInput = {
      id: testIpAddressId,
      ip_address: '10.0.0.99'
    };

    const result = await updateIpAddress(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should handle updating with valid hardware and software assets', async () => {
    // Create another hardware asset for testing
    const newHardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Another Server',
        type: 'Server',
        manufacturer: 'HP',
        model: 'ProLiant DL360',
        description: 'Another test server'
      })
      .returning()
      .execute();

    const input: UpdateIpAddressInput = {
      id: testIpAddressId,
      ip_address: '192.168.3.50',
      hardware_asset_id: newHardwareResult[0].id,
      software_asset_id: testSoftwareAssetId
    };

    const result = await updateIpAddress(input);

    expect(result.ip_address).toEqual('192.168.3.50');
    expect(result.hardware_asset_id).toEqual(newHardwareResult[0].id);
    expect(result.software_asset_id).toEqual(testSoftwareAssetId);
  });
});
