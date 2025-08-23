import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { createSoftwareAsset } from '../handlers/create_software_asset';
import { eq } from 'drizzle-orm';

// Helper to create a hardware asset for tests
const createHardwareAsset = async () => {
  const result = await db
    .insert(hardwareAssetsTable)
    .values({
      name: 'Test Host',
      type: 'server',
      description: 'Host for software assets',
    })
    .returning()
    .execute();
  return result[0];
};

const testInput: CreateSoftwareAssetInput = {
  name: 'Test Software',
  type: 'vm',
  host_id: 0, // will be overwritten after host creation
  description: 'A test software asset',
};

describe('createSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a software asset linked to an existing hardware host', async () => {
    const host = await createHardwareAsset();
    const input = { ...testInput, host_id: host.id };

    const result = await createSoftwareAsset(input);

    // Verify returned fields
    expect(result.id).toBeDefined();
    expect(result.name).toBe(input.name);
    expect(result.type).toBe(input.type);
    expect(result.host_id).toBe(host.id);
    expect(result.description).toBe(input.description);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify record exists in DB
    const records = await db
      .select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();
    expect(records).toHaveLength(1);
    const record = records[0];
    expect(record.name).toBe(input.name);
    expect(record.type).toBe(input.type);
    expect(record.host_id).toBe(host.id);
    expect(record.description).toBe(input.description);
  });

  it('should throw an error when the hardware host does not exist', async () => {
    const input = { ...testInput, host_id: 9999 };
    await expect(createSoftwareAsset(input)).rejects.toThrow('Hardware asset not found');
  });
});
