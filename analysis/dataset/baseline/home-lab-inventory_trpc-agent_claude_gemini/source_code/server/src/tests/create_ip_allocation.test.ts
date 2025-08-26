import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAllocationInput } from '../schema';
import { createIpAllocation } from '../handlers/create_ip_allocation';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateIpAllocationInput = {
  ip_address: '192.168.1.100',
  asset_name: 'Test Server',
  hardware_asset_id: null,
  software_asset_id: null,
  description: 'Test IP allocation'
};

describe('createIpAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an IP allocation', async () => {
    const result = await createIpAllocation(testInput);

    // Basic field validation
    expect(result.ip_address).toEqual('192.168.1.100');
    expect(result.asset_name).toEqual('Test Server');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toBeNull();
    expect(result.description).toEqual('Test IP allocation');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save IP allocation to database', async () => {
    const result = await createIpAllocation(testInput);

    // Query using proper drizzle syntax
    const allocations = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, result.id))
      .execute();

    expect(allocations).toHaveLength(1);
    expect(allocations[0].ip_address).toEqual('192.168.1.100');
    expect(allocations[0].asset_name).toEqual('Test Server');
    expect(allocations[0].description).toEqual('Test IP allocation');
    expect(allocations[0].created_at).toBeInstanceOf(Date);
    expect(allocations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create IP allocation with valid hardware asset reference', async () => {
    // First create a hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Hardware',
        type: 'server',
        make: 'Dell',
        model: 'PowerEdge',
        location: 'Rack 1'
      })
      .returning()
      .execute();

    const inputWithHardware: CreateIpAllocationInput = {
      ...testInput,
      hardware_asset_id: hardwareResult[0].id
    };

    const result = await createIpAllocation(inputWithHardware);

    expect(result.hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(result.software_asset_id).toBeNull();
  });

  it('should create IP allocation with valid software asset reference', async () => {
    // First create a hardware asset to host the software
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'server',
        make: 'HP',
        model: 'ProLiant',
        location: 'Rack 2'
      })
      .returning()
      .execute();

    // Then create a software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'vm',
        host_id: hardwareResult[0].id,
        description: 'Test virtual machine'
      })
      .returning()
      .execute();

    const inputWithSoftware: CreateIpAllocationInput = {
      ...testInput,
      software_asset_id: softwareResult[0].id
    };

    const result = await createIpAllocation(inputWithSoftware);

    expect(result.software_asset_id).toEqual(softwareResult[0].id);
    expect(result.hardware_asset_id).toBeNull();
  });

  it('should create IP allocation with both hardware and software asset references', async () => {
    // Create a hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'server',
        make: 'IBM',
        model: 'ThinkSystem',
        location: 'Rack 3'
      })
      .returning()
      .execute();

    // Create a software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test Container',
        type: 'container',
        host_id: hardwareResult[0].id,
        description: 'Test container'
      })
      .returning()
      .execute();

    const inputWithBoth: CreateIpAllocationInput = {
      ...testInput,
      hardware_asset_id: hardwareResult[0].id,
      software_asset_id: softwareResult[0].id
    };

    const result = await createIpAllocation(inputWithBoth);

    expect(result.hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(result.software_asset_id).toEqual(softwareResult[0].id);
  });

  it('should throw error for non-existent hardware asset', async () => {
    const inputWithInvalidHardware: CreateIpAllocationInput = {
      ...testInput,
      hardware_asset_id: 999999 // Non-existent ID
    };

    await expect(createIpAllocation(inputWithInvalidHardware))
      .rejects.toThrow(/Hardware asset with id 999999 does not exist/i);
  });

  it('should throw error for non-existent software asset', async () => {
    const inputWithInvalidSoftware: CreateIpAllocationInput = {
      ...testInput,
      software_asset_id: 999999 // Non-existent ID
    };

    await expect(createIpAllocation(inputWithInvalidSoftware))
      .rejects.toThrow(/Software asset with id 999999 does not exist/i);
  });

  it('should throw error for duplicate IP address', async () => {
    // Create first IP allocation
    await createIpAllocation(testInput);

    // Try to create another with the same IP
    await expect(createIpAllocation(testInput))
      .rejects.toThrow(); // Database will throw unique constraint violation
  });

  it('should allow null asset references', async () => {
    const inputWithNulls: CreateIpAllocationInput = {
      ip_address: '10.0.0.50',
      asset_name: 'Standalone Asset',
      hardware_asset_id: null,
      software_asset_id: null,
      description: null
    };

    const result = await createIpAllocation(inputWithNulls);

    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toBeNull();
    expect(result.description).toBeNull();
    expect(result.ip_address).toEqual('10.0.0.50');
    expect(result.asset_name).toEqual('Standalone Asset');
  });

  it('should handle minimal input correctly', async () => {
    const minimalInput: CreateIpAllocationInput = {
      ip_address: '172.16.0.1',
      asset_name: 'Minimal Asset',
      hardware_asset_id: null,
      software_asset_id: null,
      description: null
    };

    const result = await createIpAllocation(minimalInput);

    expect(result.ip_address).toEqual('172.16.0.1');
    expect(result.asset_name).toEqual('Minimal Asset');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
