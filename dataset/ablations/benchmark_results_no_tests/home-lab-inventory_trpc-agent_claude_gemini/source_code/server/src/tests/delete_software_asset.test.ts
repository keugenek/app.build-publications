import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAddressesTable } from '../db/schema';
import { type IdInput, type CreateSoftwareAssetInput, type CreateHardwareAssetInput, type CreateIpAddressInput } from '../schema';
import { deleteSoftwareAsset } from '../handlers/delete_software_asset';
import { eq } from 'drizzle-orm';

// Test input for creating a software asset
const testSoftwareInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'virtual_machine',
  status: 'running',
  operating_system: 'Ubuntu 22.04',
  version: '1.0.0',
  notes: 'Test virtual machine'
};

// Test input for creating hardware asset (for relationship testing)
const testHardwareInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  status: 'active',
  model: 'Dell PowerEdge',
  manufacturer: 'Dell',
  location: 'Data Center A'
};

describe('deleteSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing software asset', async () => {
    // Create a software asset first
    const createResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        status: testSoftwareInput.status,
        operating_system: testSoftwareInput.operating_system,
        version: testSoftwareInput.version,
        notes: testSoftwareInput.notes
      })
      .returning()
      .execute();

    const softwareAsset = createResult[0];
    const deleteInput: IdInput = { id: softwareAsset.id };

    // Delete the software asset
    const result = await deleteSoftwareAsset(deleteInput);

    expect(result).toBe(true);

    // Verify software asset was deleted from database
    const deletedAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(deletedAssets).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent software asset', async () => {
    const deleteInput: IdInput = { id: 9999 }; // Non-existent ID

    const result = await deleteSoftwareAsset(deleteInput);

    expect(result).toBe(false);
  });

  it('should handle deletion of software asset with host hardware reference', async () => {
    // Create hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        status: testHardwareInput.status,
        model: testHardwareInput.model,
        manufacturer: testHardwareInput.manufacturer,
        location: testHardwareInput.location
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create software asset with hardware reference
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        status: testSoftwareInput.status,
        host_hardware_id: hardwareAsset.id,
        operating_system: testSoftwareInput.operating_system,
        version: testSoftwareInput.version,
        notes: testSoftwareInput.notes
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];
    const deleteInput: IdInput = { id: softwareAsset.id };

    // Delete the software asset
    const result = await deleteSoftwareAsset(deleteInput);

    expect(result).toBe(true);

    // Verify software asset was deleted
    const deletedAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(deletedAssets).toHaveLength(0);

    // Verify hardware asset still exists (cascade should not affect parent)
    const remainingHardware = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAsset.id))
      .execute();

    expect(remainingHardware).toHaveLength(1);
  });

  it('should handle deletion when software asset has IP address assignments', async () => {
    // Create software asset first
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareInput.name,
        type: testSoftwareInput.type,
        status: testSoftwareInput.status,
        operating_system: testSoftwareInput.operating_system,
        version: testSoftwareInput.version,
        notes: testSoftwareInput.notes
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Create IP address assignment
    const ipInput: CreateIpAddressInput = {
      ip_address: '192.168.1.100',
      subnet: '192.168.1.0/24',
      assignment_type: 'software',
      software_asset_id: softwareAsset.id,
      description: 'Test IP assignment',
      is_reserved: false
    };

    await db.insert(ipAddressesTable)
      .values({
        ip_address: ipInput.ip_address,
        subnet: ipInput.subnet,
        assignment_type: ipInput.assignment_type,
        software_asset_id: ipInput.software_asset_id,
        description: ipInput.description,
        is_reserved: ipInput.is_reserved
      })
      .execute();

    const deleteInput: IdInput = { id: softwareAsset.id };

    // Delete the software asset (should handle foreign key constraint)
    const result = await deleteSoftwareAsset(deleteInput);

    expect(result).toBe(true);

    // Verify software asset was deleted
    const deletedAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset.id))
      .execute();

    expect(deletedAssets).toHaveLength(0);

    // Verify IP address assignment still exists but with null software_asset_id
    // (depending on cascade behavior - this tests the actual database behavior)
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.software_asset_id, softwareAsset.id))
      .execute();

    // The IP address should either be deleted or have null software_asset_id
    // This depends on the database foreign key constraint configuration
    expect(ipAddresses).toHaveLength(0);
  });

  it('should delete multiple different software assets correctly', async () => {
    // Create multiple software assets
    const asset1 = await db.insert(softwareAssetsTable)
      .values({
        name: 'VM 1',
        type: 'virtual_machine',
        status: 'running',
        operating_system: 'Ubuntu 22.04'
      })
      .returning()
      .execute();

    const asset2 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Container 1',
        type: 'container',
        status: 'stopped',
        operating_system: 'Alpine Linux'
      })
      .returning()
      .execute();

    const asset3 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Service 1',
        type: 'service',
        status: 'running'
      })
      .returning()
      .execute();

    // Delete first asset
    const result1 = await deleteSoftwareAsset({ id: asset1[0].id });
    expect(result1).toBe(true);

    // Delete third asset
    const result3 = await deleteSoftwareAsset({ id: asset3[0].id });
    expect(result3).toBe(true);

    // Verify only the second asset remains
    const remainingAssets = await db.select()
      .from(softwareAssetsTable)
      .execute();

    expect(remainingAssets).toHaveLength(1);
    expect(remainingAssets[0].id).toBe(asset2[0].id);
    expect(remainingAssets[0].name).toBe('Container 1');
  });
});
