import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { getHardwareAssets } from '../handlers/get_hardware_assets';

describe('getHardwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no hardware assets exist', async () => {
    const result = await getHardwareAssets();

    expect(result).toEqual([]);
  });

  it('should return all hardware assets', async () => {
    // Create test hardware assets
    await db.insert(hardwareAssetsTable)
      .values([
        {
          name: 'Test Server 1',
          type: 'Server',
          manufacturer: 'Dell',
          model: 'PowerEdge R740',
          description: 'Primary web server'
        },
        {
          name: 'Test Switch 1',
          type: 'Switch',
          manufacturer: 'Cisco',
          model: 'Catalyst 2960',
          description: 'Network switch for floor 1'
        },
        {
          name: 'Test Router 1',
          type: 'Router',
          manufacturer: 'Juniper',
          model: 'MX204',
          description: null
        }
      ])
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(3);
    
    // Verify first asset
    expect(result[0].name).toBe('Test Server 1');
    expect(result[0].type).toBe('Server');
    expect(result[0].manufacturer).toBe('Dell');
    expect(result[0].model).toBe('PowerEdge R740');
    expect(result[0].description).toBe('Primary web server');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second asset
    expect(result[1].name).toBe('Test Switch 1');
    expect(result[1].type).toBe('Switch');
    expect(result[1].manufacturer).toBe('Cisco');
    expect(result[1].model).toBe('Catalyst 2960');
    expect(result[1].description).toBe('Network switch for floor 1');

    // Verify third asset (with null description)
    expect(result[2].name).toBe('Test Router 1');
    expect(result[2].type).toBe('Router');
    expect(result[2].manufacturer).toBe('Juniper');
    expect(result[2].model).toBe('MX204');
    expect(result[2].description).toBeNull();
  });

  it('should return assets in insertion order', async () => {
    // Create test hardware assets in specific order
    const asset1 = await db.insert(hardwareAssetsTable)
      .values({
        name: 'First Asset',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'R720',
        description: 'First server'
      })
      .returning()
      .execute();

    const asset2 = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Second Asset',
        type: 'Switch',
        manufacturer: 'Cisco',
        model: '2960',
        description: 'First switch'
      })
      .returning()
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(asset1[0].id);
    expect(result[0].name).toBe('First Asset');
    expect(result[1].id).toBe(asset2[0].id);
    expect(result[1].name).toBe('Second Asset');
  });

  it('should handle large number of hardware assets', async () => {
    // Create multiple assets to test performance
    const assets = Array.from({ length: 50 }, (_, i) => ({
      name: `Test Asset ${i + 1}`,
      type: i % 2 === 0 ? 'Server' : 'Switch',
      manufacturer: i % 3 === 0 ? 'Dell' : i % 3 === 1 ? 'Cisco' : 'HP',
      model: `Model-${i + 1}`,
      description: i % 5 === 0 ? null : `Description for asset ${i + 1}`
    }));

    await db.insert(hardwareAssetsTable)
      .values(assets)
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(50);
    expect(result.every(asset => asset.id !== undefined)).toBe(true);
    expect(result.every(asset => asset.name.startsWith('Test Asset'))).toBe(true);
    expect(result.every(asset => asset.created_at instanceof Date)).toBe(true);
    expect(result.every(asset => asset.updated_at instanceof Date)).toBe(true);
  });

  it('should return assets with all required fields', async () => {
    await db.insert(hardwareAssetsTable)
      .values({
        name: 'Complete Asset',
        type: 'Storage',
        manufacturer: 'NetApp',
        model: 'FAS2720',
        description: 'Primary storage array'
      })
      .execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(1);
    const asset = result[0];

    // Verify all required fields are present
    expect(typeof asset.id).toBe('number');
    expect(typeof asset.name).toBe('string');
    expect(typeof asset.type).toBe('string');
    expect(typeof asset.manufacturer).toBe('string');
    expect(typeof asset.model).toBe('string');
    expect(asset.description === null || typeof asset.description === 'string').toBe(true);
    expect(asset.created_at).toBeInstanceOf(Date);
    expect(asset.updated_at).toBeInstanceOf(Date);
  });
});
