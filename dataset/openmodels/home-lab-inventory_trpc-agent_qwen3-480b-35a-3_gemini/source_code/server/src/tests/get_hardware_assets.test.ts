import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { getHardwareAssets } from '../handlers/get_hardware_assets';
import { eq } from 'drizzle-orm';

describe('getHardwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no hardware assets exist', async () => {
    const result = await getHardwareAssets();
    expect(result).toEqual([]);
  });

  it('should return all hardware assets when they exist', async () => {
    // Insert test data
    const testAssets = [
      {
        name: 'Laptop 1',
        type: 'laptop',
        model: 'Model X',
        serialNumber: 'SN123456',
        location: 'Office 101'
      },
      {
        name: 'Server 1',
        type: 'server',
        model: 'Model Y',
        serialNumber: 'SN789012',
        location: 'Data Center A'
      }
    ];

    // Insert the test assets
    const insertedAssets = await Promise.all(
      testAssets.map(asset => 
        db.insert(hardwareAssetsTable)
          .values(asset)
          .returning()
          .execute()
      )
    );

    // Flatten the array of arrays
    const flattenedAssets = insertedAssets.flat();

    // Call the handler
    const result = await getHardwareAssets();

    // Validate the results
    expect(result).toHaveLength(2);
    
    // Check that all properties match
    result.forEach((asset, index) => {
      expect(asset.id).toEqual(flattenedAssets[index].id);
      expect(asset.name).toEqual(testAssets[index].name);
      expect(asset.type).toEqual(testAssets[index].type);
      expect(asset.model).toEqual(testAssets[index].model);
      expect(asset.serialNumber).toEqual(testAssets[index].serialNumber);
      expect(asset.location).toEqual(testAssets[index].location);
      expect(asset.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return hardware assets with proper date objects', async () => {
    // Insert a test asset
    const testAsset = {
      name: 'Desktop 1',
      type: 'desktop',
      model: 'Model Z',
      serialNumber: 'SN345678',
      location: 'Office 202'
    };

    await db.insert(hardwareAssetsTable)
      .values(testAsset)
      .execute();

    // Call the handler
    const result = await getHardwareAssets();

    // Validate that created_at is a Date object
    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(typeof result[0].created_at.getTime).toBe('function'); // Verify it's a valid Date
  });
});
