import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type CreateHardwareAssetInput } from '../schema';
import { createHardwareAsset } from '../handlers/create_hardware_asset';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  description: 'Primary test server',
};

describe('createHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hardware asset and return proper fields', async () => {
    const result = await createHardwareAsset(testInput);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInput.name);
    expect(result.type).toBe(testInput.type);
    expect(result.description).toBe(testInput.description);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the hardware asset in the database', async () => {
    const result = await createHardwareAsset(testInput);

    const rows = await db
      .select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(testInput.name);
    expect(row.type).toBe(testInput.type);
    expect(row.description).toBe(testInput.description);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
