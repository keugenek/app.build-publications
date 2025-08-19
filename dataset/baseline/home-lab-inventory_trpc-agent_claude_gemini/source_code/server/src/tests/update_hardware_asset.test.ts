import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type UpdateHardwareAssetInput, type CreateHardwareAssetInput } from '../schema';
import { updateHardwareAsset } from '../handlers/update_hardware_asset';
import { eq } from 'drizzle-orm';

// Test data
const initialAsset: CreateHardwareAssetInput = {
  name: 'Original Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R730',
  location: 'Rack A1'
};

describe('updateHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update hardware asset name', async () => {
    // Create initial asset
    const created = await db.insert(hardwareAssetsTable)
      .values({
        name: initialAsset.name,
        type: initialAsset.type,
        make: initialAsset.make,
        model: initialAsset.model,
        location: initialAsset.location
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      name: 'Updated Server Name'
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.id).toEqual(assetId);
    expect(result.name).toEqual('Updated Server Name');
    expect(result.type).toEqual('server');
    expect(result.make).toEqual('Dell');
    expect(result.model).toEqual('PowerEdge R730');
    expect(result.location).toEqual('Rack A1');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create initial asset
    const created = await db.insert(hardwareAssetsTable)
      .values({
        name: initialAsset.name,
        type: initialAsset.type,
        make: initialAsset.make,
        model: initialAsset.model,
        location: initialAsset.location
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      name: 'Updated Server',
      type: 'router',
      make: 'Cisco',
      model: 'ISR 4000',
      location: 'Rack B2'
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.id).toEqual(assetId);
    expect(result.name).toEqual('Updated Server');
    expect(result.type).toEqual('router');
    expect(result.make).toEqual('Cisco');
    expect(result.model).toEqual('ISR 4000');
    expect(result.location).toEqual('Rack B2');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set nullable fields to null', async () => {
    // Create initial asset
    const created = await db.insert(hardwareAssetsTable)
      .values({
        name: initialAsset.name,
        type: initialAsset.type,
        make: initialAsset.make,
        model: initialAsset.model,
        location: initialAsset.location
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      make: null,
      model: null,
      location: null
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.id).toEqual(assetId);
    expect(result.name).toEqual('Original Server'); // Unchanged
    expect(result.type).toEqual('server'); // Unchanged
    expect(result.make).toBeNull();
    expect(result.model).toBeNull();
    expect(result.location).toBeNull();
  });

  it('should persist changes to database', async () => {
    // Create initial asset
    const created = await db.insert(hardwareAssetsTable)
      .values({
        name: initialAsset.name,
        type: initialAsset.type,
        make: initialAsset.make,
        model: initialAsset.model,
        location: initialAsset.location
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      name: 'Database Updated Server',
      type: 'firewall'
    };

    await updateHardwareAsset(updateInput);

    // Query database to verify changes were persisted
    const assets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Database Updated Server');
    expect(assets[0].type).toEqual('firewall');
    expect(assets[0].make).toEqual('Dell'); // Unchanged
  });

  it('should update the updated_at timestamp', async () => {
    // Create initial asset
    const created = await db.insert(hardwareAssetsTable)
      .values({
        name: initialAsset.name,
        type: initialAsset.type,
        make: initialAsset.make,
        model: initialAsset.model,
        location: initialAsset.location
      })
      .returning()
      .execute();

    const assetId = created[0].id;
    const originalUpdatedAt = created[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      name: 'Timestamp Test'
    };

    const result = await updateHardwareAsset(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.created_at).toEqual(created[0].created_at);
  });

  it('should throw error when asset not found', async () => {
    const updateInput: UpdateHardwareAssetInput = {
      id: 99999, // Non-existent ID
      name: 'Should Not Work'
    };

    expect(updateHardwareAsset(updateInput)).rejects.toThrow(/hardware asset with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create initial asset
    const created = await db.insert(hardwareAssetsTable)
      .values({
        name: initialAsset.name,
        type: initialAsset.type,
        make: initialAsset.make,
        model: initialAsset.model,
        location: initialAsset.location
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    // Update only the type field
    const updateInput: UpdateHardwareAssetInput = {
      id: assetId,
      type: 'switch'
    };

    const result = await updateHardwareAsset(updateInput);

    // Only type should be updated, everything else should remain the same
    expect(result.id).toEqual(assetId);
    expect(result.name).toEqual('Original Server'); // Unchanged
    expect(result.type).toEqual('switch'); // Changed
    expect(result.make).toEqual('Dell'); // Unchanged
    expect(result.model).toEqual('PowerEdge R730'); // Unchanged
    expect(result.location).toEqual('Rack A1'); // Unchanged
  });
});
