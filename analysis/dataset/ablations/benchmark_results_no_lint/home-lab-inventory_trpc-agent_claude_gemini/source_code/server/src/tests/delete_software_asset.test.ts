import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAddressAllocationsTable } from '../db/schema';
import { type DeleteInput, type CreateSoftwareAssetInput } from '../schema';
import { deleteSoftwareAsset } from '../handlers/delete_software_asset';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteInput = {
  id: 1
};

describe('deleteSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a software asset successfully', async () => {
    // First create a software asset to delete
    const softwareAssetInput: CreateSoftwareAssetInput = {
      name: 'Test VM',
      type: 'Virtual Machine',
      hardware_asset_id: null,
      operating_system: 'Ubuntu 22.04',
      purpose: 'Development',
      resource_allocation: '4 CPU, 8GB RAM',
      ip_address_id: null
    };

    const createdAsset = await db.insert(softwareAssetsTable)
      .values(softwareAssetInput)
      .returning()
      .execute();

    const assetId = createdAsset[0].id;

    // Delete the software asset
    const result = await deleteSoftwareAsset({ id: assetId });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify asset no longer exists in database
    const deletedAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, assetId))
      .execute();

    expect(deletedAsset).toHaveLength(0);
  });

  it('should delete software asset with foreign key references', async () => {
    // Create prerequisite data
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        make: 'Dell',
        model: 'PowerEdge R740',
        serial_number: 'SN123456',
        description: 'Development server'
      })
      .returning()
      .execute();

    const ipAllocation = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        purpose: 'Development',
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'allocated'
      })
      .returning()
      .execute();

    // Create software asset with foreign key references
    const softwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Web Server VM',
        type: 'Virtual Machine',
        hardware_asset_id: hardwareAsset[0].id,
        operating_system: 'CentOS 7',
        purpose: 'Web hosting',
        resource_allocation: '2 CPU, 4GB RAM',
        ip_address_id: ipAllocation[0].id
      })
      .returning()
      .execute();

    // Delete the software asset
    const result = await deleteSoftwareAsset({ id: softwareAsset[0].id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify software asset no longer exists
    const deletedAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset[0].id))
      .execute();

    expect(deletedAsset).toHaveLength(0);

    // Verify referenced data still exists
    const hardwareStillExists = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAsset[0].id))
      .execute();

    const ipStillExists = await db.select()
      .from(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, ipAllocation[0].id))
      .execute();

    expect(hardwareStillExists).toHaveLength(1);
    expect(ipStillExists).toHaveLength(1);
  });

  it('should throw error when trying to delete non-existent software asset', async () => {
    // Try to delete a software asset that doesn't exist
    const nonExistentId = 99999;

    await expect(deleteSoftwareAsset({ id: nonExistentId }))
      .rejects
      .toThrow(/Software asset with ID 99999 not found/i);
  });

  it('should handle multiple software assets correctly', async () => {
    // Create multiple software assets
    const asset1 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Database VM',
        type: 'Virtual Machine',
        hardware_asset_id: null,
        operating_system: 'PostgreSQL 14',
        purpose: 'Database',
        resource_allocation: '8 CPU, 16GB RAM',
        ip_address_id: null
      })
      .returning()
      .execute();

    const asset2 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Application Server',
        type: 'Container',
        hardware_asset_id: null,
        operating_system: 'Alpine Linux',
        purpose: 'Application hosting',
        resource_allocation: '2 CPU, 4GB RAM',
        ip_address_id: null
      })
      .returning()
      .execute();

    // Delete only the first asset
    const result = await deleteSoftwareAsset({ id: asset1[0].id });

    expect(result.success).toBe(true);

    // Verify first asset is deleted
    const deletedAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, asset1[0].id))
      .execute();

    expect(deletedAsset).toHaveLength(0);

    // Verify second asset still exists
    const remainingAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, asset2[0].id))
      .execute();

    expect(remainingAsset).toHaveLength(1);
    expect(remainingAsset[0].name).toEqual('Application Server');
  });
});
