import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { type DeleteInput, type CreateHardwareAssetInput } from '../schema';
import { getHardwareAsset } from '../handlers/get_hardware_asset';

// Test input for creating hardware assets
const testCreateInput: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'Server',
  make: 'Dell',
  model: 'PowerEdge R740',
  serial_number: 'SN123456789',
  description: 'Primary application server'
};

const testCreateInputMinimal: CreateHardwareAssetInput = {
  name: 'Minimal Asset',
  type: 'Laptop',
  make: 'HP',
  model: 'EliteBook',
  serial_number: null,
  description: null
};

describe('getHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing hardware asset by ID', async () => {
    // Create a hardware asset first
    const createResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testCreateInput.name,
        type: testCreateInput.type,
        make: testCreateInput.make,
        model: testCreateInput.model,
        serial_number: testCreateInput.serial_number,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const createdAsset = createResult[0];

    // Test retrieving the asset
    const input: DeleteInput = { id: createdAsset.id };
    const result = await getHardwareAsset(input);

    // Verify the retrieved asset matches what was created
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Test Server');
    expect(result!.type).toEqual('Server');
    expect(result!.make).toEqual('Dell');
    expect(result!.model).toEqual('PowerEdge R740');
    expect(result!.serial_number).toEqual('SN123456789');
    expect(result!.description).toEqual('Primary application server');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when hardware asset does not exist', async () => {
    // Test retrieving a non-existent asset
    const input: DeleteInput = { id: 999 };
    const result = await getHardwareAsset(input);

    expect(result).toBeNull();
  });

  it('should retrieve asset with null fields correctly', async () => {
    // Create a hardware asset with null optional fields
    const createResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testCreateInputMinimal.name,
        type: testCreateInputMinimal.type,
        make: testCreateInputMinimal.make,
        model: testCreateInputMinimal.model,
        serial_number: testCreateInputMinimal.serial_number,
        description: testCreateInputMinimal.description
      })
      .returning()
      .execute();

    const createdAsset = createResult[0];

    // Test retrieving the asset
    const input: DeleteInput = { id: createdAsset.id };
    const result = await getHardwareAsset(input);

    // Verify the retrieved asset handles null fields correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Minimal Asset');
    expect(result!.type).toEqual('Laptop');
    expect(result!.make).toEqual('HP');
    expect(result!.model).toEqual('EliteBook');
    expect(result!.serial_number).toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve the correct asset when multiple exist', async () => {
    // Create multiple hardware assets
    const createResults = await db.insert(hardwareAssetsTable)
      .values([
        {
          name: 'Server 1',
          type: 'Server',
          make: 'Dell',
          model: 'R740',
          serial_number: 'SN001',
          description: 'First server'
        },
        {
          name: 'Server 2',
          type: 'Server',
          make: 'HP',
          model: 'ProLiant',
          serial_number: 'SN002',
          description: 'Second server'
        },
        {
          name: 'Laptop 1',
          type: 'Laptop',
          make: 'Lenovo',
          model: 'ThinkPad',
          serial_number: 'SN003',
          description: 'Work laptop'
        }
      ])
      .returning()
      .execute();

    // Test retrieving the second server specifically
    const targetAsset = createResults[1];
    const input: DeleteInput = { id: targetAsset.id };
    const result = await getHardwareAsset(input);

    // Verify we get the correct specific asset
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetAsset.id);
    expect(result!.name).toEqual('Server 2');
    expect(result!.type).toEqual('Server');
    expect(result!.make).toEqual('HP');
    expect(result!.model).toEqual('ProLiant');
    expect(result!.serial_number).toEqual('SN002');
    expect(result!.description).toEqual('Second server');
  });

  it('should handle database query correctly with proper date types', async () => {
    // Create an asset and wait a moment to ensure different timestamps
    const createResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testCreateInput.name,
        type: testCreateInput.type,
        make: testCreateInput.make,
        model: testCreateInput.model,
        serial_number: testCreateInput.serial_number,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const createdAsset = createResult[0];

    // Retrieve the asset
    const input: DeleteInput = { id: createdAsset.id };
    const result = await getHardwareAsset(input);

    // Verify date handling
    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toEqual(createdAsset.created_at.getTime());
    expect(result!.updated_at.getTime()).toEqual(createdAsset.updated_at.getTime());
  });
});
