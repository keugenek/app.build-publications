import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { getSoftwareAssets } from '../handlers/get_software_assets';
import { eq } from 'drizzle-orm';

describe('getSoftwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no software assets exist', async () => {
    const result = await getSoftwareAssets();
    expect(result).toEqual([]);
  });

  it('should return all software assets when they exist', async () => {
    // Insert test data
    const testAssets = [
      {
        name: 'Test VM 1',
        type: 'VM' as const,
        host_id: 1,
        operating_system: 'Ubuntu 20.04',
        description: 'A test virtual machine'
      },
      {
        name: 'Test Container 1',
        type: 'Container' as const,
        host_id: 2,
        operating_system: 'Alpine Linux',
        description: 'A test container'
      }
    ];

    // Insert test assets
    const insertedAssets = await Promise.all(
      testAssets.map(asset => 
        db.insert(softwareAssetsTable)
          .values(asset)
          .returning()
          .execute()
          .then(result => result[0])
      )
    );

    const result = await getSoftwareAssets();
    
    expect(result).toHaveLength(2);
    
    // Check that all properties match
    result.forEach((asset, index) => {
      expect(asset.name).toEqual(testAssets[index].name);
      expect(asset.type).toEqual(testAssets[index].type);
      expect(asset.host_id).toEqual(testAssets[index].host_id);
      expect(asset.operating_system).toEqual(testAssets[index].operating_system);
      expect(asset.description).toEqual(testAssets[index].description);
      expect(asset.id).toBeDefined();
      expect(asset.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return software assets with null descriptions', async () => {
    // Insert test data with null description
    const result = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        host_id: 1,
        operating_system: 'CentOS',
        description: null
      })
      .returning()
      .execute();

    const assets = await getSoftwareAssets();
    
    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Test VM');
    expect(assets[0].description).toBeNull();
    expect(assets[0].created_at).toBeInstanceOf(Date);
  });
});
