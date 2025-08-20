import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type DeleteInput, type CreateHardwareAssetInput } from '../schema';
import { deleteHardwareAsset } from '../handlers/delete_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input for creating a hardware asset to delete
const testCreateInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'Server',
  make: 'Dell',
  model: 'PowerEdge R730',
  serial_number: 'SN123456789',
  description: 'Test server for deletion'
};

describe('deleteHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing hardware asset', async () => {
    // First, create a hardware asset to delete
    const createResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testCreateInput.name,
        type: testCreateInput.type,
        make: testCreateInput.make,
        model: testCreateInput.model,
        serial_number: testCreateInput.serial_number,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const createdAsset = createResult[0];
    expect(createdAsset.id).toBeDefined();

    // Delete the hardware asset
    const deleteInput: DeleteInput = { id: createdAsset.id };
    const result = await deleteHardwareAsset(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify the asset no longer exists in the database
    const deletedAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, createdAsset.id))
      .execute();

    expect(deletedAsset).toHaveLength(0);
  });

  it('should throw error when hardware asset does not exist', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteInput = { id: nonExistentId };

    // Attempt to delete non-existent hardware asset
    await expect(deleteHardwareAsset(deleteInput))
      .rejects
      .toThrow(/Hardware asset with id 99999 not found/i);
  });

  it('should not affect other hardware assets when deleting one', async () => {
    // Create two hardware assets
    const asset1Result = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Server 1',
        type: 'Server',
        make: 'Dell',
        model: 'R730',
        serial_number: 'SN001',
        description: 'First server'
      })
      .returning()
      .execute();

    const asset2Result = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Server 2',
        type: 'Server',
        make: 'HP',
        model: 'ProLiant DL380',
        serial_number: 'SN002',
        description: 'Second server'
      })
      .returning()
      .execute();

    const asset1 = asset1Result[0];
    const asset2 = asset2Result[0];

    // Delete the first asset
    const deleteInput: DeleteInput = { id: asset1.id };
    const result = await deleteHardwareAsset(deleteInput);

    expect(result.success).toBe(true);

    // Verify first asset is deleted
    const deletedAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, asset1.id))
      .execute();

    expect(deletedAsset).toHaveLength(0);

    // Verify second asset still exists
    const remainingAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, asset2.id))
      .execute();

    expect(remainingAsset).toHaveLength(1);
    expect(remainingAsset[0].name).toEqual('Server 2');
    expect(remainingAsset[0].make).toEqual('HP');
  });

  it('should handle deletion with minimal data asset', async () => {
    // Create hardware asset with only required fields
    const minimalCreateResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Minimal Asset',
        type: 'Workstation',
        make: 'Generic',
        model: 'Basic',
        serial_number: null,
        description: null
      })
      .returning()
      .execute();

    const minimalAsset = minimalCreateResult[0];

    // Delete the minimal hardware asset
    const deleteInput: DeleteInput = { id: minimalAsset.id };
    const result = await deleteHardwareAsset(deleteInput);

    expect(result.success).toBe(true);

    // Verify deletion
    const deletedAsset = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, minimalAsset.id))
      .execute();

    expect(deletedAsset).toHaveLength(0);
  });
});
