import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import type { CreateSoftwareAssetInput, UpdateSoftwareAssetInput, DeleteSoftwareAssetInput } from '../schema';
import { createSoftwareAsset, getSoftwareAssets, updateSoftwareAsset, deleteSoftwareAsset } from '../handlers/software';
import { eq } from 'drizzle-orm';

// Helper to create a hardware asset for foreign key
const createHardwareHost = async () => {
  const [host] = await db
    .insert(hardwareAssetsTable)
    .values({
      name: 'Host Machine',
      type: 'server',
      make: 'Acme',
      model: 'X1000',
      serial_number: 'SN-001',
      location: 'Rack 42',
    })
    .returning()
    .execute();
  return host;
};

const testInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'vm',
  host_hardware_id: 0, // will be replaced with actual host id in test
  operating_system: 'Linux',
  purpose: 'Testing',
};

describe('software asset handlers', () => {
  beforeEach(async () => {
    await createDB();
    const host = await createHardwareHost();
    // update host id in test input
    testInput.host_hardware_id = host.id;
  });
  afterEach(resetDB);

  it('should create a software asset', async () => {
    const created = await createSoftwareAsset(testInput);
    expect(created.id).toBeDefined();
    expect(created.name).toBe(testInput.name);
    expect(created.type).toBe(testInput.type);
    expect(created.host_hardware_id).toBe(testInput.host_hardware_id);
    expect(created.operating_system).toBe(testInput.operating_system);
    expect(created.purpose).toBe(testInput.purpose);
    expect(created.created_at).toBeInstanceOf(Date);
  });

  it('should retrieve all software assets', async () => {
    const created = await createSoftwareAsset(testInput);
    const assets = await getSoftwareAssets();
    const found = assets.find(a => a.id === created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe(testInput.name);
  });

  it('should update a software asset', async () => {
    const created = await createSoftwareAsset(testInput);
    const updateInput: UpdateSoftwareAssetInput = {
      id: created.id,
      name: 'Updated VM',
    };
    const updated = await updateSoftwareAsset(updateInput);
    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe('Updated VM');
    // unchanged fields remain the same
    expect(updated.type).toBe(created.type);
  });

  it('should delete a software asset', async () => {
    const created = await createSoftwareAsset(testInput);
    const delInput: DeleteSoftwareAssetInput = { id: created.id };
    const result = await deleteSoftwareAsset(delInput);
    expect(result.success).toBe(true);

    const remaining = await db
      .select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, created.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });
});
