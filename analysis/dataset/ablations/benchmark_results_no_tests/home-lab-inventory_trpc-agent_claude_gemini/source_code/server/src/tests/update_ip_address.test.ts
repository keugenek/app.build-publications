import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type UpdateIpAddressInput, type CreateHardwareAssetInput, type CreateSoftwareAssetInput } from '../schema';
import { updateIpAddress } from '../handlers/update_ip_address';
import { eq } from 'drizzle-orm';

describe('updateIpAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test hardware asset
  const createTestHardware = async (name = 'Test Server') => {
    const hardwareData: CreateHardwareAssetInput = {
      name,
      type: 'server',
      status: 'active',
      model: 'Dell PowerEdge',
      manufacturer: 'Dell',
      serial_number: 'ABC123',
      location: 'Data Center 1',
      notes: 'Test hardware'
    };

    const result = await db.insert(hardwareAssetsTable)
      .values(hardwareData)
      .returning()
      .execute();

    return result[0];
  };

  // Helper function to create test software asset
  const createTestSoftware = async (hardwareId: number, name = 'Test VM') => {
    const softwareData: CreateSoftwareAssetInput = {
      name,
      type: 'virtual_machine',
      status: 'running',
      host_hardware_id: hardwareId,
      operating_system: 'Ubuntu 22.04',
      version: '1.0.0',
      notes: 'Test software'
    };

    const result = await db.insert(softwareAssetsTable)
      .values(softwareData)
      .returning()
      .execute();

    return result[0];
  };

  // Helper function to create test IP address
  const createTestIpAddress = async () => {
    const ipData = {
      ip_address: '192.168.1.100',
      subnet: '192.168.1.0/24',
      assignment_type: 'hardware' as const,
      hardware_asset_id: null,
      software_asset_id: null,
      description: 'Test IP',
      is_reserved: false
    };

    const result = await db.insert(ipAddressesTable)
      .values(ipData)
      .returning()
      .execute();

    return result[0];
  };

  it('should update an IP address with basic fields', async () => {
    const ipAddress = await createTestIpAddress();

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      ip_address: '192.168.1.101',
      subnet: '192.168.1.0/25',
      description: 'Updated test IP',
      is_reserved: true
    };

    const result = await updateIpAddress(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(ipAddress.id);
    expect(result!.ip_address).toEqual('192.168.1.101');
    expect(result!.subnet).toEqual('192.168.1.0/25');
    expect(result!.description).toEqual('Updated test IP');
    expect(result!.is_reserved).toEqual(true);
    expect(result!.assignment_type).toEqual('hardware'); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(ipAddress.updated_at.getTime());
  });

  it('should update IP address assignment type and references', async () => {
    const hardware = await createTestHardware();
    const software = await createTestSoftware(hardware.id);
    const ipAddress = await createTestIpAddress();

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      assignment_type: 'software',
      software_asset_id: software.id,
      hardware_asset_id: null
    };

    const result = await updateIpAddress(updateInput);

    expect(result).toBeTruthy();
    expect(result!.assignment_type).toEqual('software');
    expect(result!.software_asset_id).toEqual(software.id);
    expect(result!.hardware_asset_id).toBeNull();
  });

  it('should assign IP address to hardware asset', async () => {
    const hardware = await createTestHardware();
    const ipAddress = await createTestIpAddress();

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      hardware_asset_id: hardware.id
    };

    const result = await updateIpAddress(updateInput);

    expect(result).toBeTruthy();
    expect(result!.hardware_asset_id).toEqual(hardware.id);
    expect(result!.assignment_type).toEqual('hardware'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const ipAddress = await createTestIpAddress();

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      ip_address: '10.0.0.50',
      subnet: '10.0.0.0/24',
      is_reserved: true
    };

    await updateIpAddress(updateInput);

    // Verify changes persisted to database
    const updatedIp = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress.id))
      .execute();

    expect(updatedIp).toHaveLength(1);
    expect(updatedIp[0].ip_address).toEqual('10.0.0.50');
    expect(updatedIp[0].subnet).toEqual('10.0.0.0/24');
    expect(updatedIp[0].is_reserved).toEqual(true);
    expect(updatedIp[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent IP address', async () => {
    const updateInput: UpdateIpAddressInput = {
      id: 99999,
      ip_address: '192.168.1.200'
    };

    const result = await updateIpAddress(updateInput);
    expect(result).toBeNull();
  });

  it('should handle partial updates correctly', async () => {
    const ipAddress = await createTestIpAddress();
    const originalDescription = ipAddress.description;

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      is_reserved: true
      // Only updating is_reserved, other fields should remain unchanged
    };

    const result = await updateIpAddress(updateInput);

    expect(result).toBeTruthy();
    expect(result!.is_reserved).toEqual(true);
    expect(result!.ip_address).toEqual(ipAddress.ip_address);
    expect(result!.subnet).toEqual(ipAddress.subnet);
    expect(result!.description).toEqual(originalDescription);
  });

  it('should throw error when referencing non-existent hardware asset', async () => {
    const ipAddress = await createTestIpAddress();

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      hardware_asset_id: 99999
    };

    expect(() => updateIpAddress(updateInput))
      .rejects.toThrow(/hardware asset with id 99999 not found/i);
  });

  it('should throw error when referencing non-existent software asset', async () => {
    const ipAddress = await createTestIpAddress();

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      software_asset_id: 99999
    };

    expect(() => updateIpAddress(updateInput))
      .rejects.toThrow(/software asset with id 99999 not found/i);
  });

  it('should allow setting references to null', async () => {
    const hardware = await createTestHardware();
    const software = await createTestSoftware(hardware.id);
    
    // Create IP with both references
    const ipData = {
      ip_address: '192.168.1.100',
      subnet: '192.168.1.0/24',
      assignment_type: 'hardware' as const,
      hardware_asset_id: hardware.id,
      software_asset_id: software.id,
      description: 'Test IP',
      is_reserved: false
    };

    const ipResult = await db.insert(ipAddressesTable)
      .values(ipData)
      .returning()
      .execute();
    const ipAddress = ipResult[0];

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      hardware_asset_id: null,
      software_asset_id: null
    };

    const result = await updateIpAddress(updateInput);

    expect(result).toBeTruthy();
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.software_asset_id).toBeNull();
  });

  it('should update with valid IP address formats', async () => {
    const ipAddress = await createTestIpAddress();

    const updateInput: UpdateIpAddressInput = {
      id: ipAddress.id,
      ip_address: '2001:db8::1' // IPv6 address
    };

    const result = await updateIpAddress(updateInput);

    expect(result).toBeTruthy();
    expect(result!.ip_address).toEqual('2001:db8::1');
  });
});
