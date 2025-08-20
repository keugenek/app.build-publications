import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getSoftwareAssetById } from '../handlers/get_software_asset_by_id';

describe('getSoftwareAssetById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return software asset by ID', async () => {
    // Create a test hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge',
        description: 'Test hardware'
      })
      .returning()
      .execute();

    const hardwareAssetId = hardwareResult[0].id;

    // Create a test software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'A test virtual machine',
        hardware_asset_id: hardwareAssetId
      })
      .returning()
      .execute();

    const testInput: GetByIdInput = {
      id: softwareResult[0].id
    };

    const result = await getSoftwareAssetById(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(softwareResult[0].id);
    expect(result!.name).toBe('Test VM');
    expect(result!.type).toBe('VM');
    expect(result!.description).toBe('A test virtual machine');
    expect(result!.hardware_asset_id).toBe(hardwareAssetId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return software asset without hardware_asset_id', async () => {
    // Create a test software asset without hardware association
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Standalone Service',
        type: 'Service',
        description: 'A standalone service',
        hardware_asset_id: null
      })
      .returning()
      .execute();

    const testInput: GetByIdInput = {
      id: softwareResult[0].id
    };

    const result = await getSoftwareAssetById(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(softwareResult[0].id);
    expect(result!.name).toBe('Standalone Service');
    expect(result!.type).toBe('Service');
    expect(result!.description).toBe('A standalone service');
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return software asset with null description', async () => {
    // Create a test software asset with null description
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Container App',
        type: 'Container',
        description: null,
        hardware_asset_id: null
      })
      .returning()
      .execute();

    const testInput: GetByIdInput = {
      id: softwareResult[0].id
    };

    const result = await getSoftwareAssetById(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(softwareResult[0].id);
    expect(result!.name).toBe('Container App');
    expect(result!.type).toBe('Container');
    expect(result!.description).toBeNull();
    expect(result!.hardware_asset_id).toBeNull();
  });

  it('should return null for non-existent software asset', async () => {
    const testInput: GetByIdInput = {
      id: 999999 // Non-existent ID
    };

    const result = await getSoftwareAssetById(testInput);

    expect(result).toBeNull();
  });

  it('should return the correct software asset when multiple exist', async () => {
    // Create multiple software assets
    const software1 = await db.insert(softwareAssetsTable)
      .values({
        name: 'First VM',
        type: 'VM',
        description: 'First virtual machine',
        hardware_asset_id: null
      })
      .returning()
      .execute();

    const software2 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Second VM',
        type: 'VM',
        description: 'Second virtual machine',
        hardware_asset_id: null
      })
      .returning()
      .execute();

    // Request the second software asset
    const testInput: GetByIdInput = {
      id: software2[0].id
    };

    const result = await getSoftwareAssetById(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(software2[0].id);
    expect(result!.name).toBe('Second VM');
    expect(result!.description).toBe('Second virtual machine');
    
    // Ensure it's not the first software asset
    expect(result!.id).not.toBe(software1[0].id);
    expect(result!.name).not.toBe('First VM');
  });
});
