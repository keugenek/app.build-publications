import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAddressInput } from '../schema';
import { createIpAddress } from '../handlers/create_ip_address';
import { eq } from 'drizzle-orm';

// Test input for basic IP address creation
const testInput: CreateIpAddressInput = {
  ip_address: '192.168.1.100',
  subnet: '192.168.1.0/24',
  assignment_type: 'hardware',
  hardware_asset_id: null,
  software_asset_id: null,
  description: 'Test IP address',
  is_reserved: false
};

describe('createIpAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an IP address', async () => {
    const result = await createIpAddress(testInput);

    // Basic field validation
    expect(result.ip_address).toEqual('192.168.1.100');
    expect(result.subnet).toEqual('192.168.1.0/24');
    expect(result.assignment_type).toEqual('hardware');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toBeNull();
    expect(result.description).toEqual('Test IP address');
    expect(result.is_reserved).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save IP address to database', async () => {
    const result = await createIpAddress(testInput);

    // Query using proper drizzle syntax
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, result.id))
      .execute();

    expect(ipAddresses).toHaveLength(1);
    expect(ipAddresses[0].ip_address).toEqual('192.168.1.100');
    expect(ipAddresses[0].subnet).toEqual('192.168.1.0/24');
    expect(ipAddresses[0].assignment_type).toEqual('hardware');
    expect(ipAddresses[0].description).toEqual('Test IP address');
    expect(ipAddresses[0].is_reserved).toEqual(false);
    expect(ipAddresses[0].created_at).toBeInstanceOf(Date);
    expect(ipAddresses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create IP address with hardware asset reference', async () => {
    // Create prerequisite hardware asset
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        status: 'active'
      })
      .returning()
      .execute();

    const inputWithHardware: CreateIpAddressInput = {
      ...testInput,
      hardware_asset_id: hardwareAsset[0].id
    };

    const result = await createIpAddress(inputWithHardware);

    expect(result.hardware_asset_id).toEqual(hardwareAsset[0].id);
    expect(result.software_asset_id).toBeNull();
  });

  it('should create IP address with software asset reference', async () => {
    // Create prerequisite software asset
    const softwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'virtual_machine',
        status: 'running'
      })
      .returning()
      .execute();

    const inputWithSoftware: CreateIpAddressInput = {
      ...testInput,
      assignment_type: 'software',
      software_asset_id: softwareAsset[0].id
    };

    const result = await createIpAddress(inputWithSoftware);

    expect(result.software_asset_id).toEqual(softwareAsset[0].id);
    expect(result.hardware_asset_id).toBeNull();
    expect(result.assignment_type).toEqual('software');
  });

  it('should create reserved IP address', async () => {
    const reservedInput: CreateIpAddressInput = {
      ...testInput,
      is_reserved: true,
      description: 'Reserved for gateway'
    };

    const result = await createIpAddress(reservedInput);

    expect(result.is_reserved).toEqual(true);
    expect(result.description).toEqual('Reserved for gateway');
  });

  it('should handle IPv6 addresses', async () => {
    const ipv6Input: CreateIpAddressInput = {
      ip_address: '2001:db8::1',
      subnet: '2001:db8::/64',
      assignment_type: 'hardware',
      hardware_asset_id: null,
      software_asset_id: null,
      description: 'IPv6 test address',
      is_reserved: false
    };

    const result = await createIpAddress(ipv6Input);

    expect(result.ip_address).toEqual('2001:db8::1');
    expect(result.subnet).toEqual('2001:db8::/64');
  });

  it('should apply default values correctly', async () => {
    // Test minimal input relying on Zod defaults
    const minimalInput: CreateIpAddressInput = {
      ip_address: '10.0.0.50',
      subnet: '10.0.0.0/8',
      assignment_type: 'hardware',
      is_reserved: false
    };

    const result = await createIpAddress(minimalInput);

    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toBeNull();
    expect(result.description).toBeNull();
    expect(result.is_reserved).toEqual(false);
  });

  it('should throw error for non-existent hardware asset', async () => {
    const inputWithInvalidHardware: CreateIpAddressInput = {
      ...testInput,
      hardware_asset_id: 99999 // Non-existent ID
    };

    await expect(createIpAddress(inputWithInvalidHardware))
      .rejects.toThrow(/hardware asset with id 99999 not found/i);
  });

  it('should throw error for non-existent software asset', async () => {
    const inputWithInvalidSoftware: CreateIpAddressInput = {
      ...testInput,
      assignment_type: 'software',
      software_asset_id: 99999 // Non-existent ID
    };

    await expect(createIpAddress(inputWithInvalidSoftware))
      .rejects.toThrow(/software asset with id 99999 not found/i);
  });

  it('should create IP address with both hardware and software references', async () => {
    // Create prerequisite assets
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'server',
        status: 'active'
      })
      .returning()
      .execute();

    const softwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'VM on Host',
        type: 'virtual_machine',
        status: 'running',
        host_hardware_id: hardwareAsset[0].id
      })
      .returning()
      .execute();

    const inputWithBoth: CreateIpAddressInput = {
      ...testInput,
      assignment_type: 'software',
      hardware_asset_id: hardwareAsset[0].id,
      software_asset_id: softwareAsset[0].id,
      description: 'IP assigned to VM on specific host'
    };

    const result = await createIpAddress(inputWithBoth);

    expect(result.hardware_asset_id).toEqual(hardwareAsset[0].id);
    expect(result.software_asset_id).toEqual(softwareAsset[0].id);
    expect(result.assignment_type).toEqual('software');
    expect(result.description).toEqual('IP assigned to VM on specific host');
  });
});
