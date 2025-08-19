import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAllocationsTable } from '../db/schema';
import { type IdParam, type CreateHardwareAssetInput, type CreateSoftwareAssetInput, type CreateIpAllocationInput } from '../schema';
import { deleteHardwareAsset } from '../handlers/delete_hardware_asset';
import { eq } from 'drizzle-orm';

// Test data
const testHardwareAsset: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R740',
  location: 'Data Center A'
};

const testSoftwareAsset: CreateSoftwareAssetInput = {
  name: 'Web Server VM',
  type: 'vm',
  host_id: null, // Will be set after hardware asset creation
  description: 'Production web server'
};

const testIpAllocation: CreateIpAllocationInput = {
  ip_address: '192.168.1.100',
  asset_name: 'Test Server',
  hardware_asset_id: null, // Will be set after hardware asset creation
  software_asset_id: null,
  description: 'Management IP'
};

describe('deleteHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a hardware asset successfully', async () => {
    // Create test hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareAsset.name,
        type: testHardwareAsset.type,
        make: testHardwareAsset.make,
        model: testHardwareAsset.model,
        location: testHardwareAsset.location
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];
    const params: IdParam = { id: hardwareAsset.id };

    // Delete the hardware asset
    const result = await deleteHardwareAsset(params);

    expect(result.success).toBe(true);

    // Verify the asset is deleted from database
    const deletedAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAsset.id))
      .execute();

    expect(deletedAssets).toHaveLength(0);
  });

  it('should handle cascade deletion of related software assets', async () => {
    // Create test hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareAsset.name,
        type: testHardwareAsset.type,
        make: testHardwareAsset.make,
        model: testHardwareAsset.model,
        location: testHardwareAsset.location
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create software asset that references the hardware asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareAsset.name,
        type: testSoftwareAsset.type,
        host_id: hardwareAsset.id,
        description: testSoftwareAsset.description
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];
    const params: IdParam = { id: hardwareAsset.id };

    // Delete the hardware asset
    const result = await deleteHardwareAsset(params);

    expect(result.success).toBe(true);

    // Verify software asset still exists but host_id is set to null
    const updatedSoftwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(updatedSoftwareAssets).toHaveLength(1);
    expect(updatedSoftwareAssets[0].host_id).toBeNull();
    expect(updatedSoftwareAssets[0].name).toEqual(testSoftwareAsset.name);
  });

  it('should handle cascade deletion of related IP allocations', async () => {
    // Create test hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareAsset.name,
        type: testHardwareAsset.type,
        make: testHardwareAsset.make,
        model: testHardwareAsset.model,
        location: testHardwareAsset.location
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create IP allocation that references the hardware asset
    const ipResult = await db.insert(ipAllocationsTable)
      .values({
        ip_address: testIpAllocation.ip_address,
        asset_name: testIpAllocation.asset_name,
        hardware_asset_id: hardwareAsset.id,
        software_asset_id: testIpAllocation.software_asset_id,
        description: testIpAllocation.description
      })
      .returning()
      .execute();

    const ipAllocation = ipResult[0];
    const params: IdParam = { id: hardwareAsset.id };

    // Delete the hardware asset
    const result = await deleteHardwareAsset(params);

    expect(result.success).toBe(true);

    // Verify IP allocation is deleted
    const deletedIpAllocations = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, ipAllocation.id))
      .execute();

    expect(deletedIpAllocations).toHaveLength(0);
  });

  it('should handle cascade deletion of both software assets and IP allocations', async () => {
    // Create test hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareAsset.name,
        type: testHardwareAsset.type,
        make: testHardwareAsset.make,
        model: testHardwareAsset.model,
        location: testHardwareAsset.location
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create software asset that references the hardware asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareAsset.name,
        type: testSoftwareAsset.type,
        host_id: hardwareAsset.id,
        description: testSoftwareAsset.description
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Create IP allocation that references the hardware asset
    const ipResult = await db.insert(ipAllocationsTable)
      .values({
        ip_address: testIpAllocation.ip_address,
        asset_name: testIpAllocation.asset_name,
        hardware_asset_id: hardwareAsset.id,
        software_asset_id: null,
        description: testIpAllocation.description
      })
      .returning()
      .execute();

    const ipAllocation = ipResult[0];
    const params: IdParam = { id: hardwareAsset.id };

    // Delete the hardware asset
    const result = await deleteHardwareAsset(params);

    expect(result.success).toBe(true);

    // Verify hardware asset is deleted
    const deletedHardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAsset.id))
      .execute();

    expect(deletedHardwareAssets).toHaveLength(0);

    // Verify software asset still exists but host_id is null
    const updatedSoftwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(updatedSoftwareAssets).toHaveLength(1);
    expect(updatedSoftwareAssets[0].host_id).toBeNull();

    // Verify IP allocation is deleted
    const deletedIpAllocations = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, ipAllocation.id))
      .execute();

    expect(deletedIpAllocations).toHaveLength(0);
  });

  it('should throw error when hardware asset does not exist', async () => {
    const params: IdParam = { id: 99999 }; // Non-existent ID

    await expect(deleteHardwareAsset(params)).rejects.toThrow(/Hardware asset with ID 99999 not found/i);
  });

  it('should handle deletion of hardware asset without related records', async () => {
    // Create test hardware asset with no related records
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Standalone Server',
        type: 'server',
        make: 'HP',
        model: 'ProLiant DL380',
        location: 'Data Center B'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];
    const params: IdParam = { id: hardwareAsset.id };

    // Delete the hardware asset
    const result = await deleteHardwareAsset(params);

    expect(result.success).toBe(true);

    // Verify the asset is deleted from database
    const deletedAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAsset.id))
      .execute();

    expect(deletedAssets).toHaveLength(0);
  });
});
