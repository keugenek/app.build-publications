import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAddressesTable } from '../db/schema';
import { type IdInput, type CreateHardwareAssetInput } from '../schema';
import { deleteHardwareAsset } from '../handlers/delete_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input for creating hardware assets
const testHardwareInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  status: 'active',
  model: 'Dell PowerEdge R740',
  manufacturer: 'Dell',
  serial_number: 'SN123456789',
  location: 'Data Center 1',
  notes: 'Test hardware asset for deletion'
};

describe('deleteHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing hardware asset', async () => {
    // Create a hardware asset first
    const createResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        status: testHardwareInput.status,
        model: testHardwareInput.model,
        manufacturer: testHardwareInput.manufacturer,
        serial_number: testHardwareInput.serial_number,
        location: testHardwareInput.location,
        notes: testHardwareInput.notes
      })
      .returning()
      .execute();

    const createdAsset = createResult[0];
    const deleteInput: IdInput = { id: createdAsset.id };

    // Delete the hardware asset
    const result = await deleteHardwareAsset(deleteInput);

    // Should return true indicating successful deletion
    expect(result).toBe(true);
  });

  it('should remove hardware asset from database', async () => {
    // Create a hardware asset first
    const createResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        status: testHardwareInput.status,
        model: testHardwareInput.model,
        manufacturer: testHardwareInput.manufacturer,
        serial_number: testHardwareInput.serial_number,
        location: testHardwareInput.location,
        notes: testHardwareInput.notes
      })
      .returning()
      .execute();

    const createdAsset = createResult[0];
    const deleteInput: IdInput = { id: createdAsset.id };

    // Delete the hardware asset
    await deleteHardwareAsset(deleteInput);

    // Verify the asset no longer exists in the database
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, createdAsset.id))
      .execute();

    expect(assets).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent hardware asset', async () => {
    const deleteInput: IdInput = { id: 99999 };

    // Try to delete non-existent asset
    const result = await deleteHardwareAsset(deleteInput);

    // Should return false indicating no deletion occurred
    expect(result).toBe(false);
  });

  it('should handle deletion when hardware asset has dependent software assets', async () => {
    // Create a hardware asset first
    const createResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        status: testHardwareInput.status,
        model: testHardwareInput.model,
        manufacturer: testHardwareInput.manufacturer,
        serial_number: testHardwareInput.serial_number,
        location: testHardwareInput.location,
        notes: testHardwareInput.notes
      })
      .returning()
      .execute();

    const createdAsset = createResult[0];

    // Create a dependent software asset
    await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'virtual_machine',
        status: 'running',
        host_hardware_id: createdAsset.id,
        operating_system: 'Ubuntu 22.04',
        version: '1.0.0',
        notes: 'Test software asset'
      })
      .execute();

    const deleteInput: IdInput = { id: createdAsset.id };

    // Try to delete hardware asset with dependent software - should fail due to foreign key constraint
    await expect(deleteHardwareAsset(deleteInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should handle deletion when hardware asset has dependent IP addresses', async () => {
    // Create a hardware asset first
    const createResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareInput.name,
        type: testHardwareInput.type,
        status: testHardwareInput.status,
        model: testHardwareInput.model,
        manufacturer: testHardwareInput.manufacturer,
        serial_number: testHardwareInput.serial_number,
        location: testHardwareInput.location,
        notes: testHardwareInput.notes
      })
      .returning()
      .execute();

    const createdAsset = createResult[0];

    // Create a dependent IP address
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet: '192.168.1.0/24',
        assignment_type: 'hardware',
        hardware_asset_id: createdAsset.id,
        software_asset_id: null,
        description: 'Test IP assignment',
        is_reserved: false
      })
      .execute();

    const deleteInput: IdInput = { id: createdAsset.id };

    // Try to delete hardware asset with dependent IP address - should fail due to foreign key constraint
    await expect(deleteHardwareAsset(deleteInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should delete multiple hardware assets independently', async () => {
    // Create multiple hardware assets
    const asset1Result = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server 1',
        type: 'server',
        status: 'active',
        model: 'Dell PowerEdge R740',
        manufacturer: 'Dell',
        serial_number: 'SN111111111',
        location: 'Data Center 1',
        notes: 'First test asset'
      })
      .returning()
      .execute();

    const asset2Result = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server 2',
        type: 'server',
        status: 'active',
        model: 'HPE ProLiant DL380',
        manufacturer: 'HPE',
        serial_number: 'SN222222222',
        location: 'Data Center 2',
        notes: 'Second test asset'
      })
      .returning()
      .execute();

    const asset1 = asset1Result[0];
    const asset2 = asset2Result[0];

    // Delete first asset
    const result1 = await deleteHardwareAsset({ id: asset1.id });
    expect(result1).toBe(true);

    // Verify first asset is deleted but second still exists
    const remainingAssets = await db.select()
      .from(hardwareAssetsTable)
      .execute();

    expect(remainingAssets).toHaveLength(1);
    expect(remainingAssets[0].id).toBe(asset2.id);
    expect(remainingAssets[0].name).toBe('Test Server 2');

    // Delete second asset
    const result2 = await deleteHardwareAsset({ id: asset2.id });
    expect(result2).toBe(true);

    // Verify all assets are deleted
    const finalAssets = await db.select()
      .from(hardwareAssetsTable)
      .execute();

    expect(finalAssets).toHaveLength(0);
  });
});
