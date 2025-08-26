import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type SoftwareAsset } from '../schema';
import { getSoftwareAssets } from '../handlers/get_software_assets';
import { eq } from 'drizzle-orm';

// Helper to create a hardware asset (host) for software assets
const createHardwareHost = async () => {
  const result = await db
    .insert(hardwareAssetsTable)
    .values({
      name: 'Host Server',
      type: 'server',
      description: 'Primary host for software assets',
    })
    .returning()
    .execute();
  return result[0];
};

// Test input for software asset
const createSoftwareAsset = async (hostId: number) => {
  const result = await db
    .insert(softwareAssetsTable)
    .values({
      name: 'Test VM',
      type: 'vm',
      host_id: hostId,
      description: 'A test virtual machine',
    })
    .returning()
    .execute();
  return result[0];
};

describe('getSoftwareAssets handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no software assets exist', async () => {
    const assets = await getSoftwareAssets();
    expect(Array.isArray(assets)).toBe(true);
    expect(assets).toHaveLength(0);
  });

  it('should fetch all software assets from the database', async () => {
    // Arrange: create host and a software asset linked to it
    const host = await createHardwareHost();
    const inserted = await createSoftwareAsset(host.id);

    // Act: fetch via handler
    const assets = await getSoftwareAssets();

    // Assert: array contains the inserted asset
    expect(assets).toHaveLength(1);
    const asset = assets[0] as SoftwareAsset;
    expect(asset.id).toBe(inserted.id);
    expect(asset.name).toBe('Test VM');
    expect(asset.type).toBe('vm');
    expect(asset.host_id).toBe(host.id);
    expect(asset.description).toBe('A test virtual machine');
    expect(asset.created_at).toBeInstanceOf(Date);
  });

  it('should correctly query the database directly as well', async () => {
    const host = await createHardwareHost();
    const inserted = await createSoftwareAsset(host.id);

    // Direct DB query for verification
    const rows = await db.select().from(softwareAssetsTable).where(eq(softwareAssetsTable.id, inserted.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.id).toBe(inserted.id);
    expect(row.name).toBe('Test VM');
    expect(row.type).toBe('vm');
    expect(row.host_id).toBe(host.id);
    expect(row.description).toBe('A test virtual machine');
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
