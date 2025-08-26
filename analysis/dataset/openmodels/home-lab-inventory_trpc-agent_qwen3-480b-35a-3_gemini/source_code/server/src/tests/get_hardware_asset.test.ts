import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { getHardwareAsset } from '../handlers/get_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input for creating a hardware asset
const testInput: CreateHardwareAssetInput = {
  name: 'Test Laptop',
  type: 'Laptop',
  model: 'MacBook Pro',
  serialNumber: 'ABC123XYZ',
  location: 'Office 101'
};

describe('getHardwareAsset', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test hardware asset
    await db.insert(hardwareAssetsTable).values({
      name: testInput.name,
      type: testInput.type,
      model: testInput.model,
      serialNumber: testInput.serialNumber,
      location: testInput.location
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch an existing hardware asset by ID', async () => {
    // First, get the ID of the created asset
    const createdAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.serialNumber, testInput.serialNumber))
      .execute();
    
    expect(createdAssets).toHaveLength(1);
    const assetId = createdAssets[0].id;
    
    // Now test our handler
    const result = await getHardwareAsset(assetId);
    
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    expect(result?.id).toBe(assetId);
    expect(result?.name).toBe(testInput.name);
    expect(result?.type).toBe(testInput.type);
    expect(result?.model).toBe(testInput.model);
    expect(result?.serialNumber).toBe(testInput.serialNumber);
    expect(result?.location).toBe(testInput.location);
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent hardware asset', async () => {
    const result = await getHardwareAsset(99999);
    expect(result).toBeNull();
  });

  it('should return null for invalid ID', async () => {
    // Test with invalid ID (negative number)
    const result = await getHardwareAsset(-1);
    expect(result).toBeNull();
  });
});
