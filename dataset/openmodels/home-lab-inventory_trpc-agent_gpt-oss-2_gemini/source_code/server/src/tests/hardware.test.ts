// Tests for hardware asset handlers
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput, type UpdateHardwareAssetInput } from '../schema';
import { createHardwareAsset, getHardwareAssets, updateHardwareAsset, deleteHardwareAsset } from '../handlers/hardware';
import { eq } from 'drizzle-orm';

const testInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R740',
  serial_number: 'SN123456',
  location: 'Data Center A',
};

describe('hardware asset handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset and persist it', async () => {
    const asset = await createHardwareAsset(testInput);
    expect(asset.id).toBeGreaterThan(0);
    expect(asset.name).toBe(testInput.name);
    expect(asset.type).toBe(testInput.type);
    expect(asset.created_at).toBeInstanceOf(Date);

    // Verify directly from DB
    const rows = await db.select().from(hardwareAssetsTable).where(eq(hardwareAssetsTable.id, asset.id)).execute();
    expect(rows).toHaveLength(1);
    const dbAsset = rows[0];
    expect(dbAsset.name).toBe(testInput.name);
    expect(dbAsset.serial_number).toBe(testInput.serial_number);
  });

  it('should retrieve all hardware assets', async () => {
    // Insert two assets
    await createHardwareAsset(testInput);
    const secondInput: CreateHardwareAssetInput = { ...testInput, name: 'Switch 1', type: 'switch', serial_number: 'SN654321' };
    await createHardwareAsset(secondInput);

    const assets = await getHardwareAssets();
    expect(assets.length).toBeGreaterThanOrEqual(2);
    const names = assets.map(a => a.name);
    expect(names).toContain('Test Server');
    expect(names).toContain('Switch 1');
  });

  it('should update a hardware asset', async () => {
    const created = await createHardwareAsset(testInput);
    const updateInput: UpdateHardwareAssetInput = {
      id: created.id,
      name: 'Updated Server',
      location: 'Data Center B',
    };
    const updated = await updateHardwareAsset(updateInput);
    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe('Updated Server');
    expect(updated.location).toBe('Data Center B');
    // unchanged fields remain the same
    expect(updated.make).toBe(testInput.make);
  });

  it('should delete a hardware asset', async () => {
    const created = await createHardwareAsset(testInput);
    const result = await deleteHardwareAsset({ id: created.id });
    expect(result.success).toBe(true);
    const rows = await db.select().from(hardwareAssetsTable).where(eq(hardwareAssetsTable.id, created.id)).execute();
    expect(rows).toHaveLength(0);
  });
});
