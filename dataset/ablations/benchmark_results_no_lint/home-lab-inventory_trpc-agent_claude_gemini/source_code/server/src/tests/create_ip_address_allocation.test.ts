import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAddressAllocationInput } from '../schema';
import { createIpAddressAllocation } from '../handlers/create_ip_address_allocation';
import { eq } from 'drizzle-orm';

// Test input for creating IP address allocation
const testInput: CreateIpAddressAllocationInput = {
  ip_address: '192.168.1.100',
  purpose: 'Server hosting',
  assigned_hardware_id: null,
  assigned_software_id: null,
  status: 'allocated'
};

describe('createIpAddressAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an IP address allocation', async () => {
    const result = await createIpAddressAllocation(testInput);

    // Basic field validation
    expect(result.ip_address).toEqual('192.168.1.100');
    expect(result.purpose).toEqual('Server hosting');
    expect(result.assigned_hardware_id).toBeNull();
    expect(result.assigned_software_id).toBeNull();
    expect(result.status).toEqual('allocated');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save IP address allocation to database', async () => {
    const result = await createIpAddressAllocation(testInput);

    // Query using proper drizzle syntax
    const allocations = await db.select()
      .from(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, result.id))
      .execute();

    expect(allocations).toHaveLength(1);
    expect(allocations[0].ip_address).toEqual('192.168.1.100');
    expect(allocations[0].purpose).toEqual('Server hosting');
    expect(allocations[0].assigned_hardware_id).toBeNull();
    expect(allocations[0].assigned_software_id).toBeNull();
    expect(allocations[0].status).toEqual('allocated');
    expect(allocations[0].created_at).toBeInstanceOf(Date);
    expect(allocations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create IP address allocation with hardware asset assignment', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        make: 'Dell',
        model: 'PowerEdge R720',
        serial_number: 'SN123456',
        description: 'Test server for allocation'
      })
      .returning()
      .execute();

    const inputWithHardware: CreateIpAddressAllocationInput = {
      ...testInput,
      assigned_hardware_id: hardwareResult[0].id,
      purpose: 'Hardware server IP'
    };

    const result = await createIpAddressAllocation(inputWithHardware);

    expect(result.assigned_hardware_id).toEqual(hardwareResult[0].id);
    expect(result.purpose).toEqual('Hardware server IP');
    expect(result.assigned_software_id).toBeNull();
  });

  it('should create IP address allocation with software asset assignment', async () => {
    // Create prerequisite software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'virtual_machine',
        operating_system: 'Ubuntu 20.04',
        purpose: 'Development environment'
      })
      .returning()
      .execute();

    const inputWithSoftware: CreateIpAddressAllocationInput = {
      ...testInput,
      assigned_software_id: softwareResult[0].id,
      purpose: 'VM network interface'
    };

    const result = await createIpAddressAllocation(inputWithSoftware);

    expect(result.assigned_software_id).toEqual(softwareResult[0].id);
    expect(result.purpose).toEqual('VM network interface');
    expect(result.assigned_hardware_id).toBeNull();
  });

  it('should create IP address allocation with both hardware and software assignments', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Physical Server',
        type: 'server',
        make: 'HP',
        model: 'ProLiant DL380',
        serial_number: 'HP987654',
        description: 'Physical server hosting VM'
      })
      .returning()
      .execute();

    // Create prerequisite software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Production VM',
        type: 'virtual_machine',
        hardware_asset_id: hardwareResult[0].id,
        operating_system: 'CentOS 8',
        purpose: 'Production web server'
      })
      .returning()
      .execute();

    const inputWithBoth: CreateIpAddressAllocationInput = {
      ...testInput,
      assigned_hardware_id: hardwareResult[0].id,
      assigned_software_id: softwareResult[0].id,
      purpose: 'Production server IP'
    };

    const result = await createIpAddressAllocation(inputWithBoth);

    expect(result.assigned_hardware_id).toEqual(hardwareResult[0].id);
    expect(result.assigned_software_id).toEqual(softwareResult[0].id);
    expect(result.purpose).toEqual('Production server IP');
  });

  it('should handle null values for optional fields', async () => {
    const inputWithNulls: CreateIpAddressAllocationInput = {
      ip_address: '10.0.0.50',
      purpose: null,
      assigned_hardware_id: null,
      assigned_software_id: null,
      status: 'reserved'
    };

    const result = await createIpAddressAllocation(inputWithNulls);

    expect(result.ip_address).toEqual('10.0.0.50');
    expect(result.purpose).toBeNull();
    expect(result.assigned_hardware_id).toBeNull();
    expect(result.assigned_software_id).toBeNull();
    expect(result.status).toEqual('reserved');
  });

  it('should throw error for invalid hardware asset ID', async () => {
    const inputWithInvalidHardware: CreateIpAddressAllocationInput = {
      ...testInput,
      assigned_hardware_id: 99999 // Non-existent ID
    };

    await expect(createIpAddressAllocation(inputWithInvalidHardware))
      .rejects.toThrow(/hardware asset with id 99999 does not exist/i);
  });

  it('should throw error for invalid software asset ID', async () => {
    const inputWithInvalidSoftware: CreateIpAddressAllocationInput = {
      ...testInput,
      assigned_software_id: 99999 // Non-existent ID
    };

    await expect(createIpAddressAllocation(inputWithInvalidSoftware))
      .rejects.toThrow(/software asset with id 99999 does not exist/i);
  });

  it('should create allocation with different status values', async () => {
    const testStatuses = ['allocated', 'reserved', 'available', 'blocked'];

    for (const status of testStatuses) {
      const inputWithStatus: CreateIpAddressAllocationInput = {
        ip_address: `192.168.1.${100 + testStatuses.indexOf(status)}`,
        purpose: `Test allocation - ${status}`,
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: status
      };

      const result = await createIpAddressAllocation(inputWithStatus);

      expect(result.status).toEqual(status);
      expect(result.ip_address).toEqual(`192.168.1.${100 + testStatuses.indexOf(status)}`);
    }
  });
});
