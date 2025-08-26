import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, ipAddressesTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAddressInput } from '../schema';
import { createIpAddress } from '../handlers/create_ip_address';
import { eq } from 'drizzle-orm';

// Test inputs
const testHardwareAssetInput = {
  name: 'Test Server',
  type: 'server' as const,
  description: 'A server for testing'
};

const testSoftwareAssetInput = {
  name: 'Test VM',
  type: 'VM' as const,
  description: 'A VM for testing',
  host_id: 1
};

const testIpAddressForHardwareInput: CreateIpAddressInput = {
  ip_address: '192.168.1.100',
  status: 'allocated',
  hardware_asset_id: 1,
  software_asset_id: null
};

const testIpAddressForSoftwareInput: CreateIpAddressInput = {
  ip_address: '192.168.1.101',
  status: 'allocated',
  hardware_asset_id: null,
  software_asset_id: 1
};

describe('createIpAddress', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset for testing
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareAssetInput)
      .returning()
      .execute();
    
    // Update the host_id for software asset to match created hardware asset
    testSoftwareAssetInput.host_id = hardwareResult[0].id;
    
    // Create a software asset for testing
    await db.insert(softwareAssetsTable)
      .values(testSoftwareAssetInput)
      .returning()
      .execute();
  });
  
  afterEach(resetDB);

  it('should create an IP address linked to a hardware asset', async () => {
    const result = await createIpAddress(testIpAddressForHardwareInput);

    // Basic field validation
    expect(result.ip_address).toEqual('192.168.1.100');
    expect(result.status).toEqual('allocated');
    expect(result.hardware_asset_id).toEqual(1);
    expect(result.software_asset_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an IP address linked to a software asset', async () => {
    const result = await createIpAddress(testIpAddressForSoftwareInput);

    // Basic field validation
    expect(result.ip_address).toEqual('192.168.1.101');
    expect(result.status).toEqual('allocated');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save IP address to database', async () => {
    const result = await createIpAddress(testIpAddressForHardwareInput);

    // Query using proper drizzle syntax
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, result.id))
      .execute();

    expect(ipAddresses).toHaveLength(1);
    expect(ipAddresses[0].ip_address).toEqual('192.168.1.100');
    expect(ipAddresses[0].status).toEqual('allocated');
    expect(ipAddresses[0].hardware_asset_id).toEqual(1);
    expect(ipAddresses[0].software_asset_id).toBeNull();
    expect(ipAddresses[0].created_at).toBeInstanceOf(Date);
  });

  it('should fail to create an IP address linked to both hardware and software assets', async () => {
    const invalidInput: CreateIpAddressInput = {
      ip_address: '192.168.1.102',
      status: 'allocated',
      hardware_asset_id: 1,
      software_asset_id: 1
    };

    await expect(createIpAddress(invalidInput)).rejects.toThrow(/cannot be linked to both/);
  });

  it('should fail to create an IP address not linked to any asset', async () => {
    const invalidInput: CreateIpAddressInput = {
      ip_address: '192.168.1.103',
      status: 'free',
      hardware_asset_id: null,
      software_asset_id: null
    };

    await expect(createIpAddress(invalidInput)).rejects.toThrow(/must be linked to either/);
  });
});
