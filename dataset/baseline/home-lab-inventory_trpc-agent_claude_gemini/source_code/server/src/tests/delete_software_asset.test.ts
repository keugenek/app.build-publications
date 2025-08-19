import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAllocationsTable } from '../db/schema';
import { type IdParam, type CreateSoftwareAssetInput, type CreateHardwareAssetInput, type CreateIpAllocationInput } from '../schema';
import { deleteSoftwareAsset } from '../handlers/delete_software_asset';
import { eq } from 'drizzle-orm';

// Test input for creating prerequisite hardware asset
const testHardwareInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R740',
  location: 'Datacenter A'
};

// Test input for creating software asset
const testSoftwareInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'vm',
  host_id: null, // Will be set after creating hardware asset
  description: 'Test virtual machine'
};

// Test input for creating IP allocation
const testIpInput: CreateIpAllocationInput = {
  ip_address: '192.168.1.100',
  asset_name: 'Test VM',
  hardware_asset_id: null,
  software_asset_id: null, // Will be set after creating software asset
  description: 'IP for test VM'
};

describe('deleteSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a software asset', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        make: testHardwareInput.make,
        model: testHardwareInput.model,
        location: testHardwareInput.location
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: hardwareAsset.id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Delete the software asset
    const params: IdParam = { id: softwareAsset.id };
    const result = await deleteSoftwareAsset(params);

    expect(result.success).toBe(true);

    // Verify software asset is deleted
    const remainingSoftwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(remainingSoftwareAssets).toHaveLength(0);
  });

  it('should delete software asset and cascade delete related IP allocations', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        make: testHardwareInput.make,
        model: testHardwareInput.model,
        location: testHardwareInput.location
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: hardwareAsset.id,
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Create IP allocation linked to the software asset
    await db.insert(ipAllocationsTable)
      .values({
        ip_address: testIpInput.ip_address,
        asset_name: testIpInput.asset_name,
        hardware_asset_id: null,
        software_asset_id: softwareAsset.id,
        description: testIpInput.description
      })
      .execute();

    // Verify IP allocation exists before deletion
    const initialIpAllocations = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.software_asset_id, softwareAsset.id))
      .execute();

    expect(initialIpAllocations).toHaveLength(1);

    // Delete the software asset
    const params: IdParam = { id: softwareAsset.id };
    const result = await deleteSoftwareAsset(params);

    expect(result.success).toBe(true);

    // Verify software asset is deleted
    const remainingSoftwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(remainingSoftwareAssets).toHaveLength(0);

    // Verify related IP allocations are also deleted (cascade)
    const remainingIpAllocations = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.software_asset_id, softwareAsset.id))
      .execute();

    expect(remainingIpAllocations).toHaveLength(0);
  });

  it('should throw error when software asset does not exist', async () => {
    const params: IdParam = { id: 999 }; // Non-existent ID

    await expect(deleteSoftwareAsset(params)).rejects.toThrow(/Software asset with ID 999 not found/i);
  });

  it('should delete software asset without host_id', async () => {
    // Create software asset without host_id
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        host_id: null, // No host association
        description: testSoftwareInput.description
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Delete the software asset
    const params: IdParam = { id: softwareAsset.id };
    const result = await deleteSoftwareAsset(params);

    expect(result.success).toBe(true);

    // Verify software asset is deleted
    const remainingSoftwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(remainingSoftwareAssets).toHaveLength(0);
  });

  it('should delete software asset and leave unrelated IP allocations intact', async () => {
    // Create two software assets
    const software1Result = await db.insert(softwareAssetsTable)
      .values({
        name: 'Software Asset 1',
        type: 'vm',
        host_id: null,
        description: 'First software asset'
      })
      .returning()
      .execute();

    const software2Result = await db.insert(softwareAssetsTable)
      .values({
        name: 'Software Asset 2',
        type: 'container',
        host_id: null,
        description: 'Second software asset'
      })
      .returning()
      .execute();

    const softwareAsset1 = software1Result[0];
    const softwareAsset2 = software2Result[0];

    // Create IP allocations for both software assets
    await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.101',
        asset_name: 'Software Asset 1',
        hardware_asset_id: null,
        software_asset_id: softwareAsset1.id,
        description: 'IP for software asset 1'
      })
      .execute();

    await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.102',
        asset_name: 'Software Asset 2',
        hardware_asset_id: null,
        software_asset_id: softwareAsset2.id,
        description: 'IP for software asset 2'
      })
      .execute();

    // Delete first software asset
    const params: IdParam = { id: softwareAsset1.id };
    const result = await deleteSoftwareAsset(params);

    expect(result.success).toBe(true);

    // Verify first software asset is deleted
    const remainingAsset1 = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset1.id))
      .execute();

    expect(remainingAsset1).toHaveLength(0);

    // Verify second software asset still exists
    const remainingAsset2 = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset2.id))
      .execute();

    expect(remainingAsset2).toHaveLength(1);

    // Verify IP allocation for first asset is deleted
    const ipAllocations1 = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.software_asset_id, softwareAsset1.id))
      .execute();

    expect(ipAllocations1).toHaveLength(0);

    // Verify IP allocation for second asset still exists
    const ipAllocations2 = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.software_asset_id, softwareAsset2.id))
      .execute();

    expect(ipAllocations2).toHaveLength(1);
    expect(ipAllocations2[0].ip_address).toEqual('192.168.1.102');
  });
});
