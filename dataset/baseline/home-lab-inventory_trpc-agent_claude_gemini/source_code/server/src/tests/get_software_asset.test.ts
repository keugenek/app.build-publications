import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type CreateHardwareAssetInput } from '../schema';
import { getSoftwareAsset } from '../handlers/get_software_asset';

// Test data
const testHardwareAsset: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R730',
  location: 'Data Center 1'
};

const testSoftwareAsset: CreateSoftwareAssetInput = {
  name: 'Test Application',
  type: 'application',
  host_id: null, // Will be set after creating hardware asset
  description: 'A test application'
};

const testSoftwareAssetWithoutHost: CreateSoftwareAssetInput = {
  name: 'Standalone Service',
  type: 'service',
  host_id: null,
  description: 'A standalone service'
};

describe('getSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a software asset by id', async () => {
    // Create test software asset
    const insertResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareAssetWithoutHost.name,
        type: testSoftwareAssetWithoutHost.type,
        host_id: testSoftwareAssetWithoutHost.host_id,
        description: testSoftwareAssetWithoutHost.description
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];

    // Test the handler
    const result = await getSoftwareAsset({ id: createdAsset.id });

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Standalone Service');
    expect(result!.type).toEqual('service');
    expect(result!.host_id).toBeNull();
    expect(result!.description).toEqual('A standalone service');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return software asset with host relationship', async () => {
    // First create a hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareAsset.name,
        type: testHardwareAsset.type,
        make: testHardwareAsset.make,
        model: testHardwareAsset.model,
        location: testHardwareAsset.location
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create software asset linked to hardware asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareAsset.name,
        type: testSoftwareAsset.type,
        host_id: hardwareAsset.id,
        description: testSoftwareAsset.description
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Test the handler
    const result = await getSoftwareAsset({ id: softwareAsset.id });

    expect(result).toBeDefined();
    expect(result!.id).toEqual(softwareAsset.id);
    expect(result!.name).toEqual('Test Application');
    expect(result!.type).toEqual('application');
    expect(result!.host_id).toEqual(hardwareAsset.id);
    expect(result!.description).toEqual('A test application');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent software asset', async () => {
    const result = await getSoftwareAsset({ id: 999999 });

    expect(result).toBeNull();
  });

  it('should handle software asset with null description', async () => {
    // Create software asset with null description
    const insertResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Minimal Asset',
        type: 'vm',
        host_id: null,
        description: null
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];

    // Test the handler
    const result = await getSoftwareAsset({ id: createdAsset.id });

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Minimal Asset');
    expect(result!.type).toEqual('vm');
    expect(result!.description).toBeNull();
    expect(result!.host_id).toBeNull();
  });

  it('should handle different software asset types', async () => {
    const assetTypes = ['vm', 'container', 'service', 'application', 'other'] as const;
    
    for (const type of assetTypes) {
      // Create software asset of each type
      const insertResult = await db.insert(softwareAssetsTable)
        .values({
          name: `Test ${type}`,
          type: type,
          host_id: null,
          description: `A test ${type}`
        })
        .returning()
        .execute();

      const createdAsset = insertResult[0];

      // Test the handler
      const result = await getSoftwareAsset({ id: createdAsset.id });

      expect(result).toBeDefined();
      expect(result!.type).toEqual(type);
      expect(result!.name).toEqual(`Test ${type}`);
    }
  });
});
