import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type HardwareAsset } from '../schema';
import { getHardwareAssets } from '../handlers/get_hardware_assets';
import { eq } from 'drizzle-orm';

const testAsset: Omit<HardwareAsset, 'id' | 'created_at'> = {
  name: 'Core Switch',
  type: 'switch',
  description: 'Main network switch',
};

describe('getHardwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no hardware assets exist', async () => {
    const assets = await getHardwareAssets();
    expect(assets).toBeInstanceOf(Array);
    expect(assets).toHaveLength(0);
  });

  it('should fetch all hardware assets from the database', async () => {
    // Insert a hardware asset directly via Drizzle
    const inserted = await db
      .insert(hardwareAssetsTable)
      .values({
        name: testAsset.name,
        type: testAsset.type,
        description: testAsset.description,
      })
      .returning()
      .execute();

    const insertedAsset = inserted[0];
    expect(insertedAsset.id).toBeDefined();
    expect(insertedAsset.created_at).toBeInstanceOf(Date);

    const assets = await getHardwareAssets();
    expect(assets).toHaveLength(1);
    const asset = assets[0];
    expect(asset.id).toEqual(insertedAsset.id);
    expect(asset.name).toEqual(testAsset.name);
    expect(asset.type).toEqual(testAsset.type);
    expect(asset.description).toEqual(testAsset.description);
    expect(asset.created_at).toBeInstanceOf(Date);
  });

  it('should return all existing hardware assets', async () => {
    // Insert two assets
    await db.insert(hardwareAssetsTable).values([
      { name: 'Server01', type: 'server', description: null },
      { name: 'Switch01', type: 'switch', description: 'Edge switch' },
    ]).execute();

    const assets = await getHardwareAssets();
    expect(assets).toHaveLength(2);
    const names = assets.map((a) => a.name);
    expect(names).toContain('Server01');
    expect(names).toContain('Switch01');
  });
});
