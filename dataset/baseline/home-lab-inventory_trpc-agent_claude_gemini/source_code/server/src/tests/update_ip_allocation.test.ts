import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type UpdateIpAllocationInput, type CreateHardwareAssetInput, type CreateSoftwareAssetInput } from '../schema';
import { updateIpAllocation } from '../handlers/update_ip_allocation';
import { eq } from 'drizzle-orm';

describe('updateIpAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an IP allocation with all fields', async () => {
    // Create prerequisites
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        make: 'Dell',
        model: 'R750',
        location: 'DC1'
      })
      .returning()
      .execute();

    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'vm',
        host_id: hardwareResult[0].id,
        description: 'Test virtual machine'
      })
      .returning()
      .execute();

    // Create initial IP allocation
    const initialAllocation = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Original Asset',
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateIpAllocationInput = {
      id: initialAllocation[0].id,
      ip_address: '192.168.1.101',
      asset_name: 'Updated Asset',
      hardware_asset_id: hardwareResult[0].id,
      software_asset_id: softwareResult[0].id,
      description: 'Updated description'
    };

    const result = await updateIpAllocation(updateInput);

    // Verify the result
    expect(result.id).toEqual(initialAllocation[0].id);
    expect(result.ip_address).toEqual('192.168.1.101');
    expect(result.asset_name).toEqual('Updated Asset');
    expect(result.hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(result.software_asset_id).toEqual(softwareResult[0].id);
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(initialAllocation[0].created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > initialAllocation[0].updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create initial IP allocation
    const initialAllocation = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Original Asset',
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateIpAllocationInput = {
      id: initialAllocation[0].id,
      asset_name: 'Updated Asset Name Only'
    };

    const result = await updateIpAllocation(updateInput);

    // Verify only specified field was updated
    expect(result.id).toEqual(initialAllocation[0].id);
    expect(result.ip_address).toEqual('192.168.1.100'); // Unchanged
    expect(result.asset_name).toEqual('Updated Asset Name Only'); // Updated
    expect(result.hardware_asset_id).toBeNull(); // Unchanged
    expect(result.software_asset_id).toBeNull(); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > initialAllocation[0].updated_at).toBe(true);
  });

  it('should update allocation to set foreign keys to null', async () => {
    // Create prerequisites
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        make: null,
        model: null,
        location: null
      })
      .returning()
      .execute();

    // Create initial IP allocation with foreign keys
    const initialAllocation = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Test Asset',
        hardware_asset_id: hardwareResult[0].id,
        software_asset_id: null,
        description: 'Test description'
      })
      .returning()
      .execute();

    const updateInput: UpdateIpAllocationInput = {
      id: initialAllocation[0].id,
      hardware_asset_id: null,
      software_asset_id: null
    };

    const result = await updateIpAllocation(updateInput);

    // Verify foreign keys were set to null
    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toBeNull();
    expect(result.updated_at > initialAllocation[0].updated_at).toBe(true);
  });

  it('should save updated IP allocation to database', async () => {
    // Create initial IP allocation
    const initialAllocation = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Original Asset',
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateIpAllocationInput = {
      id: initialAllocation[0].id,
      ip_address: '192.168.1.101',
      asset_name: 'Updated Asset'
    };

    await updateIpAllocation(updateInput);

    // Verify changes were persisted
    const dbAllocation = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, initialAllocation[0].id))
      .execute();

    expect(dbAllocation).toHaveLength(1);
    expect(dbAllocation[0].ip_address).toEqual('192.168.1.101');
    expect(dbAllocation[0].asset_name).toEqual('Updated Asset');
    expect(dbAllocation[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when IP allocation not found', async () => {
    const updateInput: UpdateIpAllocationInput = {
      id: 999,
      asset_name: 'Updated Asset'
    };

    await expect(updateIpAllocation(updateInput)).rejects.toThrow(/IP allocation with ID 999 not found/i);
  });

  it('should throw error when IP address already exists', async () => {
    // Create two IP allocations
    const allocation1 = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Asset 1',
        hardware_asset_id: null,
        software_asset_id: null,
        description: null
      })
      .returning()
      .execute();

    const allocation2 = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.101',
        asset_name: 'Asset 2',
        hardware_asset_id: null,
        software_asset_id: null,
        description: null
      })
      .returning()
      .execute();

    // Try to update allocation2 with allocation1's IP
    const updateInput: UpdateIpAllocationInput = {
      id: allocation2[0].id,
      ip_address: '192.168.1.100'
    };

    await expect(updateIpAllocation(updateInput)).rejects.toThrow(/IP address 192\.168\.1\.100 is already allocated/i);
  });

  it('should allow updating IP allocation to same IP address', async () => {
    // Create IP allocation
    const allocation = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Test Asset',
        hardware_asset_id: null,
        software_asset_id: null,
        description: null
      })
      .returning()
      .execute();

    // Update with same IP address should succeed
    const updateInput: UpdateIpAllocationInput = {
      id: allocation[0].id,
      ip_address: '192.168.1.100',
      asset_name: 'Updated Asset Name'
    };

    const result = await updateIpAllocation(updateInput);

    expect(result.ip_address).toEqual('192.168.1.100');
    expect(result.asset_name).toEqual('Updated Asset Name');
  });

  it('should throw error when hardware asset not found', async () => {
    // Create initial IP allocation
    const allocation = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Test Asset',
        hardware_asset_id: null,
        software_asset_id: null,
        description: null
      })
      .returning()
      .execute();

    const updateInput: UpdateIpAllocationInput = {
      id: allocation[0].id,
      hardware_asset_id: 999
    };

    await expect(updateIpAllocation(updateInput)).rejects.toThrow(/Hardware asset with ID 999 not found/i);
  });

  it('should throw error when software asset not found', async () => {
    // Create initial IP allocation
    const allocation = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Test Asset',
        hardware_asset_id: null,
        software_asset_id: null,
        description: null
      })
      .returning()
      .execute();

    const updateInput: UpdateIpAllocationInput = {
      id: allocation[0].id,
      software_asset_id: 999
    };

    await expect(updateIpAllocation(updateInput)).rejects.toThrow(/Software asset with ID 999 not found/i);
  });

  it('should successfully update with valid hardware and software assets', async () => {
    // Create hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        make: null,
        model: null,
        location: null
      })
      .returning()
      .execute();

    // Create software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'vm',
        host_id: hardwareResult[0].id,
        description: null
      })
      .returning()
      .execute();

    // Create initial IP allocation
    const allocation = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        asset_name: 'Test Asset',
        hardware_asset_id: null,
        software_asset_id: null,
        description: null
      })
      .returning()
      .execute();

    const updateInput: UpdateIpAllocationInput = {
      id: allocation[0].id,
      hardware_asset_id: hardwareResult[0].id,
      software_asset_id: softwareResult[0].id
    };

    const result = await updateIpAllocation(updateInput);

    expect(result.hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(result.software_asset_id).toEqual(softwareResult[0].id);
  });
});
