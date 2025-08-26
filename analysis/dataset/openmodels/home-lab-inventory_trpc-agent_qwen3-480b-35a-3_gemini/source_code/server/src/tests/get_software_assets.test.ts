import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';
import { getSoftwareAssets } from '../handlers/get_software_assets';
import { eq } from 'drizzle-orm';

// Test data
const testSoftwareAssets: Omit<SoftwareAsset, 'id' | 'created_at'>[] = [
  {
    name: 'Web Server',
    type: 'Server',
    operatingSystem: 'Ubuntu 20.04',
    host: '192.168.1.10'
  },
  {
    name: 'Database Server',
    type: 'Server',
    operatingSystem: 'CentOS 8',
    host: '192.168.1.20'
  }
];

describe('getSoftwareAssets', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    for (const asset of testSoftwareAssets) {
      await db.insert(softwareAssetsTable).values(asset).execute();
    }
  });
  
  afterEach(resetDB);

  it('should return all software assets', async () => {
    const result = await getSoftwareAssets();

    expect(result).toHaveLength(2);
    
    // Check first asset
    expect(result[0]).toMatchObject({
      name: 'Web Server',
      type: 'Server',
      operatingSystem: 'Ubuntu 20.04',
      host: '192.168.1.10'
    });
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Check second asset
    expect(result[1]).toMatchObject({
      name: 'Database Server',
      type: 'Server',
      operatingSystem: 'CentOS 8',
      host: '192.168.1.20'
    });
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no software assets exist', async () => {
    // Clear the database
    await db.delete(softwareAssetsTable).execute();
    
    const result = await getSoftwareAssets();
    
    expect(result).toHaveLength(0);
  });

  it('should return software assets with correct data types', async () => {
    const result = await getSoftwareAssets();

    expect(result).toHaveLength(2);
    
    result.forEach(asset => {
      expect(typeof asset.id).toBe('number');
      expect(typeof asset.name).toBe('string');
      expect(typeof asset.type).toBe('string');
      expect(typeof asset.operatingSystem).toBe('string');
      expect(typeof asset.host).toBe('string');
      expect(asset.created_at).toBeInstanceOf(Date);
    });
  });
});
